package cl.elvolcan.catalogo.client;

import cl.elvolcan.catalogo.dto.InventarioInitDTO; //  Usaremos este nuevo DTO
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

// Se resuelve por Eureka con el spring.application.name de inventario (sin URL fija),
// igual que los clientes Feign de ms-ventas
@FeignClient(name = "ms-inventario")
public interface InventarioClient {

        @PostMapping("/api/v1/inventario/crear")
        Object crearInventario(@RequestBody InventarioInitDTO dto); //  Cambiamos el DTO

        // Borra el registro de stock del SKU (al eliminar un producto sin ventas); 404 si no existe
        @DeleteMapping("/api/v1/inventario/{sku}")
        void eliminarInventario(@PathVariable("sku") String sku);
}