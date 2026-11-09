package cl.elvolcan.catalogo.config;

import cl.elvolcan.catalogo.model.Producto;
import cl.elvolcan.catalogo.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Carga inicial del catálogo de El Volcán.
 * Los 14 productos son los mismos del frontend (frontend/src/datos/productos.js):
 * el "codigo" del frontend es el SKU, y se usan sus precios, categorías e imágenes.
 *
 * Si la tabla ya tiene datos no se toca, salvo que se inicie con
 * app.semilla.reiniciar=true (ej. --app.semilla.reiniciar=true o REINICIAR_SEMILLA=true):
 * en ese caso se borran los productos existentes y se vuelve a cargar la semilla.
 */
@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initCatalog(ProductoRepository productoRepository,
                                  @Value("${app.semilla.reiniciar:false}") boolean reiniciar) {
        return args -> cargarSemilla(productoRepository, reiniciar);
    }

    static void cargarSemilla(ProductoRepository productoRepository, boolean reiniciar) {
        if (reiniciar) {
            System.out.println("[SEMILLA] app.semilla.reiniciar=true: borrando productos existentes del catalogo...");
            productoRepository.deleteAll();
        } else if (productoRepository.count() > 0) {
            System.out.println("Catalogo ya tiene datos, omitiendo inicializacion.");
            return;
        }

        List<Producto> semilla = productosBase();
        productoRepository.saveAll(semilla);
        System.out.println("Catalogo inicializado con " + semilla.size() + " productos de El Volcan.");
    }

    // sku, nombre, descripcion, precio residencial, precio comercial, categoria, imagen
    static List<Producto> productosBase() {
        return List.of(
            producto("CL001", "Cilindro GLP 5 kg", "Cilindro de gas licuado de petróleo 5 kg. Para uso residencial (cocina, calefacción pequeña).", 6500, 6000, "Cilindros de Gas", "/IMAGENES/cilindro de 5 K.png"),
            producto("CL002", "Cilindro GLP 11 kg", "Cilindro estándar doméstico. El más utilizado en hogares chilenos.", 12000, 11000, "Cilindros de Gas", "/IMAGENES/cilindro de 11K.png"),
            producto("CL003", "Cilindro GLP 15 kg", "Cilindro de mayor capacidad para hogares de alto consumo o locales pequeños.", 16000, 14500, "Cilindros de Gas", "/IMAGENES/cilindro de 15K.png"),
            producto("CL004", "Cilindro GLP 45 kg", "Cilindro industrial. Uso comercial: restaurantes, talleres, locales.", 45000, 40000, "Cilindros de Gas", "/IMAGENES/cilindro de 45K.png"),
            producto("RG001", "Regulador doméstico estándar", "Regulador de 1 etapa para cilindros 5, 11 y 15 kg. Presión de salida 28 mbar.", 8990, 8200, "Reguladores", "/IMAGENES/Regulador Standar.png"),
            producto("RG002", "Regulador de alta presión", "Regulador para cocinas industriales o equipos de mayor consumo. Presión regulable.", 18990, 17000, "Reguladores", "/IMAGENES/Regaulador de Alta presion.png"),
            producto("RG003", "Regulador dual (2 salidas)", "Permite conectar dos artefactos simultáneamente al mismo cilindro.", 14990, 13500, "Reguladores", "/IMAGENES/Regulador Dual.png"),
            producto("MG001", "Manguera gas 1.5 m", "Manguera flexible homologada. Diámetro interior 9 mm.", 3990, 3500, "Mangueras y Conexiones", "/IMAGENES/Manguera gas 1.5 m.png"),
            producto("MG002", "Manguera gas 3 m", "Manguera larga para instalaciones donde el artefacto está alejado del cilindro.", 6990, 6200, "Mangueras y Conexiones", "/IMAGENES/Manguera gas 3 m.png"),
            producto("MG003", "Abrazadera metálica", "Abrazadera de acero para asegurar la conexión manguera-regulador.", 990, 800, "Mangueras y Conexiones", "/IMAGENES/Abrazadera metálica.png"),
            producto("MG004", "Kit conexión completo", "Todo lo necesario para instalar un cilindro nuevo.", 12990, 11500, "Mangueras y Conexiones", "/IMAGENES/kit completo.png"),
            producto("AC001", "Carro porta cilindro 11/15 kg", "Carro metálico con ruedas para transportar cilindros con seguridad.", 12990, 11000, "Accesorios", "/IMAGENES/carro transportador de gas.png"),
            producto("AC002", "Tapa protectora para válvula", "Tapa de plástico ABS para proteger la válvula durante el transporte.", 1490, 1200, "Accesorios", "/IMAGENES/Tapa de plástico ABS.png"),
            producto("AC003", "Detector de gas a batería", "Sensor electroquímico. Alarma sonora y visual ante fuga de gas GLP.", 19990, 17000, "Accesorios", "/IMAGENES/Sensor electroquímico.png")
        );
    }

    private static Producto producto(String sku, String nombre, String descripcion,
                                     int precioRes, int precioCom, String categoria, String imagen) {
        Producto nuevo = new Producto();
        nuevo.setSku(sku);
        nuevo.setNombre(nombre);
        nuevo.setDescripcion(descripcion);
        nuevo.setPrecioResidencial(precioRes);
        nuevo.setPrecioComercial(precioCom);
        nuevo.setPrecio(precioRes);
        nuevo.setCategoria(categoria);
        nuevo.setImagen(imagen);
        nuevo.setActivo(true);
        return nuevo;
    }
}
