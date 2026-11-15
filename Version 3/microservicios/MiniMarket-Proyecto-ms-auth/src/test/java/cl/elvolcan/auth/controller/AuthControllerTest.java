package cl.elvolcan.auth.controller;

import org.springframework.security.authentication.BadCredentialsException;
import cl.elvolcan.auth.exception.GlobalExceptionHandler;
import cl.elvolcan.auth.exception.RegistroDuplicadoException;
import cl.elvolcan.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Prueba la capa web de /api/v1/auth sin base de datos (MockMvc standalone + AuthService simulado):
 * verifica los códigos HTTP que produce el GlobalExceptionHandler.
 */
class AuthControllerTest {

    private static final String REGISTRO_VALIDO = """
            {"nombre":"Ana Pérez","rut":"17234567","username":"ana@duoc.cl","password":"Clave123",
             "direccion":"Calle Nueva 789","region":"Región de Ñuble","comuna":"Chillán","tipoCliente":"Residencial"}
            """;

    private AuthService authService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /register con RUT o usuario duplicado responde 409 Conflict")
    void registroDuplicadoResponde409() throws Exception {
        when(authService.registrar(any()))
                .thenThrow(new RegistroDuplicadoException("Error: El nombre de usuario ya está en uso"));

        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(REGISTRO_VALIDO))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensaje").value("Error: El nombre de usuario ya está en uso"));
    }

    @Test
    @DisplayName("POST /register con datos inválidos responde 400 con el detalle por campo")
    void registroInvalidoResponde400() throws Exception {
        String sinPassword = REGISTRO_VALIDO.replace("\"password\":\"Clave123\",", "");

        mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(sinPassword))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.password").exists());

        verify(authService, never()).registrar(any());
    }

    @Test
    @DisplayName("POST /login con credenciales incorrectas sigue respondiendo 401")
    void loginIncorrectoResponde401() throws Exception {
        when(authService.login(any())).thenThrow(new BadCredentialsException("Error: Usuario o contraseña incorrectos"));

        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"ana@duoc.cl\",\"password\":\"mala\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("H-10: un error interno responde 500 con mensaje neutro (sin detalles técnicos ni 401)")
    void errorInternoResponde500SinDetalles() throws Exception {
        when(authService.login(any())).thenThrow(new RuntimeException("ORA-00942: table or view does not exist"));

        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"ana@duoc.cl\",\"password\":\"Clave1234\"}"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.mensaje").value(GlobalExceptionHandler.MENSAJE_INTERNO));
    }

    @Test
    @DisplayName("H-07: POST /login con usuario o contraseña vacíos responde 400 sin consultar la BD")
    void loginVacioResponde400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.username").exists())
                .andExpect(jsonPath("$.validationErrors.password").exists());

        verify(authService, never()).login(any());
    }

    @Test
    @DisplayName("H-07: el registro exige contraseña de 8+ caracteres con letra y número")
    void registroConContrasenaDebilResponde400() throws Exception {
        for (String debil : new String[]{"abc123", "solamenteletras", "12345678"}) {
            String registro = REGISTRO_VALIDO.replace("\"password\":\"Clave123\"", "\"password\":\"" + debil + "\"");
            mockMvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(registro))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.validationErrors.password").exists());
        }
        verify(authService, never()).registrar(any());
    }
}
