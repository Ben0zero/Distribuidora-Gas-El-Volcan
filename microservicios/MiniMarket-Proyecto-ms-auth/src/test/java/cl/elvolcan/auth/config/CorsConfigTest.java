package cl.elvolcan.auth.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CorsConfigTest {

    private final CorsConfigurationSource source = new CorsConfig()
            .corsConfigurationSource(" http://localhost:5173 , http://127.0.0.1:5174 ,");

    @Test
    @DisplayName("parsea la lista de orígenes separada por comas, ignorando espacios y vacíos")
    void parseaOrigenes() {
        assertEquals(List.of("http://localhost:5173", "http://127.0.0.1:5174"),
                CorsConfig.parseOrigins(" http://localhost:5173 , http://127.0.0.1:5174 ,"));
    }

    @Test
    @DisplayName("aplica CORS a las rutas /api/** permitiendo el origen del frontend y el header Authorization")
    void aplicaCorsALaApi() {
        CorsConfiguration config = source.getCorsConfiguration(
                new MockHttpServletRequest("POST", "/api/v1/auth/login"));

        assertNotNull(config);
        assertEquals("http://localhost:5173", config.checkOrigin("http://localhost:5173"));
        assertNull(config.checkOrigin("http://sitio-malicioso.com"));
        assertTrue(config.getAllowedHeaders().contains("Authorization"));
        assertTrue(config.getAllowedMethods().containsAll(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS")));
    }

    @Test
    @DisplayName("no aplica CORS fuera de /api/** (ej. Swagger)")
    void noAplicaFueraDeLaApi() {
        assertNull(source.getCorsConfiguration(new MockHttpServletRequest("GET", "/swagger-ui/index.html")));
    }
}
