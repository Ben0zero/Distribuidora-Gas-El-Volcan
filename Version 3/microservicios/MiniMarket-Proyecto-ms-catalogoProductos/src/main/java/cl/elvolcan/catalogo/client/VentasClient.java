package cl.elvolcan.catalogo.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

// Se resuelve por Eureka con el spring.application.name de ventas (sin URL fija).
// El FeignInterceptor reenvía el token del ADMIN que pidió eliminar el producto.
@FeignClient(name = "ms-ventas")
public interface VentasClient {

    // IDs de producto que tienen al menos un detalle de venta (solo ADMIN)
    @GetMapping("/api/v1/ventas/productos-vendidos")
    List<Long> productosVendidos();
}
