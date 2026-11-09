package cl.elvolcan.auth.exception;

/**
 * Se lanza cuando se intenta registrar un usuario con un RUT o nombre de usuario
 * que ya existe. GlobalExceptionHandler la traduce a HTTP 409 Conflict.
 */
public class RegistroDuplicadoException extends RuntimeException {

    public RegistroDuplicadoException(String mensaje) {
        super(mensaje);
    }
}
