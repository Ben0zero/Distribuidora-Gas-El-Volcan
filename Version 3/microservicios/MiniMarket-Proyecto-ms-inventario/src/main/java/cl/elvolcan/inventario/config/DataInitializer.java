package cl.elvolcan.inventario.config;

import cl.elvolcan.inventario.model.Inventario;
import cl.elvolcan.inventario.repository.InventarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Stock inicial de El Volcán: mismos SKU que la semilla de ms-catalogoProductos
 * y mismo stock / stock crítico que el frontend (frontend/src/datos/productos.js).
 *
 * Con app.semilla.reiniciar=true se borran los registros existentes y se vuelve a cargar.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    // Tope de stock por producto (InventarioServiceImpl rechaza aumentos por sobre este valor)
    static final double NIVEL_MAXIMO = 500.0;

    private final InventarioRepository inventarioRepository;
    private final boolean reiniciar;

    public DataInitializer(InventarioRepository inventarioRepository,
                           @Value("${app.semilla.reiniciar:false}") boolean reiniciar) {
        this.inventarioRepository = inventarioRepository;
        this.reiniciar = reiniciar;
    }

    @Override
    public void run(String... args) {
        if (reiniciar) {
            System.out.println("[SEMILLA] app.semilla.reiniciar=true: borrando inventario existente...");
            inventarioRepository.deleteAll();
        } else if (inventarioRepository.count() > 0) {
            System.out.println("Inventario ya tiene datos, omitiendo inicializacion.");
            return;
        }

        List<Inventario> semilla = stockBase();
        inventarioRepository.saveAll(semilla);
        System.out.println("Inventario inicializado con " + semilla.size() + " registros.");
    }

    // sku, stock actual, nivel crítico
    static List<Inventario> stockBase() {
        return List.of(
            inventario("CL001", 80), inventario("CL002", 200), inventario("CL003", 90), inventario("CL004", 30),
            inventario("RG001", 45), inventario("RG002", 12), inventario("RG003", 18),
            inventario("MG001", 80), inventario("MG002", 50), inventario("MG003", 200), inventario("MG004", 25),
            inventario("AC001", 20), inventario("AC002", 60), inventario("AC003", 8)
        );
    }

    private static Inventario inventario(String sku, double stockActual) {
        Inventario inv = new Inventario();
        inv.setSku(sku);
        inv.setStockActual(stockActual);
        inv.setNivelCritico(5.0); // stockCritico del frontend
        inv.setNivelMaximo(NIVEL_MAXIMO);
        return inv;
    }
}
