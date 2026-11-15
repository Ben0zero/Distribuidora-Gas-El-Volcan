package cl.elvolcan.auth.security;

import cl.elvolcan.auth.config.CorsConfig;
import cl.elvolcan.auth.controller.CuentaController;
import cl.elvolcan.auth.repository.UsuarioRepository;
import cl.elvolcan.auth.security.jwt.JwtUtil;
import cl.elvolcan.auth.service.CuentaService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * H-20: un token inválido o expirado no rompe el filtro JWT de ms-auth: la petición sigue sin
 * autenticar y una ruta privada responde 401 en JSON (CustomAuthenticationEntryPoint).
 */
@WebMvcTest(CuentaController.class)
@Import({SecurityConfig.class, CustomAuthenticationEntryPoint.class, JwtAuthenticationFilter.class, JwtUtil.class,
        CustomUserDetailsService.class, CorsConfig.class})
@TestPropertySource(properties = {
        "jwt.secret=" + JwtFiltroSeguridadTest.CLAVE,
        "app.cors.allowed-origins=http://localhost:5173"
})
class JwtFiltroSeguridadTest {

    static final String CLAVE = "clave_solo_para_tests_unitarios_0123456789";
    private static final String URL = "/api/v1/cuenta/contrasena";
    private static final String CAMBIO = """
            {"contrasenaActual":"Cliente123","contrasenaNueva":"NuevaClave2026"}
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CuentaService cuentaService;

    @MockitoBean
    private UsuarioRepository usuarioRepository;

    private ResultActions conToken(String token) throws Exception {
        return mockMvc.perform(put(URL).contentType(MediaType.APPLICATION_JSON).content(CAMBIO)
                .header("Authorization", "Bearer " + token));
    }

    private static String token(String usuario, long desdeMs, long hastaMs, String clave) {
        long ahora = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(usuario)
                .claim("rol", "ROLE_CLIENTE")
                .setIssuedAt(new Date(ahora + desdeMs))
                .setExpiration(new Date(ahora + hastaMs))
                .signWith(Keys.hmacShaKeyFor(clave.getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS256)
                .compact();
    }

    private static void esperar401Json(ResultActions resultado) throws Exception {
        resultado.andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error").value("No Autorizado (401)"));
    }

    @Test
    @DisplayName("Token mal formado: 401 en JSON y no se ejecuta la operación")
    void tokenMalFormado() throws Exception {
        esperar401Json(conToken("esto.no-es.un-jwt"));
        verifyNoInteractions(cuentaService, usuarioRepository);
    }

    @Test
    @DisplayName("Token expirado (firmado con la clave correcta): 401 en JSON")
    void tokenExpirado() throws Exception {
        String expirado = token("cliente@elvolcan.cl", -3 * 3600_000L, -3600_000L, CLAVE);
        esperar401Json(conToken(expirado));
        verifyNoInteractions(cuentaService);
    }

    @Test
    @DisplayName("Token firmado con otra clave: 401 en JSON")
    void tokenConOtraFirma() throws Exception {
        String ajeno = token("cliente@elvolcan.cl", 0, 3600_000L, "otra_clave_distinta_para_tests_0123456789");
        esperar401Json(conToken(ajeno));
        verifyNoInteractions(cuentaService);
    }

    @Test
    @DisplayName("Token válido de un usuario que ya no existe: 401 en JSON")
    void usuarioEliminado() throws Exception {
        when(usuarioRepository.findByUsername(anyString())).thenReturn(Optional.empty());
        esperar401Json(conToken(token("borrado@elvolcan.cl", 0, 3600_000L, CLAVE)));
        verifyNoInteractions(cuentaService);
    }
}
