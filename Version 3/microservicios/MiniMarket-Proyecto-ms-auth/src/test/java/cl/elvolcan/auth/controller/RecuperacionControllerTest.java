package cl.elvolcan.auth.controller;

import cl.elvolcan.auth.config.CorsConfig;
import cl.elvolcan.auth.model.Usuario;
import cl.elvolcan.auth.repository.TokenRecuperacionRepository;
import cl.elvolcan.auth.repository.UsuarioRepository;
import cl.elvolcan.auth.security.CustomAuthenticationEntryPoint;
import cl.elvolcan.auth.security.CustomUserDetailsService;
import cl.elvolcan.auth.security.JwtAuthenticationFilter;
import cl.elvolcan.auth.security.SecurityConfig;
import cl.elvolcan.auth.security.jwt.JwtUtil;
import cl.elvolcan.auth.service.RecuperacionService;
import cl.elvolcan.auth.service.notificacion.NotificacionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * /api/v1/auth/recuperar y /restablecer con la seguridad real y el RecuperacionService REAL
 * (solo los repositorios y la notificación son simulados): así se prueba la respuesta completa.
 */
@WebMvcTest(RecuperacionController.class)
@Import({SecurityConfig.class, CustomAuthenticationEntryPoint.class, JwtAuthenticationFilter.class, JwtUtil.class,
        CustomUserDetailsService.class, CorsConfig.class, RecuperacionService.class})
@TestPropertySource(properties = {
        "jwt.secret=clave_solo_para_tests_unitarios_0123456789",
        "app.cors.allowed-origins=http://localhost:5173"
})
class RecuperacionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    @MockitoBean
    private TokenRecuperacionRepository tokenRepository;

    @MockitoBean
    private NotificacionService notificacionService;

    private String recuperar(String usuario) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/recuperar").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"" + usuario + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value(RecuperacionController.MENSAJE_SOLICITUD))
                .andReturn().getResponse().getContentAsString();
    }

    @Test
    @DisplayName("sin token responde 200; misma respuesta exista o no la cuenta (anti-enumeración)")
    void mismaRespuestaExistaONo() throws Exception {
        Usuario cliente = new Usuario();
        cliente.setId(3L);
        cliente.setUsername("cliente@elvolcan.cl");
        when(usuarioRepository.findByUsername("cliente@elvolcan.cl")).thenReturn(Optional.of(cliente));
        when(usuarioRepository.findByUsername("nadie@elvolcan.cl")).thenReturn(Optional.empty());
        when(tokenRepository.findByUsuarioIdAndUsadoEnIsNull(3L)).thenReturn(List.of());

        String existe = recuperar("cliente@elvolcan.cl");
        String noExiste = recuperar("nadie@elvolcan.cl");

        assertEquals(existe, noExiste);
        verify(notificacionService, times(1)).enviarEnlaceRecuperacion(anyString(), anyString());
    }

    @Test
    @DisplayName("la respuesta nunca contiene el token ni el enlace enviado")
    void respuestaSinToken() throws Exception {
        Usuario cliente = new Usuario();
        cliente.setId(3L);
        cliente.setUsername("cliente@elvolcan.cl");
        when(usuarioRepository.findByUsername("cliente@elvolcan.cl")).thenReturn(Optional.of(cliente));
        when(tokenRepository.findByUsuarioIdAndUsadoEnIsNull(3L)).thenReturn(List.of());

        String respuesta = recuperar("cliente@elvolcan.cl");

        ArgumentCaptor<String> enlace = ArgumentCaptor.forClass(String.class);
        verify(notificacionService).enviarEnlaceRecuperacion(eq("cliente@elvolcan.cl"), enlace.capture());
        String token = enlace.getValue().substring(enlace.getValue().indexOf("token=") + 6);
        assertFalse(respuesta.contains(token));
        assertFalse(respuesta.contains("restablecer?token"));
    }

    @Test
    @DisplayName("restablecer con un token inexistente responde 400 con mensaje genérico")
    void restablecerTokenInvalido() throws Exception {
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/v1/auth/restablecer").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"no-existe\",\"contrasenaNueva\":\"NuevaClave2026\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("El enlace no es válido o ya venció. Solicita uno nuevo."));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("restablecer exige la política de contraseñas (400 antes de revisar el token)")
    void restablecerContrasenaDebil() throws Exception {
        mockMvc.perform(post("/api/v1/auth/restablecer").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"abc\",\"contrasenaNueva\":\"abc123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.contrasenaNueva").exists());
        verifyNoInteractions(tokenRepository);
    }

    @Test
    @DisplayName("solicitar sin usuario responde 400")
    void recuperarSinUsuario() throws Exception {
        mockMvc.perform(post("/api/v1/auth/recuperar").contentType(MediaType.APPLICATION_JSON).content("{\"usuario\":\"\"}"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(notificacionService);
    }
}
