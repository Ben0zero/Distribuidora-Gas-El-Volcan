package cl.elvolcan.ventas.repository;

import cl.elvolcan.ventas.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {
    List<Venta> findByUsuarioOrderByFechaVentaDesc(String usuario);

    /**
     * IDs de producto que aparecen en al menos un detalle de venta. Es una sola consulta
     * SELECT DISTINCT sobre detalles_venta: no carga ventas ni detalles en memoria.
     */
    @Query("select distinct d.productoId from DetalleVenta d")
    List<Long> findProductosVendidos();
}