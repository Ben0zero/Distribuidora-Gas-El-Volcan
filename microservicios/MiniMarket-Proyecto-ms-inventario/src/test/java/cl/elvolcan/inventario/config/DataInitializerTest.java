package cl.elvolcan.inventario.config;

import cl.elvolcan.inventario.model.Inventario;
import cl.elvolcan.inventario.repository.InventarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

class DataInitializerTest {

    // Deben ser exactamente los SKU de la semilla de ms-catalogoProductos
    private static final Set<String> SKUS_CATALOGO = Set.of(
            "CL001", "CL002", "CL003", "CL004", "RG001", "RG002", "RG003",
            "MG001", "MG002", "MG003", "MG004", "AC001", "AC002", "AC003");

    @Test
    @DisplayName("el stock inicial cubre los 14 SKU del catálogo con valores válidos")
    void stockCubreElCatalogo() {
        List<Inventario> stock = DataInitializer.stockBase();

        assertEquals(SKUS_CATALOGO, stock.stream().map(Inventario::getSku).collect(Collectors.toSet()));
        for (Inventario inv : stock) {
            assertTrue(inv.getStockActual() > 0, inv.getSku());
            assertTrue(inv.getStockActual() <= inv.getNivelMaximo(), inv.getSku());
            assertEquals(5.0, inv.getNivelCritico());
        }
    }

    @Test
    @DisplayName("sin reiniciar y con datos existentes no modifica el inventario")
    void noCargaSiYaHayDatos() {
        InventarioRepository repo = mock(InventarioRepository.class);
        when(repo.count()).thenReturn(3L);

        new DataInitializer(repo, false).run();

        verify(repo, never()).deleteAll();
        verify(repo, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("con app.semilla.reiniciar=true borra el inventario antiguo y carga 14 registros")
    void reiniciaLaSemilla() {
        InventarioRepository repo = mock(InventarioRepository.class);

        new DataInitializer(repo, true).run();

        verify(repo).deleteAll();
        verify(repo).saveAll(argThat(lista -> ((List<?>) lista).size() == 14));
    }
}
