package cl.elvolcan.auth.controller;

import cl.elvolcan.auth.config.CorsConfig;
import cl.elvolcan.auth.repository.UsuarioRepository;
import cl.elvolcan.auth.security.CustomAuthenticationEntryPoint;
import cl.elvolcan.auth.security.CustomUserDetailsService;
import cl.elvolcan.auth.security.JwtAuthenticationFilter;
import cl.elvolcan.auth.security.SecurityConfig;
import cl.elvolcan.auth.security.jwt.JwtUtil;
import cl.elvolcan.auth.service.CuentaService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** PUT /api/v1/cuenta/contrasena con la configuración de seguridad real. */
@WebMvcTest(CuentaController.class)
@Import({SecurityConfig.class, CustomAuthenticationEntryPoint.class, JwtAuthenticationFilter.class, JwtUtil.class,
        CustomUserDetailsService.class, CorsConfig.class})
@TestPropertySource(properties = {
        "jwt.secret=clave_solo_para_tests_unitarios_0123456789",
        "app.cors.allowed-origins=http://localhost:5173"
})
class CuentaSeguridadTest {

    private static final String URL = "/api/v1/cuenta/contrasena";
    private static final String CAMBIO = """
            {"contrasenaActual":"Cliente123","contrasenaNueva":"NuevaClave2026"}
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CuentaService cuentaService;

    // lo necesita CustomUserDetailsService (no hay JPA en este test)
    @MockitoBean
    private UsuarioRepository usuarioRepository;

    @Test
    @DisplayName("sin token responde 401 y no cambia nada")
    void sinTokenResponde401() throws Exception {
        mockMvc.perform(put(URL).contentType(MediaType.APPLICATION_JSON).content(CAMBIO))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(cuentaService);
    }

    @Test
    @WithMockUser(username = "cliente@elvolcan.cl", roles = "CLIENTE")
    @DisplayName("con sesión responde 204 y cambia la contraseña del usuario del token")
    void cambiaLaDelUsuarioDelToken() throws Exception {
        mockMvc.perform(put(URL).contentType(MediaType.APPLICATION_JSON).content(CAMBIO))
                .andExpect(status().isNoContent());
        verify(cuentaService).cambiarContrasena(eq("cliente@elvolcan.cl"),
                argThat(dto -> "NuevaClave2026".equals(dto.getContrasenaNueva())));
    }

    @Test
    @WithMockUser(username = "vendedor@elvolcan.cl", roles = "VENDEDOR")
    @DisplayName("si la nueva no cumple la política (8+ con letra y número) responde 400 sin llamar al servicio")
    void contrasenaNuevaDebilResponde400() throws Exception {
        mockMvc.perform(put(URL).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"contrasenaActual\":\"Vendedor123\",\"contrasenaNueva\":\"abc123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.contrasenaNueva").exists());
        verify(cuentaService, never()).cambiarContrasena(any(), any());
    }

    @Test
    @WithMockUser(username = "cliente@elvolcan.cl", roles = "CLIENTE")
    @DisplayName("contraseña actual incorrecta responde 400 con el mensaje del servicio")
    void contrasenaActualIncorrectaResponde400() throws Exception {
        doThrow(new IllegalArgumentException("La contraseña actual no es correcta"))
                .when(cuentaService).cambiarContrasena(any(), any());

        mockMvc.perform(put(URL).contentType(MediaType.APPLICATION_JSON).content(CAMBIO))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("La contraseña actual no es correcta"));
    }
}
