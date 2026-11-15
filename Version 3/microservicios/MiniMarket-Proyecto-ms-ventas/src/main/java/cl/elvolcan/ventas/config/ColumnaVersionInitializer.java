package cl.elvolcan.ventas.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Deja lista la columna de bloqueo optimista (@Version) de la tabla "ventas".
 *
 * Con ddl-auto=update, Hibernate agrega la columna "version" a una tabla que ya tiene filas,
 * pero en Oracle la deja nullable y sin valor por defecto, así que las filas antiguas quedan
 * con NULL y Hibernate falla al incrementar la versión (NullPointerException al hacer UPDATE).
 * Este paso es idempotente: rellena con 0 los NULL y fija DEFAULT 0 NOT NULL. Corre antes que
 * cualquier otro inicializador para que la semilla ya trabaje con la columna corregida.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ColumnaVersionInitializer implements ApplicationRunner {

    static final String TABLA = "ventas";

    private static final Logger log = LoggerFactory.getLogger(ColumnaVersionInitializer.class);

    private final JdbcTemplate jdbcTemplate;

    public ColumnaVersionInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<String> nullable = jdbcTemplate.queryForList(
                "SELECT nullable FROM user_tab_columns WHERE table_name = ? AND column_name = 'VERSION'",
                String.class, TABLA.toUpperCase());
        if (nullable.isEmpty()) {
            return; // la columna aún no existe (Hibernate la crea en el próximo arranque)
        }
        int filas = jdbcTemplate.update("UPDATE " + TABLA + " SET version = 0 WHERE version IS NULL");
        jdbcTemplate.execute("ALTER TABLE " + TABLA + " MODIFY (version DEFAULT 0)");
        if ("Y".equals(nullable.get(0))) {
            jdbcTemplate.execute("ALTER TABLE " + TABLA + " MODIFY (version NOT NULL)");
        }
        if (filas > 0 || "Y".equals(nullable.get(0))) {
            log.info("Columna ventas.version corregida: {} filas con NULL pasaron a 0; queda DEFAULT 0 NOT NULL", filas);
        }
    }
}
