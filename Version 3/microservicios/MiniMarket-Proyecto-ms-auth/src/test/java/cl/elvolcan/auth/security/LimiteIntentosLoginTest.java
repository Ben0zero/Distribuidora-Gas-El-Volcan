package cl.elvolcan.auth.security;

import cl.elvolcan.auth.exception.DemasiadosIntentosException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.*;

/** H-07: límite de intentos fallidos de login por usuario + IP y por IP, con un reloj controlado. */
class LimiteIntentosLoginTest {

    private static final String IP = "10.0.0.1";
    private static final String OTRA_IP = "10.0.0.2";

    /** Reloj fijo que la prueba puede adelantar. */
    static class RelojManual extends Clock {
        private Instant ahora = Instant.parse("2026-11-15T12:00:00Z");

        void avanzar(Duration d) {
            ahora = ahora.plus(d);
        }

        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return ahora; }
    }

    private RelojManual reloj;
    private LimiteIntentosLogin limite;

    @BeforeEach
    void setUp() {
        reloj = new RelojManual();
        limite = new LimiteIntentosLogin(reloj);
    }

    private void fallar(String usuario, String ip, int veces) {
        for (int i = 0; i < veces; i++) {
            limite.registrarFallo(usuario, ip);
        }
    }

    @Test
    @DisplayName("5 fallos del mismo usuario + IP bloquean el login con 429 y mensaje genérico")
    void cincoFallosBloquean() {
        fallar("admin@duoc.cl", IP, 4);
        assertDoesNotThrow(() -> limite.verificar("admin@duoc.cl", IP));

        limite.registrarFallo("admin@duoc.cl", IP);
        DemasiadosIntentosException ex = assertThrows(DemasiadosIntentosException.class,
                () -> limite.verificar("admin@duoc.cl", IP));
        assertEquals("Demasiados intentos. Intenta nuevamente en unos minutos.", ex.getMessage());
        // el mensaje no menciona al usuario ni si existe
        assertFalse(ex.getMessage().contains("admin"));
    }

    @Test
    @DisplayName("El usuario se compara sin mayúsculas ni espacios")
    void usuarioNormalizado() {
        fallar(" ADMIN@duoc.cl ", IP, 5);
        assertThrows(DemasiadosIntentosException.class, () -> limite.verificar("admin@duoc.cl", IP));
    }

    @Test
    @DisplayName("Un login exitoso reinicia el contador del usuario + IP")
    void exitoReiniciaContador() {
        fallar("cliente@elvolcan.cl", IP, 4);
        limite.registrarExito("cliente@elvolcan.cl", IP);
        fallar("cliente@elvolcan.cl", IP, 4);

        assertDoesNotThrow(() -> limite.verificar("cliente@elvolcan.cl", IP));
    }

    @Test
    @DisplayName("El bloqueo vence a los 15 minutos (reloj fijo)")
    void bloqueoVence() {
        fallar("admin@duoc.cl", IP, 5);
        reloj.avanzar(Duration.ofMinutes(14));
        assertThrows(DemasiadosIntentosException.class, () -> limite.verificar("admin@duoc.cl", IP));

        reloj.avanzar(Duration.ofMinutes(1));
        assertDoesNotThrow(() -> limite.verificar("admin@duoc.cl", IP));
    }

    @Test
    @DisplayName("Los fallos fuera de la ventana de 15 minutos no cuentan")
    void fallosAntiguosNoCuentan() {
        fallar("admin@duoc.cl", IP, 4);
        reloj.avanzar(Duration.ofMinutes(16));
        limite.registrarFallo("admin@duoc.cl", IP);

        assertDoesNotThrow(() -> limite.verificar("admin@duoc.cl", IP));
    }

    @Test
    @DisplayName("Un usuario inexistente se cuenta y se bloquea igual que uno real")
    void usuarioInexistenteSeCuentaIgual() {
        fallar("no-existe@duoc.cl", IP, 5);
        assertThrows(DemasiadosIntentosException.class, () -> limite.verificar("no-existe@duoc.cl", IP));
    }

    @Test
    @DisplayName("El bloqueo de usuario + IP no afecta al mismo usuario desde otra IP")
    void bloqueoNoAfectaOtraIp() {
        fallar("admin@duoc.cl", IP, 5);

        assertThrows(DemasiadosIntentosException.class, () -> limite.verificar("admin@duoc.cl", IP));
        assertDoesNotThrow(() -> limite.verificar("admin@duoc.cl", OTRA_IP));
    }

    @Test
    @DisplayName("20 fallos desde una IP con distintos usuarios bloquean la IP completa")
    void veinteFallosBloqueanIp() {
        for (int i = 0; i < 19; i++) {
            limite.registrarFallo("usuario" + i + "@duoc.cl", IP);
        }
        assertDoesNotThrow(() -> limite.verificar("otro@duoc.cl", IP));

        limite.registrarFallo("usuario19@duoc.cl", IP);
        assertThrows(DemasiadosIntentosException.class, () -> limite.verificar("otro@duoc.cl", IP));
        assertDoesNotThrow(() -> limite.verificar("otro@duoc.cl", OTRA_IP));
    }

    @Test
    @DisplayName("La limpieza borra las entradas vencidas")
    void limpiezaBorraVencidas() {
        fallar("admin@duoc.cl", IP, 2);
        assertEquals(2, limite.entradas()); // usuario+IP e IP

        reloj.avanzar(Duration.ofMinutes(16));
        limite.verificar("admin@duoc.cl", IP); // dispara la limpieza periódica

        assertEquals(0, limite.entradas());
    }
}
