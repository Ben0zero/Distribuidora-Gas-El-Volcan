package cl.elvolcan.auth.service.notificacion;

import cl.elvolcan.auth.config.AsyncConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** El correo de recuperación se envía en segundo plano con el executor acotado de AsyncConfig. */
class NotificacionCorreoAsyncTest {

    private static final String ENLACE = "http://localhost:5173/restablecer?token=abc123";

    private ApplicationContextRunner contexto(JavaMailSender mailSender) {
        return new ApplicationContextRunner()
                .withPropertyValues("app.notificacion.modo=correo")
                .withBean(JavaMailSender.class, () -> mailSender)
                .withUserConfiguration(AsyncConfig.class, NotificacionCorreoService.class);
    }

    @Test
    @DisplayName("La llamada vuelve de inmediato aunque el SMTP tarde; el correo sale en otro hilo")
    void noEsperaAlServidorDeCorreo() throws Exception {
        CountDownLatch smtpLibre = new CountDownLatch(1);
        CountDownLatch enviado = new CountDownLatch(1);
        AtomicReference<String> hiloDelEnvio = new AtomicReference<>();
        JavaMailSender mailSender = mock(JavaMailSender.class);
        doAnswer(inv -> {
            hiloDelEnvio.set(Thread.currentThread().getName());
            smtpLibre.await(5, TimeUnit.SECONDS); // simula un SMTP lento
            enviado.countDown();
            return null;
        }).when(mailSender).send(any(SimpleMailMessage.class));

        contexto(mailSender).run(ctx -> {
            NotificacionService servicio = ctx.getBean(NotificacionService.class);

            long inicio = System.nanoTime();
            servicio.enviarEnlaceRecuperacion("cliente@elvolcan.cl", ENLACE);
            long ms = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - inicio);

            assertTrue(ms < 1000, "la llamada no debe esperar al SMTP (tardó " + ms + " ms)");
            assertEquals(1, enviado.getCount(), "el envío sigue en curso en segundo plano");

            smtpLibre.countDown();
            assertTrue(enviado.await(5, TimeUnit.SECONDS));
            assertThat(hiloDelEnvio.get()).startsWith("correo-");
        });
    }

    @Test
    @DisplayName("Un fallo del SMTP dentro del hilo no se propaga a quien pidió el enlace")
    void falloEnSegundoPlanNoSePropaga() throws Exception {
        CountDownLatch intentado = new CountDownLatch(1);
        JavaMailSender mailSender = mock(JavaMailSender.class);
        doAnswer(inv -> {
            intentado.countDown();
            throw new MailSendException("SMTP no disponible");
        }).when(mailSender).send(any(SimpleMailMessage.class));

        contexto(mailSender).run(ctx -> {
            NotificacionService servicio = ctx.getBean(NotificacionService.class);
            assertDoesNotThrow(() -> servicio.enviarEnlaceRecuperacion("cliente@elvolcan.cl", ENLACE));
            assertTrue(intentado.await(5, TimeUnit.SECONDS));
        });
    }

    @Test
    @DisplayName("El executor de correos está acotado: 1 a 2 hilos y cola de 50")
    void executorAcotado() {
        contexto(mock(JavaMailSender.class)).run(ctx -> {
            ThreadPoolTaskExecutor executor = ctx.getBean(AsyncConfig.EXECUTOR_CORREO, ThreadPoolTaskExecutor.class);
            assertEquals(1, executor.getCorePoolSize());
            assertEquals(2, executor.getMaxPoolSize());
            assertEquals(50, executor.getQueueCapacity());
        });
    }

    @Test
    @DisplayName("En modo log no hay correo: el envío sigue siendo síncrono y sin SMTP")
    void modoLogSinCorreo() {
        new ApplicationContextRunner()
                .withUserConfiguration(AsyncConfig.class, NotificacionLogService.class, NotificacionCorreoService.class)
                .run(ctx -> {
                    assertThat(ctx.getBean(NotificacionService.class)).isInstanceOf(NotificacionLogService.class);
                    assertThat(ctx).doesNotHaveBean(NotificacionCorreoService.class);
                });
    }
}
