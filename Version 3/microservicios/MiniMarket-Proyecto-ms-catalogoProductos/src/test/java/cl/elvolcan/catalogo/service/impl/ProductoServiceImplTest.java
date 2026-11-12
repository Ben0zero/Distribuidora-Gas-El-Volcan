package cl.elvolcan.catalogo.service.impl;

import cl.elvolcan.catalogo.client.InventarioClient;
import cl.elvolcan.catalogo.dto.InventarioInitDTO;
import cl.elvolcan.catalogo.dto.ProductoRequestDTO;
import cl.elvolcan.catalogo.dto.ProductoResponseDTO;
import cl.elvolcan.catalogo.model.Producto;
import cl.elvolcan.catalogo.repository.ProductoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductoServiceImplTest {

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private InventarioClient inventarioClient;

    @InjectMocks
    private ProductoServiceImpl productoService;

    @Test
    @DisplayName("crearProducto debe guardar el producto y notificar a Inventario")
    void crearProductoDebeGuardarYNotificarInventario() {
        // Given: Preparamos los datos simulados
        ProductoRequestDTO request = new ProductoRequestDTO();
        request.setSku("PAN-001");
        request.setNombre("Pan Batido");
        request.setPrecio(1800);
        request.setCategoria("Panadería");
        request.setImagen("/IMAGENES/pan.png");

        Producto productoGuardado = new Producto();
        productoGuardado.setSku("PAN-001");
        productoGuardado.setNombre("Pan Batido");
        productoGuardado.setPrecio(1800);
        productoGuardado.setCategoria("Panadería");
        productoGuardado.setImagen("/IMAGENES/pan.png");
        productoGuardado.setActivo(true);

        when(productoRepository.existsBySku("PAN-001")).thenReturn(false);
        when(productoRepository.save(any(Producto.class))).thenReturn(productoGuardado);

        // When: Ejecutamos el método
        ProductoResponseDTO resultado = productoService.crearProducto(request);

        // Then: Verificamos resultados y que se llamaron a los métodos correctos
        assertNotNull(resultado);
        assertEquals("PAN-001", resultado.getSku());
        assertEquals("Pan Batido", resultado.getNombre());
        assertEquals("/IMAGENES/pan.png", resultado.getImagen());
        assertTrue(resultado.getActivo());

        verify(productoRepository).existsBySku("PAN-001");
        verify(productoRepository).save(argThat(p -> "/IMAGENES/pan.png".equals(p.getImagen())));
        // el inventario del producto nuevo se crea con los mismos niveles que la semilla
        verify(inventarioClient).crearInventario(argThat((InventarioInitDTO inv) ->
                "PAN-001".equals(inv.getSku()) && inv.getStockActual() == 0.0
                        && inv.getNivelCritico() == 5.0 && inv.getNivelMaximo() == 500.0));
    }

    @Test
    @DisplayName("crearProducto debe lanzar excepción si el SKU ya existe")
    void crearProductoDebeLanzarExcepcionSiSkuExiste() {
        // Given
        ProductoRequestDTO request = new ProductoRequestDTO();
        request.setSku("PAN-001");

        when(productoRepository.existsBySku("PAN-001")).thenReturn(true);

        // When + Then
        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> productoService.crearProducto(request)
        );

        assertEquals("Error: Ya existe un producto con el SKU: PAN-001", exception.getMessage());
        
        // Verificamos que NO se guardó en BD ni se llamó al cliente Feign
        verify(productoRepository, never()).save(any(Producto.class));
        verify(inventarioClient, never()).crearInventario(any(InventarioInitDTO.class));
    }

    @Test
    @DisplayName("obtenerPorSku debe retornar el DTO cuando el producto existe")
    void obtenerPorSkuDebeRetornarDtoCuandoExiste() {
        // Given
        Producto producto = new Producto();
        producto.setSku("LAC-001");
        producto.setNombre("Leche Entera");
        producto.setActivo(true);

        when(productoRepository.findBySku("LAC-001")).thenReturn(Optional.of(producto));

        // When
        ProductoResponseDTO resultado = productoService.obtenerPorSku("LAC-001");

        // Then
        assertNotNull(resultado);
        assertEquals("LAC-001", resultado.getSku());
        assertEquals("Leche Entera", resultado.getNombre());

        verify(productoRepository).findBySku("LAC-001");
    }

    @Test
    @DisplayName("obtenerPorSku debe lanzar excepción cuando no existe")
    void obtenerPorSkuDebeLanzarExcepcionCuandoNoExiste() {
        // Given
        when(productoRepository.findBySku("INVENTADO-999")).thenReturn(Optional.empty());

        // When + Then
        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> productoService.obtenerPorSku("INVENTADO-999")
        );

        assertEquals("Producto no encontrado con SKU: INVENTADO-999", exception.getMessage());
        verify(productoRepository).findBySku("INVENTADO-999");
    }

    @Test
    @DisplayName("obtenerTodosActivos debe retornar lista de productos en vitrina")
    void obtenerTodosActivosDebeRetornarLista() {
        // Given
        Producto p1 = new Producto();
        p1.setSku("PAN-001");
        p1.setActivo(true);

        Producto p2 = new Producto();
        p2.setSku("PAN-002");
        p2.setActivo(true);

        when(productoRepository.findByActivoTrue()).thenReturn(List.of(p1, p2));

        // When
        List<ProductoResponseDTO> resultado = productoService.obtenerTodosActivos();

        // Then
        assertEquals(2, resultado.size());
        verify(productoRepository).findByActivoTrue();
    }

    @Test
    @DisplayName("desactivarProducto debe cambiar el estado a false y guardar")
    void desactivarProductoDebeCambiarEstadoYGuardar() {
        // Given
        Producto producto = new Producto();
        producto.setSku("PAN-001");
        producto.setActivo(true);

        when(productoRepository.findBySku("PAN-001")).thenReturn(Optional.of(producto));

        // When
        productoService.desactivarProducto("PAN-001");

        // Then
        assertFalse(producto.getActivo()); // Comprobamos que cambió el estado
        verify(productoRepository).findBySku("PAN-001");
        verify(productoRepository).save(producto); // Comprobamos que se guardó la actualización
    }

    private Producto productoCl002() {
        Producto p = new Producto();
        p.setId(2L);
        p.setSku("CL002");
        p.setNombre("Cilindro GLP 11 kg");
        p.setPrecioResidencial(12000);
        p.setPrecioComercial(11000);
        p.setPrecio(12000);
        p.setCategoria("Cilindros de Gas");
        p.setImagen("/IMAGENES/cilindro de 11K.png");
        p.setActivo(true);
        return p;
    }

    @Test
    @DisplayName("actualizarProducto modifica nombre, precios y categoría manteniendo SKU e imagen")
    void actualizarProductoModificaCampos() {
        Producto existente = productoCl002();
        when(productoRepository.findById(2L)).thenReturn(Optional.of(existente));
        when(productoRepository.save(any(Producto.class))).thenAnswer(inv -> inv.getArgument(0));

        ProductoRequestDTO request = new ProductoRequestDTO();
        request.setSku("cl002"); // mismo SKU (sin importar mayúsculas)
        request.setNombre("Cilindro GLP 11 kg (oferta)");
        request.setPrecioResidencial(11500);
        request.setPrecioComercial(10500);
        request.setCategoria("Cilindros de Gas");

        ProductoResponseDTO resultado = productoService.actualizarProducto(2L, request);

        assertEquals("CL002", resultado.getSku());
        assertEquals("Cilindro GLP 11 kg (oferta)", resultado.getNombre());
        assertEquals(11500, resultado.getPrecioResidencial());
        assertEquals(10500, resultado.getPrecioComercial());
        assertEquals("/IMAGENES/cilindro de 11K.png", resultado.getImagen()); // sin imagen nueva: se conserva
        verify(inventarioClient, never()).crearInventario(any());
    }

    @Test
    @DisplayName("actualizarProducto rechaza un cambio de SKU (enlaza con inventario)")
    void actualizarProductoRechazaCambioDeSku() {
        when(productoRepository.findById(2L)).thenReturn(Optional.of(productoCl002()));
        ProductoRequestDTO request = new ProductoRequestDTO();
        request.setSku("CL999");
        request.setNombre("Otro");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> productoService.actualizarProducto(2L, request));
        assertTrue(ex.getMessage().contains("SKU no se puede modificar"));
        verify(productoRepository, never()).save(any(Producto.class));
    }

    @Test
    @DisplayName("actualizarProducto lanza excepción si el producto no existe")
    void actualizarProductoInexistente() {
        when(productoRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> productoService.actualizarProducto(99L, new ProductoRequestDTO()));
    }
}