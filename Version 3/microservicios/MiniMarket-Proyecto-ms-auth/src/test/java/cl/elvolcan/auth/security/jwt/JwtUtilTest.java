package cl.elvolcan.auth.security.jwt;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    // Clave solo para pruebas: la real se lee de ~/.elvolcan/secrets.properties
    private final JwtUtil jwtUtil = new JwtUtil("clave_solo_para_tests_unitarios_0123456789");

    @Test
    @DisplayName("generateToken incluye el claim tipoCliente para que ms-ventas fije el precio")
    void tokenIncluyeTipoCliente() {
        String token = jwtUtil.generateToken("cliente", "CLIENTE", "Comercial");

        assertEquals("cliente", jwtUtil.extractUsername(token));
        assertEquals("ROLE_CLIENTE", jwtUtil.extractClaim(token, c -> c.get("rol", String.class)));
        assertEquals("Comercial", jwtUtil.extractClaim(token, c -> c.get("tipoCliente", String.class)));
    }

    @Test
    @DisplayName("generateToken omite tipoCliente cuando el usuario no lo tiene (ADMIN/VENDEDOR)")
    void tokenSinTipoCliente() {
        String token = jwtUtil.generateToken("admin", "ADMIN");

        assertNull(jwtUtil.extractClaim(token, c -> c.get("tipoCliente")));
    }

    @Test
    @DisplayName("H-09: el token vence en 2 horas (antes 10)")
    void tokenVenceEnDosHoras() {
        long antes = System.currentTimeMillis();
        String token = jwtUtil.generateToken("cliente", "CLIENTE", "Residencial");

        long vence = jwtUtil.extractClaim(token, c -> c.getExpiration().getTime());
        long dosHoras = 2L * 60 * 60 * 1000;
        // la fecha del JWT se guarda en segundos: se tolera 1 s de redondeo
        assertTrue(vence <= antes + dosHoras + 1000 && vence >= antes + dosHoras - 1000);
    }
}
