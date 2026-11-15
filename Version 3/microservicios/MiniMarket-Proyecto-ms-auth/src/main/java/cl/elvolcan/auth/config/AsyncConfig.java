package cl.elvolcan.auth.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Ejecución en segundo plano para el correo de recuperación: /api/v1/auth/recuperar responde sin
 * esperar al servidor SMTP, así que su tiempo de respuesta no delata si la cuenta existe.
 * El executor está acotado (pocos hilos y cola limitada) para que una ráfaga de solicitudes no
 * consuma recursos sin límite. Si la cola se llena, el envío se descarta y se registra en el log;
 * no se ejecuta en el hilo de la petición (eso volvería a hacer lenta la respuesta).
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    private static final Logger log = LoggerFactory.getLogger(AsyncConfig.class);

    public static final String EXECUTOR_CORREO = "correoExecutor";
    static final int HILOS_BASE = 1;
    static final int HILOS_MAXIMO = 2;
    static final int CAPACIDAD_COLA = 50;

    @Bean(name = EXECUTOR_CORREO)
    public ThreadPoolTaskExecutor correoExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(HILOS_BASE);
        executor.setMaxPoolSize(HILOS_MAXIMO);
        executor.setQueueCapacity(CAPACIDAD_COLA);
        executor.setThreadNamePrefix("correo-");
        executor.setRejectedExecutionHandler((tarea, pool) ->
                log.error("Cola de correos llena ({} pendientes): se descarta un envío de recuperación", CAPACIDAD_COLA));
        // Al apagar ms-auth espera brevemente a que salgan los correos pendientes
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);
        executor.initialize();
        return executor;
    }
}
