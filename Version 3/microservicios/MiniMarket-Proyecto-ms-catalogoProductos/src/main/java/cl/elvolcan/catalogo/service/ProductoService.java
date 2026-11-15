package cl.elvolcan.catalogo.service;

import java.util.List;
import cl.elvolcan.catalogo.dto.ProductoRequestDTO;
import cl.elvolcan.catalogo.dto.ProductoResponseDTO;

public interface ProductoService {
    // crear productos nuevos
    ProductoResponseDTO crearProducto(ProductoRequestDTO request);
    
    // ver todo el catalogo pero los activos no mas
    List<ProductoResponseDTO> obtenerTodosActivos();
    
    // Para que ventas/inventario nos pregunten por un SKU específico
    ProductoResponseDTO obtenerPorSku(String sku);

    ProductoResponseDTO obtenerPorId(Long id);

    // editar un producto existente (el SKU no se puede cambiar porque enlaza con inventario)
    ProductoResponseDTO actualizarProducto(Long id, ProductoRequestDTO request);
    
    // borrado definitivo: solo si no tiene ventas (409) y borra también su inventario.
    // Para ocultarlo de la tienda sin borrarlo se usa cambiarEstado (PATCH /{id}/estado)
    void eliminarProducto(String sku);

    // panel admin: todos los productos, activos e inactivos
    List<ProductoResponseDTO> obtenerTodos();

    // activa o desactiva un producto (la tienda solo muestra los activos)
    ProductoResponseDTO cambiarEstado(Long id, boolean activo);
}
