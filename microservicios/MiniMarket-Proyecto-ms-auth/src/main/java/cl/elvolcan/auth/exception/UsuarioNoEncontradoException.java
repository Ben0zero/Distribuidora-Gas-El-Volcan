package cl.elvolcan.auth.exception;

/** Usuario inexistente: GlobalExceptionHandler la traduce a HTTP 404. */
public class UsuarioNoEncontradoException extends RuntimeException {

    public UsuarioNoEncontradoException(Long id) {
        super("Error: Usuario no encontrado con ID " + id);
    }
}
