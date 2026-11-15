package cl.elvolcan.ventas.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    @Test
    @DisplayName("H-10: de un error de ms-inventario se reenvía solo el mensaje de negocio, no la URL interna")
    void extraeSoloElMensajeDeNegocio() {
        String cuerpoInventario = "{\"mensaje\":\"Stock insuficiente\",\"error\":\"Petición incorrecta (400)\"}";
        assertEquals("Stock insuficiente", GlobalExceptionHandler.mensajeDeNegocio(cuerpoInventario));
        assertEquals("Producto no encontrado", GlobalExceptionHandler.mensajeDeNegocio("{\"message\": \"Producto no encontrado\"}"));
        assertNull(GlobalExceptionHandler.mensajeDeNegocio("<html>Bad Gateway</html>"));
        assertNull(GlobalExceptionHandler.mensajeDeNegocio(null));
    }
}
