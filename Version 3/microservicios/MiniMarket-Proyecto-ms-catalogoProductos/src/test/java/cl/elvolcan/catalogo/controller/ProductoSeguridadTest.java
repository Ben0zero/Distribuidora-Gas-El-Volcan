package cl.elvolcan.catalogo.controller;

import cl.elvolcan.catalogo.client.InventarioClient;
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

    @Test
    @DisplayName("el catálogo se puede leer sin token (tienda pública)")
    void catalogoPublico() throws Exception {
        when(productoService.obtenerTodosActivos()).thenReturn(List.of());
        mockMvc.perform(get("/api/v1/productos")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "vendedor@elvolcan.cl", roles = "VENDEDOR")
    @DisplayName("VENDEDOR no puede crear, editar ni desactivar productos (403)")
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
}
