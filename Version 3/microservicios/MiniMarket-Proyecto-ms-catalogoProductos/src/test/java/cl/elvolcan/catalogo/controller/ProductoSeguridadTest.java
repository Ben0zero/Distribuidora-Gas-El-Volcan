package cl.elvolcan.catalogo.controller;

import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import cl.elvolcan.catalogo.exception.ProductoNoEncontradoException;
import cl.elvolcan.catalogo.exception.GlobalExceptionHandler;
import cl.elvolcan.catalogo.client.InventarioClient;
import cl.elvolcan.catalogo.client.VentasClient;
import cl.elvolcan.catalogo.exception.ProductoConVentasException;
import feign.FeignException;
import feign.Request;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import cl.elvolcan.catalogo.config.CorsConfig;
import cl.elvolcan.catalogo.dto.ProductoResponseDTO;
import cl.elvolcan.catalogo.security.CustomAuthenticationEntryPoint;
import cl.elvolcan.catalogo.security.SecurityConfig;
import cl.elvolcan.catalogo.security.jwt.JwtAuthenticationFilter;
import cl.elvolcan.catalogo.security.jwt.JwtUtil;
import cl.elvolcan.catalogo.service.ProductoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Reglas de rol de /api/v1/productos con el SecurityConfig real (sin base de datos):
 * el catálogo es público para leer y solo ADMIN crea, edita o desactiva.
 */
@WebMvcTest(ProductoController.class)
@Import({SecurityConfig.class, CustomAuthenticationEntryPoint.class, JwtAuthenticationFilter.class, JwtUtil.class, CorsConfig.class})
@TestPropertySource(properties = {
        "jwt.secret=clave_solo_para_tests_unitarios_0123456789",
        "app.cors.allowed-origins=http://localhost:5173"
})
class ProductoSeguridadTest {

