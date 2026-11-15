package cl.elvolcan.catalogo.exception;

/** El producto aparece en ventas registradas y no se puede eliminar: 409 Conflict. */
public class ProductoConVentasException extends RuntimeException {

    public static final String MENSAJE = "El producto tiene ventas registradas; desactívalo en lugar de eliminarlo";

    public ProductoConVentasException() {
        super(MENSAJE);
    }
}
