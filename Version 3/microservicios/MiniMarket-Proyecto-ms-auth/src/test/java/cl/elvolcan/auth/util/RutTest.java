package cl.elvolcan.auth.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RutTest {

    @Test
    @DisplayName("normaliza quitando puntos, guion y espacios, con K en mayúscula")
    void normaliza() {
        assertEquals("123456785", Rut.normalizar("12.345.678-5"));
        assertEquals("9876543K", Rut.normalizar(" 9.876.543-k "));
        assertEquals("", Rut.normalizar(null));
    }

    @Test
    @DisplayName("calcula el dígito verificador por módulo 11, incluidos 0 y K")
    void digitoVerificador() {
        assertEquals('5', Rut.digitoVerificador("12345678"));
        assertEquals('0', Rut.digitoVerificador("1723456"));
        assertEquals('K', Rut.digitoVerificador("1901102"));
    }

    @Test
    @DisplayName("esValido exige formato y dígito verificador correctos")
    void esValido() {
        assertTrue(Rut.esValido("12.345.678-5"));
        assertTrue(Rut.esValido("1.901.102-k"));
        assertTrue(Rut.esValido("17234560"));
        assertFalse(Rut.esValido("12.345.678-9"));
        assertFalse(Rut.esValido("19011022")); // RUT semilla antiguo
        assertFalse(Rut.esValido("1234567K8"));
        assertFalse(Rut.esValido(null));
    }
}