    private static final String PRODUCTO = """
            {"sku":"CL002","nombre":"Cilindro GLP 11 kg","precioResidencial":12000,"precioComercial":11000,
             "categoria":"Cilindros de Gas"}
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductoService productoService;

    // @EnableFeignClients registra este cliente: se simula para no levantar Feign/Eureka
    @MockitoBean
    private InventarioClient inventarioClient;

    @MockitoBean
    private VentasClient ventasClient;

    @Test
    @DisplayName("el catálogo se puede leer sin token (tienda pública)")
    void catalogoPublico() throws Exception {
        when(productoService.obtenerTodosActivos()).thenReturn(List.of());
        mockMvc.perform(get("/api/v1/productos")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "vendedor@elvolcan.cl", roles = "VENDEDOR")
    @DisplayName("VENDEDOR no puede crear, editar ni eliminar productos (403)")
    void vendedorNoModifica() throws Exception {
        mockMvc.perform(post("/api/v1/productos").contentType(MediaType.APPLICATION_JSON).content(PRODUCTO))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/v1/productos/2").contentType(MediaType.APPLICATION_JSON).content(PRODUCTO))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/v1/productos/CL002")).andExpect(status().isForbidden());
        verifyNoInteractions(productoService);
    }

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("ADMIN puede editar un producto (PUT /api/v1/productos/{id})")
    void adminEdita() throws Exception {
        when(productoService.actualizarProducto(eq(2L), any())).thenReturn(new ProductoResponseDTO());
        mockMvc.perform(put("/api/v1/productos/2").contentType(MediaType.APPLICATION_JSON).content(PRODUCTO))
                .andExpect(status().isOk());
        verify(productoService).actualizarProducto(eq(2L), any());
    }

    @Test
    @DisplayName("editar sin token responde 401")
    void editarSinToken() throws Exception {
        mockMvc.perform(put("/api/v1/productos/2").contentType(MediaType.APPLICATION_JSON).content(PRODUCTO))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("H-10: producto inexistente responde 404; un error interno responde 500 sin detalles técnicos")
    void erroresConCodigoCorrecto() throws Exception {
        when(productoService.obtenerPorId(99L)).thenThrow(new ProductoNoEncontradoException("Producto no encontrado con ID: 99"));
        when(productoService.obtenerPorSku("CL002")).thenThrow(new RuntimeException("ORA-00942: table or view does not exist"));

        mockMvc.perform(get("/api/v1/productos/id/99")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/productos/CL002"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.mensaje").value(GlobalExceptionHandler.MENSAJE_INTERNO));
        // un id con formato inválido es error del cliente (400), no un 500
        mockMvc.perform(get("/api/v1/productos/id/abc")).andExpect(status().isBadRequest());
    }

    // --- Panel admin: listado completo y activar/desactivar (solo ADMIN) ---

    private static final String ACTIVAR = "{\"activo\":true}";

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("ADMIN lista todos los productos (incluye inactivos) y cambia su estado")
    void adminListaTodosYCambiaEstado() throws Exception {
        when(productoService.obtenerTodos()).thenReturn(List.of());
        when(productoService.cambiarEstado(4L, true)).thenReturn(new ProductoResponseDTO());

        mockMvc.perform(get("/api/v1/productos/todos")).andExpect(status().isOk());
        mockMvc.perform(patch("/api/v1/productos/4/estado").contentType(MediaType.APPLICATION_JSON).content(ACTIVAR))
                .andExpect(status().isOk());
        verify(productoService).cambiarEstado(4L, true);
    }

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("cambiar estado sin el campo activo responde 400")
    void cambiarEstadoSinCampo() throws Exception {
        mockMvc.perform(patch("/api/v1/productos/4/estado").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        verify(productoService, never()).cambiarEstado(anyLong(), anyBoolean());
    }

    @Test
    @WithMockUser(username = "vendedor@elvolcan.cl", roles = "VENDEDOR")
    @DisplayName("VENDEDOR no ve los inactivos ni cambia el estado (403)")
    void vendedorNoCambiaEstado() throws Exception {
        mockMvc.perform(get("/api/v1/productos/todos")).andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/v1/productos/4/estado").contentType(MediaType.APPLICATION_JSON).content(ACTIVAR))
                .andExpect(status().isForbidden());
        verifyNoInteractions(productoService);
    }

    @Test
    @WithMockUser(username = "cliente@elvolcan.cl", roles = "CLIENTE")
    @DisplayName("CLIENTE no ve los inactivos ni cambia el estado (403)")
    void clienteNoCambiaEstado() throws Exception {
        mockMvc.perform(get("/api/v1/productos/todos")).andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/v1/productos/4/estado").contentType(MediaType.APPLICATION_JSON).content(ACTIVAR))
                .andExpect(status().isForbidden());
        verifyNoInteractions(productoService);
    }

    @Test
    @DisplayName("sin token, el listado completo y el cambio de estado responden 401; la tienda sigue pública")
    void sinTokenResponde401() throws Exception {
        mockMvc.perform(get("/api/v1/productos/todos")).andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/v1/productos/4/estado").contentType(MediaType.APPLICATION_JSON).content(ACTIVAR))
                .andExpect(status().isUnauthorized());
        when(productoService.obtenerTodosActivos()).thenReturn(List.of());
        mockMvc.perform(get("/api/v1/productos")).andExpect(status().isOk());
        verify(productoService, never()).obtenerTodos();
    }

    // --- DELETE /api/v1/productos/{sku}: eliminación definitiva (solo ADMIN, sin ventas) ---

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("ADMIN elimina un producto sin ventas (204)")
    void adminEliminaSinVentas() throws Exception {
        mockMvc.perform(delete("/api/v1/productos/TEST-01")).andExpect(status().isNoContent());
        verify(productoService).eliminarProducto("TEST-01");
    }

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("con ventas responde 409 con el mensaje para desactivarlo")
    void conVentasResponde409() throws Exception {
        doThrow(new ProductoConVentasException()).when(productoService).eliminarProducto("CL001");
        mockMvc.perform(delete("/api/v1/productos/CL001"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensaje").value("El producto tiene ventas registradas; desactívalo en lugar de eliminarlo"));
    }

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("un SKU inexistente responde 404")
    void eliminarInexistente404() throws Exception {
        doThrow(new ProductoNoEncontradoException("Producto no encontrado con SKU: NO-EXISTE"))
                .when(productoService).eliminarProducto("NO-EXISTE");
        mockMvc.perform(delete("/api/v1/productos/NO-EXISTE")).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("si ms-ventas o ms-inventario no responden, 502 con mensaje genérico")
    void falloFeignResponde502() throws Exception {
        Request peticion = Request.create(Request.HttpMethod.GET, "http://ms-ventas/interno", Map.of(), null,
                StandardCharsets.UTF_8, null);
        doThrow(new FeignException.ServiceUnavailable("detalle interno", peticion, null, null))
                .when(productoService).eliminarProducto("TEST-01");
        mockMvc.perform(delete("/api/v1/productos/TEST-01"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.mensaje").value("No se pudo completar la operación con otro servicio del sistema. Intenta nuevamente."));
    }

    @Test
    @WithMockUser(username = "cliente@elvolcan.cl", roles = "CLIENTE")
    @DisplayName("CLIENTE no puede eliminar productos (403)")
    void clienteNoElimina() throws Exception {
        mockMvc.perform(delete("/api/v1/productos/TEST-01")).andExpect(status().isForbidden());
        verifyNoInteractions(productoService);
    }

    @Test
    @DisplayName("sin token, eliminar un producto responde 401")
    void sinTokenNoElimina() throws Exception {
        mockMvc.perform(delete("/api/v1/productos/TEST-01")).andExpect(status().isUnauthorized());
        verifyNoInteractions(productoService);
    }
}
