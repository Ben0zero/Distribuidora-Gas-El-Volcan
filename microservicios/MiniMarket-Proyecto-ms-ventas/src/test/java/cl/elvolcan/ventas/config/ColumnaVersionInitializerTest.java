package cl.elvolcan.ventas.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ColumnaVersionInitializerTest {

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final ColumnaVersionInitializer initializer = new ColumnaVersionInitializer(jdbc);

    @Test
    @DisplayName("columna nullable (recién agregada por ddl-auto): rellena NULL con 0 y la deja DEFAULT 0 NOT NULL")
    void corrigeColumnaNullable() {
        when(jdbc.queryForList(anyString(), eq(String.class), eq("VENTAS"))).thenReturn(List.of("Y"));
        when(jdbc.update("UPDATE ventas SET version = 0 WHERE version IS NULL")).thenReturn(14);

        initializer.run(null);

        verify(jdbc).update("UPDATE ventas SET version = 0 WHERE version IS NULL");
        verify(jdbc).execute("ALTER TABLE ventas MODIFY (version DEFAULT 0)");
        verify(jdbc).execute("ALTER TABLE ventas MODIFY (version NOT NULL)");
    }

    @Test
    @DisplayName("columna ya NOT NULL: no vuelve a aplicar NOT NULL (evita ORA-01442)")
    void columnaYaCorregida() {
        when(jdbc.queryForList(anyString(), eq(String.class), eq("VENTAS"))).thenReturn(List.of("N"));

        initializer.run(null);

        verify(jdbc, never()).execute("ALTER TABLE ventas MODIFY (version NOT NULL)");
    }

    @Test
    @DisplayName("si la columna no existe todavía, no ejecuta nada")
    void sinColumna() {
        when(jdbc.queryForList(anyString(), eq(String.class), eq("VENTAS"))).thenReturn(List.of());

        initializer.run(null);

        verify(jdbc, never()).update(anyString());
        verify(jdbc, never()).execute(anyString());
    }
}
