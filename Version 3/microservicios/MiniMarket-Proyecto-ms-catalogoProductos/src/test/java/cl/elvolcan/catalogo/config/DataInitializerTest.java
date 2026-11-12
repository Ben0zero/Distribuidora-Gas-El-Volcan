package cl.elvolcan.catalogo.config;

import cl.elvolcan.catalogo.model.Producto;
import cl.elvolcan.catalogo.repository.ProductoRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

class DataInitializerTest {

    @Test
    @DisplayName("la semilla tiene los 14 productos del frontend con SKU único, precios e imagen")
    void semillaCoincideConFrontend() {
        List<Producto> semilla = DataInitializer.productosBase();

        assertEquals(14, semilla.size());
        Set<String> skus = semilla.stream().map(Producto::getSku).collect(Collectors.toSet());
        assertEquals(14, skus.size(), "los SKU no deben repetirse");
        assertTrue(skus.containsAll(Set.of("CL001", "CL004", "RG001", "MG004", "AC003")));
        assertEquals(Set.of("Cilindros de Gas", "Reguladores", "Mangueras y Conexiones", "Accesorios"),
                semilla.stream().map(Producto::getCategoria).collect(Collectors.toSet()));

        for (Producto p : semilla) {
            assertTrue(p.getPrecioResidencial() > 0, p.getSku());
            assertTrue(p.getPrecioComercial() <= p.getPrecioResidencial(), p.getSku());
            assertTrue(p.getImagen().startsWith("/IMAGENES/"), p.getSku());
            assertTrue(p.getActivo());
        }
    }

    @Test
    @DisplayName("si ya hay productos y no se pide reiniciar, no modifica el catálogo")
    void noCargaSiYaHayDatos() {
        ProductoRepository repo = mock(ProductoRepository.class);
        when(repo.count()).thenReturn(5L);

        DataInitializer.cargarSemilla(repo, false);

        verify(repo, never()).deleteAll();
        verify(repo, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("con app.semilla.reiniciar=true borra los productos antiguos y carga los 14 nuevos")
    void reiniciaLaSemilla() {
        ProductoRepository repo = mock(ProductoRepository.class);

        DataInitializer.cargarSemilla(repo, true);

        verify(repo).deleteAll();
        verify(repo).saveAll(argThat(lista -> ((List<?>) lista).size() == 14));
    }
}
