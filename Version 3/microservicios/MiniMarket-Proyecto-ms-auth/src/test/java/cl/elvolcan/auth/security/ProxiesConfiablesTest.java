package cl.elvolcan.auth.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/** H-07: lista configurable de proxies de los que se acepta X-Forwarded-For (IPs o CIDR). */
class ProxiesConfiablesTest {

    private static ProxiesConfiables con(String... proxies) {
        return new ProxiesConfiables(proxies);
    }

    @Test
    @DisplayName("Por defecto solo confía en la misma máquina (IPv4 e IPv6, también en su forma larga)")
    void porDefectoSoloLocal() {
        ProxiesConfiables proxies = con("127.0.0.1", "::1");

        assertTrue(proxies.esConfiable("127.0.0.1"));
        assertTrue(proxies.esConfiable("::1"));
        assertTrue(proxies.esConfiable("0:0:0:0:0:0:0:1"));
        assertFalse(proxies.esConfiable("172.28.0.5"));
        assertFalse(proxies.esConfiable("203.0.113.7"));
    }

    @Test
    @DisplayName("Un rango CIDR (red interna de Docker) confía en sus IPs y no en las de fuera")
    void rangoCidr() {
        ProxiesConfiables proxies = con("127.0.0.1", "::1", "172.28.0.0/16");

        assertTrue(proxies.esConfiable("172.28.0.5"));
        assertTrue(proxies.esConfiable("172.28.255.254"));
        assertFalse(proxies.esConfiable("172.29.0.5"));
        assertFalse(proxies.esConfiable("10.0.0.1"));
    }

    @Test
    @DisplayName("Ignora espacios y entradas vacías de la configuración")
    void ignoraEspaciosYVacios() {
        ProxiesConfiables proxies = con(" 127.0.0.1 ", "", "  ", " 10.0.0.0/8");

        assertTrue(proxies.esConfiable("127.0.0.1"));
        assertTrue(proxies.esConfiable("10.1.2.3"));
        assertFalse(proxies.esConfiable("192.168.1.10"));
    }

    @Test
    @DisplayName("Sin proxies configurados no confía en nadie")
    void listaVacia() {
        assertFalse(con().esConfiable("127.0.0.1"));
        assertFalse(new ProxiesConfiables(null).esConfiable("127.0.0.1"));
    }

    @Test
    @DisplayName("Una IP remota nula, vacía o que no es IP no es confiable")
    void ipRemotaInvalida() {
        ProxiesConfiables proxies = con("127.0.0.1", "::1");

        assertFalse(proxies.esConfiable(null));
        assertFalse(proxies.esConfiable(""));
        assertFalse(proxies.esConfiable("no-es-una-ip"));
    }

    @Test
    @DisplayName("Una entrada mal escrita en la configuración hace fallar el arranque (no se ignora en silencio)")
    void configuracionInvalida() {
        assertThrows(IllegalArgumentException.class, () -> con("no-es-una-ip"));
    }
}
