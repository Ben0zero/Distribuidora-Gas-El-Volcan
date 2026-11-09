package cl.elvolcan.inventario.controller;

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
}
