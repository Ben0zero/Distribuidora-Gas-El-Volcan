package cl.elvolcan.catalogo.service.impl;

import static org.mockito.ArgumentMatchers.argThat;
import org.springframework.data.domain.Sort;
import cl.elvolcan.catalogo.exception.ProductoNoEncontradoException;
import cl.elvolcan.catalogo.client.InventarioClient;
import cl.elvolcan.catalogo.client.VentasClient;
import cl.elvolcan.catalogo.exception.ProductoConVentasException;
import feign.FeignException;
import feign.Request;
import java.nio.charset.StandardCharsets;
import java.util.Map;
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

    @Mock
    private VentasClient ventasClient;

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

    // --- Activar / desactivar productos (panel admin) ---

    private Producto producto(Long id, boolean activo) {
        Producto p = new Producto();
        p.setId(id);
        p.setSku("CL00" + id);
        p.setNombre("Cilindro " + id);
        p.setActivo(activo);
        return p;
    }

    @Test
    @DisplayName("cambiarEstado reactiva un producto inactivo y lo guarda")
    void cambiarEstadoReactiva() {
        Producto inactivo = producto(4L, false);
        when(productoRepository.findById(4L)).thenReturn(Optional.of(inactivo));
        when(productoRepository.save(inactivo)).thenReturn(inactivo);

        ProductoResponseDTO resultado = productoService.cambiarEstado(4L, true);

        assertTrue(resultado.getActivo());
        verify(productoRepository).save(argThat(Producto::getActivo));
    }

    @Test
    @DisplayName("cambiarEstado desactiva un producto activo")
    void cambiarEstadoDesactiva() {
        Producto activo = producto(2L, true);
        when(productoRepository.findById(2L)).thenReturn(Optional.of(activo));
        when(productoRepository.save(activo)).thenReturn(activo);

        assertFalse(productoService.cambiarEstado(2L, false).getActivo());
    }

    @Test
    @DisplayName("cambiarEstado de un producto inexistente lanza 404 y no guarda")
    void cambiarEstadoInexistente() {
        when(productoRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ProductoNoEncontradoException.class, () -> productoService.cambiarEstado(99L, true));
        verify(productoRepository, never()).save(any());
    }

    @Test
    @DisplayName("obtenerTodos incluye los inactivos (la tienda sigue usando obtenerTodosActivos)")
    void obtenerTodosIncluyeInactivos() {
        when(productoRepository.findAll(any(Sort.class))).thenReturn(List.of(producto(1L, true), producto(2L, false)));

        List<ProductoResponseDTO> todos = productoService.obtenerTodos();

        assertEquals(2, todos.size());
        assertFalse(todos.get(1).getActivo());
        verify(productoRepository, never()).findByActivoTrue();
    }

    // --- Eliminar producto (definitivo, solo sin ventas) ---

    private static final Request PETICION = Request.create(Request.HttpMethod.GET, "/api", Map.of(), null,
            StandardCharsets.UTF_8, null);

    private Producto productoTest(Long id) {
        Producto p = new Producto();
        p.setId(id);
        p.setSku("TEST-01");
        p.setNombre("Producto de prueba");
        p.setActivo(true);
        return p;
    }

    @Test
    @DisplayName("eliminar sin ventas borra el producto y su inventario")
    void eliminarSinVentas() {
        Producto producto = productoTest(90L);
        when(productoRepository.findBySku("TEST-01")).thenReturn(Optional.of(producto));
        when(ventasClient.productosVendidos()).thenReturn(List.of(1L, 2L));

        productoService.eliminarProducto("TEST-01");

        var orden = inOrder(ventasClient, productoRepository, inventarioClient);
        orden.verify(ventasClient).productosVendidos();
        orden.verify(productoRepository).delete(producto);
        orden.verify(productoRepository).flush();
        orden.verify(inventarioClient).eliminarInventario("TEST-01");
    }

    @Test
    @DisplayName("eliminar con ventas lanza ProductoConVentasException (409) y no borra nada")
    void eliminarConVentas() {
        when(productoRepository.findBySku("TEST-01")).thenReturn(Optional.of(productoTest(2L)));
        when(ventasClient.productosVendidos()).thenReturn(List.of(1L, 2L));

        ProductoConVentasException ex = assertThrows(ProductoConVentasException.class,
                () -> productoService.eliminarProducto("TEST-01"));

        assertEquals("El producto tiene ventas registradas; desactívalo en lugar de eliminarlo", ex.getMessage());
        verify(productoRepository, never()).delete(any(Producto.class));
        verifyNoInteractions(inventarioClient);
    }

    @Test
    @DisplayName("eliminar un SKU inexistente lanza ProductoNoEncontradoException (404) sin llamar a otros servicios")
    void eliminarInexistente() {
        when(productoRepository.findBySku("NO-EXISTE")).thenReturn(Optional.empty());

        assertThrows(ProductoNoEncontradoException.class, () -> productoService.eliminarProducto("NO-EXISTE"));
        verifyNoInteractions(ventasClient, inventarioClient);
    }

    @Test
    @DisplayName("si ms-ventas no responde, no se borra nada (la FeignException termina en 502)")
    void ventasCaidoNoBorra() {
        when(productoRepository.findBySku("TEST-01")).thenReturn(Optional.of(productoTest(90L)));
        when(ventasClient.productosVendidos())
                .thenThrow(new FeignException.ServiceUnavailable("ms-ventas no disponible", PETICION, null, null));

        assertThrows(FeignException.class, () -> productoService.eliminarProducto("TEST-01"));
        verify(productoRepository, never()).delete(any(Producto.class));
        verifyNoInteractions(inventarioClient);
    }

    @Test
    @DisplayName("si ms-inventario falla, la excepción sale del método @Transactional (rollback del borrado, 502)")
    void inventarioCaidoPropaga() {
        when(productoRepository.findBySku("TEST-01")).thenReturn(Optional.of(productoTest(90L)));
        when(ventasClient.productosVendidos()).thenReturn(List.of());
        doThrow(new FeignException.ServiceUnavailable("ms-inventario no disponible", PETICION, null, null))
                .when(inventarioClient).eliminarInventario("TEST-01");

        assertThrows(FeignException.class, () -> productoService.eliminarProducto("TEST-01"));
    }

    @Test
    @DisplayName("si ms-inventario no tiene registro (404), el producto se elimina igual")
    void inventarioSinRegistro() {
        Producto producto = productoTest(90L);
        when(productoRepository.findBySku("TEST-01")).thenReturn(Optional.of(producto));
        when(ventasClient.productosVendidos()).thenReturn(List.of());
        doThrow(new FeignException.NotFound("sin registro", PETICION, null, null))
                .when(inventarioClient).eliminarInventario("TEST-01");

        assertDoesNotThrow(() -> productoService.eliminarProducto("TEST-01"));
        verify(productoRepository).delete(producto);
    }
}
