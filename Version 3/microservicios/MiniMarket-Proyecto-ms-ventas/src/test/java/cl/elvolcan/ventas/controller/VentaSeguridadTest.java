package cl.elvolcan.ventas.controller;

import jakarta.servlet.RequestDispatcher;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import cl.elvolcan.ventas.exception.GlobalExceptionHandler;
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

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;

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

    @Test
    @WithMockUser(username = "cliente@elvolcan.cl", roles = "CLIENTE")
    @DisplayName("comprar un producto inactivo o con cantidades inválidas responde 400")
    void ventaInvalidaResponde400() throws Exception {
        when(ventaService.crearPedido(any()))
                .thenThrow(new IllegalArgumentException("El producto Cilindro 45 kg no está disponible para la venta"));
        mockMvc.perform(post("/api/v1/ventas").contentType(MediaType.APPLICATION_JSON).content(VENTA))
                .andExpect(status().isBadRequest());

        // 101 unidades: lo rechaza la validación del DTO antes de llegar al servicio
        String ventaExcesiva = VENTA.replace("\"cantidad\":1", "\"cantidad\":101");
        mockMvc.perform(post("/api/v1/ventas").contentType(MediaType.APPLICATION_JSON).content(ventaExcesiva))
                .andExpect(status().isBadRequest());
        verify(ventaService, times(1)).crearPedido(any());
    }

    @Test
    @DisplayName("H-02: el tipo de cliente se toma del claim del JWT aunque el body diga Comercial")
    void tipoClienteSaleDelTokenYNoDelBody() throws Exception {
        // Token firmado con la clave de pruebas, como lo emitiría ms-auth para un cliente Residencial
        String token = Jwts.builder()
                .setClaims(Map.of("rol", "ROLE_CLIENTE", "tipoCliente", "Residencial"))
                .setSubject("cliente@elvolcan.cl")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.hmacShaKeyFor("clave_solo_para_tests_unitarios_0123456789"
                        .getBytes(StandardCharsets.UTF_8)), SignatureAlgorithm.HS256)
                .compact();
        String ventaConTipoManipulado = """
                {"tipoCliente":"Comercial","direccion":"Calle Nueva 789","comuna":"Chillán","metodoPago":"Efectivo",
                 "detalles":[{"productoId":2,"cantidad":1}]}
                """;
        AtomicReference<Object> tipoVistoPorElServicio = new AtomicReference<>();
        when(ventaService.crearPedido(any())).thenAnswer(inv -> {
            tipoVistoPorElServicio.set(SecurityContextHolder.getContext().getAuthentication().getDetails());
            return new VentaResponseDTO();
        });

        mockMvc.perform(post("/api/v1/ventas").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(ventaConTipoManipulado))
                .andExpect(status().isCreated());

        // El servicio ve el tipo del token ("Residencial"), no el "Comercial" del body
        assertEquals("Residencial", tipoVistoPorElServicio.get());
    }

    @Test
    @WithMockUser(username = "cliente@elvolcan.cl", roles = "CLIENTE")
    @DisplayName("H-03: una confirmación de pago concurrente responde 409")
    void confirmacionConcurrenteResponde409() throws Exception {
        when(ventaService.confirmarPago(5L))
                .thenThrow(new org.springframework.orm.ObjectOptimisticLockingFailureException("Venta", 5L));

        mockMvc.perform(put("/api/v1/ventas/5/confirmar")).andExpect(status().isConflict());
    }

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("H-10: un error interno responde 500 sin el mensaje técnico")
    void errorInternoResponde500SinDetalles() throws Exception {
        when(ventaService.listarTodas()).thenThrow(new RuntimeException("ORA-00942: table or view does not exist"));

        mockMvc.perform(get("/api/v1/ventas"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value(GlobalExceptionHandler.MENSAJE_INTERNO));
    }

    @Test
    @DisplayName("/error es público: el 403 de una regla de rol no se convierte en 401 al reenviarse a /error")
    void errorConservaElCodigo403() throws Exception {
        // Simula el reenvío del contenedor tras un 403 (MockMvc no hace el reenvío por sí solo)
        mockMvc.perform(get("/error").requestAttr(RequestDispatcher.ERROR_STATUS_CODE, 403))
                .andExpect(status().isForbidden());
    }

    // --- GET /api/v1/ventas/productos-vendidos: solo ADMIN ---

    @Test
    @WithMockUser(username = "admin@duoc.cl", roles = "ADMIN")
    @DisplayName("ADMIN obtiene los productoId con ventas")
    void adminObtieneProductosVendidos() throws Exception {
        when(ventaService.productosVendidos()).thenReturn(List.of(281L, 282L));
        mockMvc.perform(get("/api/v1/ventas/productos-vendidos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value(281))
                .andExpect(jsonPath("$[1]").value(282));
    }

    @Test
    @WithMockUser(username = "vendedor@elvolcan.cl", roles = "VENDEDOR")
    @DisplayName("VENDEDOR no puede ver los productos vendidos (403)")
    void vendedorNoVeProductosVendidos() throws Exception {
        mockMvc.perform(get("/api/v1/ventas/productos-vendidos")).andExpect(status().isForbidden());
        verify(ventaService, never()).productosVendidos();
    }

    @Test
    @WithMockUser(username = "cliente@elvolcan.cl", roles = "CLIENTE")
    @DisplayName("CLIENTE no puede ver los productos vendidos (403)")
    void clienteNoVeProductosVendidos() throws Exception {
        mockMvc.perform(get("/api/v1/ventas/productos-vendidos")).andExpect(status().isForbidden());
        verify(ventaService, never()).productosVendidos();
    }

    @Test
    @DisplayName("Sin token, productos vendidos responde 401")
    void sinTokenProductosVendidos401() throws Exception {
        mockMvc.perform(get("/api/v1/ventas/productos-vendidos")).andExpect(status().isUnauthorized());
        verify(ventaService, never()).productosVendidos();
    }
}
