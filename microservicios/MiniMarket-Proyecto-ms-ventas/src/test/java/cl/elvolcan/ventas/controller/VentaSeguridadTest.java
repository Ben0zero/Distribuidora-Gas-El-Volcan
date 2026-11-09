package cl.elvolcan.ventas.controller;

import cl.elvolcan.ventas.client.CatalogoClient;
import cl.elvolcan.ventas.client.InventarioClient;
import cl.elvolcan.ventas.config.CorsConfig;
import cl.elvolcan.ventas.config.JwtAuthenticationFilter;
import cl.elvolcan.ventas.config.SecurityConfig;
import cl.elvolcan.ventas.security.CustomAuthenticationEntryPoint;
import cl.elvolcan.ventas.dto.VentaResponseDTO;
import cl.elvolcan.ventas.service.VentaService;
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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Reglas de rol de /api/v1/ventas con el SecurityConfig real (sin base de datos):
 * el VENDEDOR solo lee la lista y el detalle de órdenes; comprar es de CLIENTE/ADMIN.
 */
@WebMvcTest(VentaController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CorsConfig.class, CustomAuthenticationEntryPoint.class})
@TestPropertySource(properties = {
        "jwt.secret=clave_solo_para_tests_unitarios_0123456789",
        "app.cors.allowed-origins=http://localhost:5173"
})
class VentaSeguridadTest {

    private static final String VENTA = """
            {"direccion":"Calle Nueva 789","comuna":"Chillán","metodoPago":"Efectivo",
             "detalles":[{"productoId":2,"cantidad":1}]}
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private VentaService ventaService;

    // @EnableFeignClients registra estos clientes: se simulan para no levantar Feign/Eureka
    @MockitoBean
    private CatalogoClient catalogoClient;

    @MockitoBean
    private InventarioClient inventarioClient;

    @Test
    @WithMockUser(username = "vendedor@elvolcan.cl", roles = "VENDEDOR")
    @DisplayName("VENDEDOR puede ver la lista y el detalle de órdenes")
    void vendedorLeeOrdenes() throws Exception {
        when(ventaService.listarTodas()).thenReturn(List.of());
        when(ventaService.obtenerPorId(anyLong())).thenReturn(new VentaResponseDTO());

        mockMvc.perform(get("/api/v1/ventas")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/ventas/5")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "vendedor@elvolcan.cl", roles = "VENDEDOR")
    @DisplayName("VENDEDOR no puede comprar, confirmar pagos ni usar 'mis compras' (403)")
    void vendedorNoCompra() throws Exception {
        mockMvc.perform(post("/api/v1/ventas").contentType(MediaType.APPLICATION_JSON).content(VENTA))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/v1/ventas/5/confirmar")).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/ventas/mis-compras")).andExpect(status().isForbidden());
        verify(ventaService, never()).crearPedido(any());
        verify(ventaService, never()).confirmarPago(anyLong());
    }

    @Test
    @DisplayName("sin token responde 401 (no autenticado), igual que los demás microservicios")
    void sinTokenResponde401() throws Exception {
        mockMvc.perform(get("/api/v1/ventas/mis-compras")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/ventas").contentType(MediaType.APPLICATION_JSON).content(VENTA))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "cliente@elvolcan.cl", roles = "CLIENTE")
    @DisplayName("CLIENTE puede comprar pero no ver todas las ventas (403)")
    void clienteCompraPeroNoVeTodas() throws Exception {
        when(ventaService.crearPedido(any())).thenReturn(new VentaResponseDTO());

        mockMvc.perform(post("/api/v1/ventas").contentType(MediaType.APPLICATION_JSON).content(VENTA))
                .andExpect(status().isCreated());
        mockMvc.perform(get("/api/v1/ventas")).andExpect(status().isForbidden());
    }
}
