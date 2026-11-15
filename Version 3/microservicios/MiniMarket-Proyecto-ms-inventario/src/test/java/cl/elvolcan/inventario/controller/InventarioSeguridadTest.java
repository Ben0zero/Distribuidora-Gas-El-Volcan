package cl.elvolcan.inventario.controller;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import cl.elvolcan.inventario.exception.GlobalExceptionHandler;
import cl.elvolcan.inventario.config.CorsConfig;
import cl.elvolcan.inventario.security.CustomAuthenticationEntryPoint;
import cl.elvolcan.inventario.security.JwtUtil;
import cl.elvolcan.inventario.security.SecurityConfig;
import cl.elvolcan.inventario.service.InventarioService;
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
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Reglas de rol de /api/v1/inventario con la configuración de seguridad real (sin base de datos):
 * el VENDEDOR es de solo lectura y solo ADMIN modifica stock.
 */
@WebMvcTest(InventarioController.class)
@Import({SecurityConfig.class, CustomAuthenticationEntryPoint.class, JwtUtil.class, CorsConfig.class})
@TestPropertySource(properties = {
        "jwt.secret=clave_solo_para_tests_unitarios_0123456789",
        "app.cors.allowed-origins=http://localhost:5173"
})
class InventarioSeguridadTest {

    private static final String AUMENTO = "{\"sku\":\"CL002\",\"stockActual\":5}";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private InventarioService service;

    @Test
    @WithMockUser(username = "vendedor@elvolcan.cl", roles = "VENDEDOR")
    @DisplayName("VENDEDOR puede consultar el inventario")
    void vendedorPuedeLeer() throws Exception {
        when(service.obtenerTodos()).thenReturn(List.of());
        mockMvc.perform(get("/api/v1/inventario")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "vendedor@elvolcan.cl", roles = "VENDEDOR")
    @DisplayName("VENDEDOR no puede aumentar ni disminuir stock (403)")
    void vendedorNoPuedeModificar() throws Exception {
        mockMvc.perform(put("/api/v1/inventario/aumentar").contentType(MediaType.APPLICATION_JSON).content(AUMENTO))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/v1/inventario/disminuir").contentType(MediaType.APPLICATION_JSON).content(AUMENTO))
                .andExpect(status().isForbidden());
        verify(service, never()).aumentarStock(any());
        verify(service, never()).disminuirStock(any());
    }

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("ADMIN sí puede aumentar stock")
    void adminPuedeModificar() throws Exception {
        mockMvc.perform(put("/api/v1/inventario/aumentar").contentType(MediaType.APPLICATION_JSON).content(AUMENTO))
                .andExpect(status().isOk());
        verify(service).aumentarStock(any());
    }

    @Test
    @DisplayName("sin token responde 401")
    void sinTokenResponde401() throws Exception {
        mockMvc.perform(get("/api/v1/inventario")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("H-04: un ajuste negativo o sobre 500 responde 400 y no llega al servicio")
    void ajusteInvalidoResponde400() throws Exception {
        mockMvc.perform(put("/api/v1/inventario/aumentar").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"CL002\",\"stockActual\":-50}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/v1/inventario/disminuir").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"CL002\",\"stockActual\":501}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/v1/inventario/sumar-stock/CL002/-999"))
                .andExpect(status().isBadRequest());
        verify(service, never()).aumentarStock(any());
        verify(service, never()).disminuirStock(any());
        verify(service, never()).sumarStock(any(), anyInt());
    }

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("H-03: dos ajustes simultáneos del mismo SKU (@Version) responden 409")
    void ajusteConcurrenteResponde409() throws Exception {
        when(service.disminuirStock(any()))
                .thenThrow(new org.springframework.orm.ObjectOptimisticLockingFailureException("Inventario", 1L));

        mockMvc.perform(put("/api/v1/inventario/disminuir").contentType(MediaType.APPLICATION_JSON).content(AUMENTO))
                .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("H-10: un error interno responde 500 con mensaje neutro (antes era 400 con el mensaje técnico)")
    void errorInternoResponde500SinDetalles() throws Exception {
        when(service.obtenerTodos()).thenThrow(new RuntimeException("ORA-00942: table or view does not exist"));

        mockMvc.perform(get("/api/v1/inventario"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.mensaje").value(GlobalExceptionHandler.MENSAJE_INTERNO));
    }

    // --- DELETE /api/v1/inventario/{sku}: solo ADMIN ---

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("ADMIN elimina el registro de un SKU (204)")
    void adminEliminaRegistro() throws Exception {
        mockMvc.perform(delete("/api/v1/inventario/TEST-01")).andExpect(status().isNoContent());
        verify(service).eliminarPorSku("TEST-01");
    }

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("Eliminar un SKU sin registro responde 404")
    void eliminarInexistente404() throws Exception {
        doThrow(new cl.elvolcan.inventario.exception.ResourceNotFoundException("Producto no encontrado"))
                .when(service).eliminarPorSku("NO-EXISTE");
        mockMvc.perform(delete("/api/v1/inventario/NO-EXISTE")).andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "vendedor@elvolcan.cl", roles = "VENDEDOR")
    @DisplayName("VENDEDOR no puede eliminar registros de inventario (403)")
    void vendedorNoElimina() throws Exception {
        mockMvc.perform(delete("/api/v1/inventario/TEST-01")).andExpect(status().isForbidden());
        verify(service, never()).eliminarPorSku(any());
    }

    @Test
    @DisplayName("Sin token, eliminar un registro de inventario responde 401")
    void sinTokenNoElimina() throws Exception {
        mockMvc.perform(delete("/api/v1/inventario/TEST-01")).andExpect(status().isUnauthorized());
        verify(service, never()).eliminarPorSku(any());
    }
}
