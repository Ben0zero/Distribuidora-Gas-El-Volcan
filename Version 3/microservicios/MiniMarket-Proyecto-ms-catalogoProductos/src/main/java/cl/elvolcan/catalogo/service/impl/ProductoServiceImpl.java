package cl.elvolcan.catalogo.service.impl;

import cl.elvolcan.catalogo.exception.ProductoConVentasException;
import cl.elvolcan.catalogo.exception.ProductoNoEncontradoException;
import feign.FeignException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import cl.elvolcan.catalogo.dto.ProductoRequestDTO;
import cl.elvolcan.catalogo.dto.ProductoResponseDTO;
import cl.elvolcan.catalogo.dto.InventarioInitDTO; // AsegÃºrate de este import
import cl.elvolcan.catalogo.model.Producto;
import cl.elvolcan.catalogo.repository.ProductoRepository;
import cl.elvolcan.catalogo.service.ProductoService;
import cl.elvolcan.catalogo.client.InventarioClient;
import cl.elvolcan.catalogo.client.VentasClient;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements ProductoService {

    private static final Logger log = LoggerFactory.getLogger(ProductoServiceImpl.class);

    // Niveles con que se crea el inventario de un producto nuevo
    static final double NIVEL_CRITICO_INICIAL = 5.0;
    static final double NIVEL_MAXIMO_INICIAL = 500.0;

    private final ProductoRepository productoRepository;
    private final InventarioClient inventarioClient;
    private final VentasClient ventasClient;

    @Override
    public ProductoResponseDTO crearProducto(ProductoRequestDTO request) {

        // 1. Validar si el SKU ya existe en CatÃ¡logo
        if (productoRepository.existsBySku(request.getSku())) {
            throw new IllegalArgumentException("Error: Ya existe un producto con el SKU: " + request.getSku());
        }

        // 2. Mapear de DTO a entidad Producto
        Producto producto = new Producto();
        producto.setSku(request.getSku());
        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setCategoria(request.getCategoria());
        producto.setImagen(request.getImagen());
        producto.setActivo(true);

        Integer pRes = request.getPrecioResidencial() != null ? request.getPrecioResidencial() : request.getPrecio();
        Integer pCom = request.getPrecioComercial() != null ? request.getPrecioComercial() : pRes;
        producto.setPrecioResidencial(pRes);
        producto.setPrecioComercial(pCom);
        producto.setPrecio(pRes);

        // 3. Guardar en la BD de CatÃ¡logo
        Producto guardado = productoRepository.save(producto);

        // 4. TraducciÃ³n: Preparar el objeto que Inventario espera
        InventarioInitDTO invDto = new InventarioInitDTO();
        invDto.setSku(guardado.getSku());
        invDto.setStockActual(0.0);
        // mismos niveles que la semilla de ms-inventario (crítico 5, máximo 500)
        invDto.setNivelCritico(NIVEL_CRITICO_INICIAL);
        invDto.setNivelMaximo(NIVEL_MAXIMO_INICIAL);

        // 5. Llamar a Inventario vÃ­a Feign (el Interceptor inyectarÃ¡ el token automÃ¡ticamente)
        inventarioClient.crearInventario(invDto);

        // 6. Retornar la respuesta
        return mapearADTO(guardado);
    }

    @Override
    public List<ProductoResponseDTO> obtenerTodosActivos() {
        return productoRepository.findByActivoTrue().stream()
                .map(this::mapearADTO)
                .collect(Collectors.toList());
    }

    @Override
    public ProductoResponseDTO obtenerPorSku(String sku) {
        Producto producto = productoRepository.findBySku(sku)
                .orElseThrow(() -> new ProductoNoEncontradoException("Producto no encontrado con SKU: " + sku));
        return mapearADTO(producto);
    }

    /**
     * Borrado definitivo. Orden pensado para no dejar nada a medias:
     * 1) el producto debe existir (404); 2) se pregunta a ms-ventas si tiene ventas (409 si las tiene);
     * 3) se borra el producto (aún sin confirmar la transacción); 4) se borra su inventario en ms-inventario.
     * Si ms-ventas o ms-inventario fallan, la FeignException hace rollback y no se borra nada (502).
     * Un 404 de inventario se acepta: el producto no tenía registro de stock.
     * Límite conocido: una venta creada justo entre el paso 2 y el 3 no se detecta (no hay transacción distribuida).
     */
    @Override
    @Transactional
    public void eliminarProducto(String sku) {
        Producto producto = productoRepository.findBySku(sku)
                .orElseThrow(() -> new ProductoNoEncontradoException("Producto no encontrado con SKU: " + sku));

        List<Long> vendidos = ventasClient.productosVendidos();
        if (vendidos != null && vendidos.contains(producto.getId())) {
            throw new ProductoConVentasException();
        }

        productoRepository.delete(producto);
        productoRepository.flush();
        try {
            inventarioClient.eliminarInventario(sku);
        } catch (FeignException.NotFound sinRegistro) {
            log.info("El producto {} no tenía registro de inventario", sku);
        }
        log.info("Producto eliminado definitivamente: sku={} id={}", sku, producto.getId());
    }

    @Override
    public ProductoResponseDTO actualizarProducto(Long id, ProductoRequestDTO request) {
        Producto producto = productoRepository.findById(id)
            .orElseThrow(() -> new ProductoNoEncontradoException("Producto no encontrado con ID: " + id));

        // El SKU identifica el producto en ms-inventario: cambiarlo dejaría el stock huérfano
        if (request.getSku() != null && !request.getSku().equalsIgnoreCase(producto.getSku())) {
            throw new IllegalArgumentException("El SKU no se puede modificar (actual: " + producto.getSku() + ")");
        }

        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setCategoria(request.getCategoria());
        if (request.getImagen() != null && !request.getImagen().isBlank()) {
            producto.setImagen(request.getImagen());
        }
        Integer pRes = request.getPrecioResidencial() != null ? request.getPrecioResidencial() : request.getPrecio();
        if (pRes != null) {
            producto.setPrecioResidencial(pRes);
            producto.setPrecio(pRes);
        }
        if (request.getPrecioComercial() != null) {
            producto.setPrecioComercial(request.getPrecioComercial());
        } else if (pRes != null) {
            producto.setPrecioComercial(pRes);
        }

        return mapearADTO(productoRepository.save(producto));
    }

    @Override
    public List<ProductoResponseDTO> obtenerTodos() {
        return productoRepository.findAll(Sort.by("id")).stream()
                .map(this::mapearADTO)
                .collect(Collectors.toList());
    }

    @Override
    public ProductoResponseDTO cambiarEstado(Long id, boolean activo) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new ProductoNoEncontradoException("Producto no encontrado con ID: " + id));
        producto.setActivo(activo);
        return mapearADTO(productoRepository.save(producto));
    }

    @Override
    public ProductoResponseDTO obtenerPorId(Long id) {
        Producto producto = productoRepository.findById(id)
            .orElseThrow(() -> new ProductoNoEncontradoException("Producto no encontrado con ID: " + id));
        return mapearADTO(producto);
    }

    // MÃ©todo auxiliar para transformar entidad -> dto
    private ProductoResponseDTO mapearADTO(Producto p) {
        ProductoResponseDTO dto = new ProductoResponseDTO();
        dto.setId(p.getId());
        dto.setSku(p.getSku());
        dto.setNombre(p.getNombre());
        dto.setDescripcion(p.getDescripcion());
        Integer pRes = p.getPrecioResidencial() != null ? p.getPrecioResidencial() : p.getPrecio();
        Integer pCom = p.getPrecioComercial() != null ? p.getPrecioComercial() : pRes;
        dto.setPrecioResidencial(pRes);
        dto.setPrecioComercial(pCom);
        dto.setPrecio(p != null && p.getPrecio() != null ? p.getPrecio() : pRes);
        dto.setCategoria(p.getCategoria());
        dto.setImagen(p.getImagen());
        dto.setActivo(p.getActivo());
        return dto;
    }
}
