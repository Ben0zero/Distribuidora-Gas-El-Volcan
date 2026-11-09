package cl.elvolcan.auth.controller;

import cl.elvolcan.auth.config.CorsConfig;
import cl.elvolcan.auth.dto.UsuarioResponseDTO;
import cl.elvolcan.auth.exception.RegistroDuplicadoException;
import cl.elvolcan.auth.exception.UsuarioNoEncontradoException;
import cl.elvolcan.auth.repository.UsuarioRepository;
import cl.elvolcan.auth.security.CustomAuthenticationEntryPoint;
import cl.elvolcan.auth.security.CustomUserDetailsService;
import cl.elvolcan.auth.security.JwtAuthenticationFilter;
import cl.elvolcan.auth.security.SecurityConfig;
import cl.elvolcan.auth.security.jwt.JwtUtil;
import cl.elvolcan.auth.service.UsuarioService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * /api/v1/usuarios con la configuración de seguridad real (sin base de datos):
 * solo ADMIN, DTO validado y códigos 201 / 400 / 403 / 404 / 409.
 */
@WebMvcTest(UsuarioController.class)
@Import({SecurityConfig.class, CustomAuthenticationEntryPoint.class, JwtAuthenticationFilter.class, JwtUtil.class,
        CustomUserDetailsService.class, CorsConfig.class})
@TestPropertySource(properties = {
        "jwt.secret=clave_solo_para_tests_unitarios_0123456789",
        "app.cors.allowed-origins=http://localhost:5173"
})
class UsuarioSeguridadTest {

    private static final String VENDEDOR = """
            {"nombre":"Carla Muñoz","rut":"16543210","username":"carla@elvolcan.cl","password":"Vende123","nombreRol":"VENDEDOR"}
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UsuarioService usuarioService;

    // lo necesita CustomUserDetailsService (no hay JPA en este test)
    @MockitoBean
    private UsuarioRepository usuarioRepository;

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("ADMIN crea un Vendedor: 201 con el DTO de respuesta")
    void adminCreaVendedor() throws Exception {
        UsuarioResponseDTO creado = new UsuarioResponseDTO();
        creado.setId(9L);
        creado.setUsername("carla@elvolcan.cl");
        creado.setNombreRol("VENDEDOR");
        when(usuarioService.crear(any())).thenReturn(creado);

        mockMvc.perform(post("/api/v1/usuarios").contentType(MediaType.APPLICATION_JSON).content(VENDEDOR))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombreRol").value("VENDEDOR"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.token").doesNotExist());
    }

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("usuario duplicado responde 409 y rol inválido responde 400")
    void duplicadoYRolInvalido() throws Exception {
        when(usuarioService.crear(any())).thenThrow(new RegistroDuplicadoException("Error: El nombre de usuario ya está en uso"));
        mockMvc.perform(post("/api/v1/usuarios").contentType(MediaType.APPLICATION_JSON).content(VENDEDOR))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/v1/usuarios").contentType(MediaType.APPLICATION_JSON)
                        .content(VENDEDOR.replace("VENDEDOR", "SUPERVISOR")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.nombreRol").exists());
    }

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("editar un usuario inexistente responde 404")
    void editarInexistente() throws Exception {
        when(usuarioService.actualizar(eq(99L), any())).thenThrow(new UsuarioNoEncontradoException(99L));
        mockMvc.perform(put("/api/v1/usuarios/99").contentType(MediaType.APPLICATION_JSON).content(VENDEDOR))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "vendedor@elvolcan.cl", roles = "VENDEDOR")
    @DisplayName("un VENDEDOR no puede listar ni crear usuarios (403)")
    void vendedorNoAdministraUsuarios() throws Exception {
        when(usuarioService.listar()).thenReturn(List.of());
        mockMvc.perform(get("/api/v1/usuarios")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/usuarios").contentType(MediaType.APPLICATION_JSON).content(VENDEDOR))
                .andExpect(status().isForbidden());
        verify(usuarioService, never()).crear(any());
    }
}
