package cl.elvolcan.ventas.service;

import cl.elvolcan.ventas.assembler.VentaModelAssembler;
import cl.elvolcan.ventas.client.CatalogoClient;
import cl.elvolcan.ventas.client.InventarioClient;
import cl.elvolcan.ventas.dto.*;
import cl.elvolcan.ventas.exception.InsufficientStockException;
import cl.elvolcan.ventas.exception.ResourceNotFoundException;
import cl.elvolcan.ventas.model.DetalleVenta;
import cl.elvolcan.ventas.model.Venta;
import cl.elvolcan.ventas.repository.VentaRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VentaServiceTest {

    @Mock
    private VentaRepository ventaRepository;

    @Mock
    private CatalogoClient catalogoClient;

    @Mock
    private InventarioClient inventarioClient;

    @Mock
    private VentaModelAssembler ventaModelAssembler;

    @InjectMocks
    private VentaService ventaService;

    @BeforeEach
    void setUp() {
        // Clave solo para pruebas: la real se lee de ~/.elvolcan/secrets.properties
        ReflectionTestUtils.setField(ventaService, "jwtSecret", "clave_solo_para_tests_unitarios_0123456789");
    }

    @AfterEach
    void limpiarSeguridad() {
        SecurityContextHolder.clearContext();
    }

    // Simula un usuario autenticado con el rol indicado (como lo dejaría el JwtAuthenticationFilter)
    private void autenticarComo(String username, String rol) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(username, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + rol))));
    }

    private Venta ventaPendienteDe(String usuario) {
        Venta venta = new Venta();
        venta.setId(5L);
        venta.setUsuario(usuario);
        venta.setEstado(Venta.EstadoVenta.PENDIENTE_PAGO);
        DetalleVenta detalle = new DetalleVenta();
        detalle.setProductoId(10L);
        detalle.setCantidad(1);
        venta.setDetalles(List.of(detalle));
        return venta;
    }

    @Test
    @DisplayName("crearPedido debe guardar venta de abarrotes correctamente")
    void crearPedidoDebeGuardarVentaAbarrotes() {
        // Given
        DetalleVentaRequestDTO detalleDTO = new DetalleVentaRequestDTO();
        detalleDTO.setProductoId(10L);
        detalleDTO.setCantidad(2);

        VentaRequestDTO request = new VentaRequestDTO();
        request.setDetalles(List.of(detalleDTO));
        request.setDireccion("Av. Argentina 455");
        request.setComuna("Chillán");
        request.setMetodoPago("Efectivo");

        ProductoDTO productoMock = new ProductoDTO();
        productoMock.setId(10L);
        productoMock.setSku("PROD-123");
        productoMock.setNombre("Bebida");
        productoMock.setPrecio(1500);

        StockResponseDTO stockMock = new StockResponseDTO();
        stockMock.setStockActual(10.0); // Hay stock suficiente

        Venta ventaGuardada = new Venta();
        ventaGuardada.setId(1L);
        ventaGuardada.setTotal(3000.0);

        VentaResponseDTO responseEsperado = new VentaResponseDTO();
        responseEsperado.setId(1L);
        responseEsperado.setTotal(3000.0);

        // Mocks de clientes y repositorio
        when(catalogoClient.obtenerProductoPorId(anyString(), eq(10L))).thenReturn(productoMock);
        when(inventarioClient.obtenerStock(anyString(), eq("PROD-123"))).thenReturn(stockMock);
        when(ventaRepository.save(any(Venta.class))).thenReturn(ventaGuardada);
        when(ventaModelAssembler.toModel(ventaGuardada)).thenReturn(responseEsperado);

        // When
        VentaResponseDTO resultado = ventaService.crearPedido(request);

        // Then
        assertNotNull(resultado);
        assertEquals(3000.0, resultado.getTotal());
        // la venta se guarda con los datos de despacho y pago del checkout
        verify(ventaRepository).save(argThat(v -> "Av. Argentina 455".equals(v.getDireccion())
                && "Chillán".equals(v.getComuna())
                && "Efectivo".equals(v.getMetodoPago())));
    }

    @Test
    @DisplayName("crearPedido debe lanzar InsufficientStockException si no hay stock")
    void crearPedidoDebeLanzarExcepcionSinStock() {
        // Given
        DetalleVentaRequestDTO detalleDTO = new DetalleVentaRequestDTO();
        detalleDTO.setProductoId(10L);
        detalleDTO.setCantidad(5); // Pide 5

        VentaRequestDTO request = new VentaRequestDTO();
        request.setDetalles(List.of(detalleDTO));

        ProductoDTO productoMock = new ProductoDTO();
        productoMock.setId(10L);
        productoMock.setSku("PROD-123");
        productoMock.setPrecio(1000);

        StockResponseDTO stockMock = new StockResponseDTO();
        stockMock.setStockActual(2.0); // Solo hay 2 en inventario

        when(catalogoClient.obtenerProductoPorId(anyString(), eq(10L))).thenReturn(productoMock);
        when(inventarioClient.obtenerStock(anyString(), eq("PROD-123"))).thenReturn(stockMock);

        // When + Then
        assertThrows(InsufficientStockException.class, () -> ventaService.crearPedido(request));
        verify(ventaRepository, never()).save(any(Venta.class)); // Nunca debe guardar
    }

    @Test
    @DisplayName("confirmarPago debe cambiar estado a PAGADA y descontar stock")
    void confirmarPagoDebeCambiarEstadoYDescontarStock() {
        // Given
        Long idVenta = 1L;
        autenticarComo("cliente@elvolcan.cl", "CLIENTE");
        Venta venta = new Venta();
        venta.setId(idVenta);
        venta.setUsuario("cliente@elvolcan.cl"); // el dueño confirma su propia venta
        venta.setEstado(Venta.EstadoVenta.PENDIENTE_PAGO);

        DetalleVenta detalle = new DetalleVenta();
        detalle.setProductoId(10L);
        detalle.setCantidad(2);
        venta.setDetalles(List.of(detalle));

        ProductoDTO productoMock = new ProductoDTO();
        productoMock.setSku("PROD-123");

        Venta ventaPagada = new Venta();
        ventaPagada.setEstado(Venta.EstadoVenta.PAGADA);
        
        VentaResponseDTO responseEsperado = new VentaResponseDTO();
        responseEsperado.setEstado(Venta.EstadoVenta.PAGADA);

        when(ventaRepository.findById(idVenta)).thenReturn(Optional.of(venta));
        when(catalogoClient.obtenerProductoPorId(anyString(), eq(10L))).thenReturn(productoMock);
        when(ventaRepository.save(any(Venta.class))).thenReturn(ventaPagada);
        when(ventaModelAssembler.toModel(ventaPagada)).thenReturn(responseEsperado);

        // When
        VentaResponseDTO resultado = ventaService.confirmarPago(idVenta);

        // Then
        assertEquals(Venta.EstadoVenta.PAGADA, resultado.getEstado());
        verify(inventarioClient).disminuirStock(anyString(), any(StockRequestDTO.class)); // Verifica que llame a inventario
        verify(ventaRepository).save(venta);
    }

    @Test
    @DisplayName("confirmarPago debe rechazar (403) a un CLIENTE que no es dueño de la venta")
    void confirmarPagoDebeRechazarVentaAjena() {
        // Given: la venta es de otro cliente
        autenticarComo("intruso@elvolcan.cl", "CLIENTE");
        when(ventaRepository.findById(5L)).thenReturn(Optional.of(ventaPendienteDe("cliente@elvolcan.cl")));

        // When + Then
        assertThrows(AccessDeniedException.class, () -> ventaService.confirmarPago(5L));
        verify(inventarioClient, never()).disminuirStock(anyString(), any());
        verify(ventaRepository, never()).save(any(Venta.class));
    }

    @Test
    @DisplayName("confirmarPago debe rechazar (403) a un VENDEDOR sobre una venta ajena")
    void confirmarPagoDebeRechazarVendedor() {
        autenticarComo("vendedor@elvolcan.cl", "VENDEDOR");
        when(ventaRepository.findById(5L)).thenReturn(Optional.of(ventaPendienteDe("cliente@elvolcan.cl")));

        assertThrows(AccessDeniedException.class, () -> ventaService.confirmarPago(5L));
        verify(inventarioClient, never()).disminuirStock(anyString(), any());
    }

    @Test
    @DisplayName("confirmarPago permite a un ADMIN confirmar cualquier venta")
    void confirmarPagoPermiteAdmin() {
        autenticarComo("admin@duoc.cl", "ADMIN");
        Venta venta = ventaPendienteDe("cliente@elvolcan.cl");
        ProductoDTO productoMock = new ProductoDTO();
        productoMock.setSku("CL002");

        when(ventaRepository.findById(5L)).thenReturn(Optional.of(venta));
        when(catalogoClient.obtenerProductoPorId(anyString(), eq(10L))).thenReturn(productoMock);
        when(ventaRepository.save(any(Venta.class))).thenReturn(venta);
        when(ventaModelAssembler.toModel(venta)).thenReturn(new VentaResponseDTO());

        assertNotNull(ventaService.confirmarPago(5L));
        assertEquals(Venta.EstadoVenta.PAGADA, venta.getEstado());
        verify(inventarioClient).disminuirStock(anyString(), any(StockRequestDTO.class));
    }

    @Test
    @DisplayName("obtenerPorId: VENDEDOR y ADMIN ven el detalle de cualquier orden")
    void obtenerPorIdPermiteVendedorYAdmin() {
        Venta venta = ventaPendienteDe("cliente@elvolcan.cl");
        when(ventaRepository.findById(5L)).thenReturn(Optional.of(venta));
        when(ventaModelAssembler.toModel(venta)).thenReturn(new VentaResponseDTO());

        autenticarComo("vendedor@elvolcan.cl", "VENDEDOR");
        assertNotNull(ventaService.obtenerPorId(5L));

        autenticarComo("admin@duoc.cl", "ADMIN");
        assertNotNull(ventaService.obtenerPorId(5L));
    }

    @Test
    @DisplayName("obtenerPorId: un CLIENTE ve sus órdenes pero no las ajenas (403)")
    void obtenerPorIdClienteSoloLasSuyas() {
        Venta venta = ventaPendienteDe("cliente@elvolcan.cl");
        when(ventaRepository.findById(5L)).thenReturn(Optional.of(venta));
        when(ventaModelAssembler.toModel(venta)).thenReturn(new VentaResponseDTO());

        autenticarComo("cliente@elvolcan.cl", "CLIENTE");
        assertNotNull(ventaService.obtenerPorId(5L));

        autenticarComo("intruso@elvolcan.cl", "CLIENTE");
        assertThrows(AccessDeniedException.class, () -> ventaService.obtenerPorId(5L));
    }

    @Test
    @DisplayName("obtenerPorId lanza ResourceNotFoundException si la venta no existe")
    void obtenerPorIdNoExiste() {
        autenticarComo("admin@duoc.cl", "ADMIN");
        when(ventaRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> ventaService.obtenerPorId(99L));
    }

    @Test
    @DisplayName("confirmarPago debe lanzar ResourceNotFoundException si la venta no existe")
    void confirmarPagoDebeLanzarExcepcionSiVentaNoExiste() {
        // Given
        when(ventaRepository.findById(99L)).thenReturn(Optional.empty());

        // When + Then
        assertThrows(ResourceNotFoundException.class, () -> ventaService.confirmarPago(99L));
        verify(inventarioClient, never()).disminuirStock(anyString(), any());
    }
}
