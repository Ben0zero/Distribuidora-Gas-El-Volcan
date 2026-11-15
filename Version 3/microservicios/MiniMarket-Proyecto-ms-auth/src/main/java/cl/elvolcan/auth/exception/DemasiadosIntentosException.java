package cl.elvolcan.auth.exception;

/** Login bloqueado temporalmente por demasiados intentos fallidos: 429 Too Many Requests. */
public class DemasiadosIntentosException extends RuntimeException {

    public DemasiadosIntentosException(String mensaje) {
        super(mensaje);
    }
}
