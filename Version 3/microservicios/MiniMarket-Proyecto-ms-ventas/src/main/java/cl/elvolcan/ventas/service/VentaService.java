package cl.elvolcan.ventas.service;

import cl.elvolcan.ventas.assembler.VentaModelAssembler;
import cl.elvolcan.ventas.client.CatalogoClient;
import cl.elvolcan.ventas.client.InventarioClient;
import cl.elvolcan.ventas.dto.DetalleVentaRequestDTO;
import cl.elvolcan.ventas.dto.ProductoDTO;
import cl.elvolcan.ventas.dto.StockRequestDTO;
import cl.elvolcan.ventas.dto.StockResponseDTO;
import cl.elvolcan.ventas.dto.VentaRequestDTO;
import cl.elvolcan.ventas.dto.VentaResponseDTO;
import cl.elvolcan.ventas.exception.InsufficientStockException;
import cl.elvolcan.ventas.exception.ResourceNotFoundException;
import cl.elvolcan.ventas.model.DetalleVenta;
import cl.elvolcan.ventas.model.Venta;
import cl.elvolcan.ventas.repository.VentaRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VentaService {

    private final VentaRepository ventaRepository;
    private final CatalogoClient catalogoClient;
    private final InventarioClient inventarioClient;
    private final VentaModelAssembler ventaModelAssembler;

    // Clave JWT compartida, leída desde el archivo externo de secretos (jwt.secret)
    @Value("${jwt.secret}")
    private String jwtSecret;

    private String getToken() {
        try {
            ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            String auth = attr.getRequest().getHeader("Authorization");
            if (auth != null && !auth.isBlank()) {
                return auth;
            }
        } catch (Exception e) {
        }
        return generateInternalToken();
    }

    private String getInternalToken() {
        return generateInternalToken();
    }

    private String generateInternalToken() {
        Map<String, Object> claims = new HashMap<>();
        claims.put("rol", "ROLE_ADMIN");
        return "Bearer " + Jwts.builder()
                .setClaims(claims)
                .setSubject("ms-ventas")
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60))
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)), io.jsonwebtoken.SignatureAlgorithm.HS256)
                .compact();
    }

    /** IDs de los productos con al menos una venta (ms-catalogo los usa para no borrarlos). */
    public List<Long> productosVendidos() {
        return ventaRepository.findProductosVendidos();
    }

    @Transactional
    public List<VentaResponseDTO> listarTodas() {
        return ventaRepository.findAll().stream().map(ventaModelAssembler::toModel).collect(Collectors.toList());
    }

    @Transactional
    public List<VentaResponseDTO> listarMisCompras() {
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String usuario = auth != null ? auth.getName() : null;
            if (usuario == null || "anonymousUser".equals(usuario)) {
                throw new IllegalArgumentException("Usuario no autenticado");
            }
            return ventaRepository.findByUsuarioOrderByFechaVentaDesc(usuario).stream()
                    .map(ventaModelAssembler::toModel)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            throw new IllegalArgumentException("Usuario no autenticado");
        }
    }

    @Transactional
    public VentaResponseDTO crearPedido(VentaRequestDTO requestDTO) {
        String token = getToken();
        String tipoCliente = tipoClienteDelToken();
        Venta venta = new Venta();
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
                venta.setUsuario(auth.getName());
            }
        } catch (Exception ignored) {
        }
        venta.setEstado(Venta.EstadoVenta.PENDIENTE_PAGO);
        venta.setDireccion(requestDTO.getDireccion());
        venta.setComuna(requestDTO.getComuna());
        venta.setMetodoPago(requestDTO.getMetodoPago());
        double totalVenta = 0.0;
        List<DetalleVenta> detalles = new ArrayList<>();

        for (Map.Entry<Long, Integer> item : agruparPorProducto(requestDTO.getDetalles()).entrySet()) {
            Long productoId = item.getKey();
            int cantidad = item.getValue();
            ProductoDTO producto = catalogoClient.obtenerProductoPorId(token, productoId);
            if (producto == null) throw new ResourceNotFoundException("Producto no encontrado");
            if (Boolean.FALSE.equals(producto.getActivo())) {
                throw new IllegalArgumentException("El producto " + producto.getNombre() + " no está disponible para la venta");
            }
            // El stock se valida con la cantidad total del producto (aunque venga repetido en varios ítems)
            StockResponseDTO stock = inventarioClient.obtenerStock(token, producto.getSku());
            if (stock == null || stock.getStockActual() < cantidad) {
                throw new InsufficientStockException("Stock insuficiente para: " + producto.getNombre());
            }

            Integer precio = "COMERCIAL".equals(tipoCliente) && producto.getPrecioComercial() != null
                    ? producto.getPrecioComercial()
                    : producto.getPrecioResidencial() != null ? producto.getPrecioResidencial() : producto.getPrecio();

            DetalleVenta detalle = new DetalleVenta();
            detalle.setVenta(venta);
            detalle.setProductoId(producto.getId());
            detalle.setCantidad(cantidad);
            detalle.setPrecioUnitario(precio.doubleValue());
            detalle.setSubtotal(precio.doubleValue() * cantidad);
            detalles.add(detalle);
            totalVenta += detalle.getSubtotal();
        }

        venta.setTotal(totalVenta);
        venta.setDetalles(detalles);
        return ventaModelAssembler.toModel(ventaRepository.save(venta));
    }

    /** Máximo de unidades de un mismo producto por venta (igual al @Max del DTO). */
    static final int MAX_CANTIDAD_POR_PRODUCTO = 100;

    /**
     * Suma las cantidades de los ítems con el mismo productoId (en el orden en que llegan),
     * para validar el stock con el total real y hacer una sola consulta Feign por producto.
     */
    private Map<Long, Integer> agruparPorProducto(List<DetalleVentaRequestDTO> detalles) {
        Map<Long, Integer> cantidades = new LinkedHashMap<>();
        for (DetalleVentaRequestDTO detalleDTO : detalles) {
            if (detalleDTO.getProductoId() == null || detalleDTO.getCantidad() == null) {
                throw new IllegalArgumentException("Cada detalle debe indicar productoId y cantidad");
            }
            int total = cantidades.merge(detalleDTO.getProductoId(), detalleDTO.getCantidad(), Integer::sum);
            if (total > MAX_CANTIDAD_POR_PRODUCTO) {
                throw new IllegalArgumentException("No se pueden comprar más de " + MAX_CANTIDAD_POR_PRODUCTO
                        + " unidades del mismo producto en una venta");
            }
        }
        return cantidades;
    }

    /**
     * Tipo de cliente para el precio, tomado del claim "tipoCliente" del JWT
     * (JwtAuthenticationFilter lo deja en los details). Nunca se usa un valor del body:
     * si el token no trae el claim o trae otro valor, se aplica el precio Residencial.
     */
    private String tipoClienteDelToken() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object details = auth != null ? auth.getDetails() : null;
        if (details instanceof String tipo && "COMERCIAL".equals(tipo.trim().toUpperCase(Locale.ROOT))) {
            return "COMERCIAL";
        }
        return "RESIDENCIAL";
    }

    /**
     * Solo el usuario que creó la venta o un ADMIN pueden operar sobre ella.
     * Lanza AccessDeniedException (HTTP 403) en cualquier otro caso.
     */
    private void verificarPropietarioOAdmin(Venta venta) {
        verificarAcceso(venta, false);
    }

    /**
     * Verifica el acceso a una venta: ADMIN siempre, el dueño siempre y,
     * si permitirVendedor es true, también un VENDEDOR (solo lectura de órdenes).
     */
    private void verificarAcceso(Venta venta, boolean permitirVendedor) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || "anonymousUser".equals(auth.getName())) {
            throw new AccessDeniedException("Usuario no autenticado");
        }
        if (tieneRol(auth, "ROLE_ADMIN") || (permitirVendedor && tieneRol(auth, "ROLE_VENDEDOR"))) {
            return;
        }
        if (venta.getUsuario() == null || !venta.getUsuario().equals(auth.getName())) {
            throw new AccessDeniedException("No puedes operar sobre una venta que no te pertenece");
        }
    }

    private boolean tieneRol(Authentication auth, String rol) {
        return auth.getAuthorities().stream().anyMatch(a -> rol.equals(a.getAuthority()));
    }

    /** Detalle de una orden: ADMIN y VENDEDOR ven cualquiera; un CLIENTE solo las suyas. */
    @Transactional
    public VentaResponseDTO obtenerPorId(Long ventaId) {
        Venta venta = ventaRepository.findById(ventaId)
                .orElseThrow(() -> new ResourceNotFoundException("Venta no encontrada con ID: " + ventaId));
        verificarAcceso(venta, true);
        return ventaModelAssembler.toModel(venta);
    }

    @Transactional
    public VentaResponseDTO confirmarPago(Long ventaId) {
        String token = getToken();
        String internalToken = getInternalToken();
        Venta venta = ventaRepository.findById(ventaId)
                .orElseThrow(() -> new ResourceNotFoundException("Venta no encontrada con ID: " + ventaId));
        verificarPropietarioOAdmin(venta);
        if (venta.getEstado() == Venta.EstadoVenta.PAGADA) return ventaModelAssembler.toModel(venta);

        // Se marca PAGADA y se escribe en la BD ANTES de descontar stock: si otra petición confirmó
        // la misma venta al mismo tiempo, el @Version hace fallar este flush
        // (ObjectOptimisticLockingFailureException → 409) y no se descuenta el stock dos veces.
        // Si después falla el descuento, la transacción revierte el estado a PENDIENTE_PAGO.
        venta.setEstado(Venta.EstadoVenta.PAGADA);
        Venta ventaPagada = ventaRepository.saveAndFlush(venta);

        for (DetalleVenta detalle : venta.getDetalles()) {
            ProductoDTO producto = catalogoClient.obtenerProductoPorId(token, detalle.getProductoId());
            StockRequestDTO request = new StockRequestDTO();
            request.setSku(producto.getSku());
            request.setStockActual(detalle.getCantidad().doubleValue());
            inventarioClient.disminuirStock(internalToken, request);
        }
        return ventaModelAssembler.toModel(ventaPagada);
    }
}
