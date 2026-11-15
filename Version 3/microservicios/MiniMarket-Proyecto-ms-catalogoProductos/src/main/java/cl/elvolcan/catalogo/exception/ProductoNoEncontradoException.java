package cl.elvolcan.catalogo.exception;

/** El producto pedido (por id o SKU) no existe en el catálogo: se responde 404. */
public class ProductoNoEncontradoException extends RuntimeException {

    public ProductoNoEncontradoException(String message) {
        super(message);
    }
}
