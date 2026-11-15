package cl.elvolcan.auth.service.notificacion;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Correo de recuperación con un JavaMailSender simulado: nunca se envía un correo real. */
class NotificacionCorreoServiceTest {

    private static final String ENLACE = "http://localhost:5173/restablecer?token=abc123";

    @Test
    @DisplayName("Envía un correo en español con asunto, enlace, vencimiento y aviso para ignorarlo")
    void enviaCorreoConEnlace() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        NotificacionCorreoService servicio = new NotificacionCorreoService(mailSender, "elvolcan@gmail.com");

        servicio.enviarEnlaceRecuperacion("cliente@elvolcan.cl", ENLACE);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage mensaje = captor.getValue();
        assertArrayEquals(new String[]{"cliente@elvolcan.cl"}, mensaje.getTo());
        assertEquals("elvolcan@gmail.com", mensaje.getFrom());
        assertEquals("Restablece tu contraseña - Distribuidora de Gas El Volcán", mensaje.getSubject());
        assertThat(mensaje.getText())
                .contains(ENLACE)
                .contains("vence en 15 minutos")
                .contains("Si no pediste este cambio, puedes ignorar este correo");
    }

    @Test
    @DisplayName("Sin remitente configurado no fija From (el SMTP usa la cuenta autenticada)")
    void sinRemitente() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        new NotificacionCorreoService(mailSender, "").enviarEnlaceRecuperacion("cliente@elvolcan.cl", ENLACE);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        assertNull(captor.getValue().getFrom());
    }

    @Test
    @DisplayName("Si el envío falla, no lanza excepción (la respuesta al usuario no cambia)")
    void fallaDeEnvioNoSePropaga() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        doThrow(new MailSendException("SMTP no disponible")).when(mailSender).send(any(SimpleMailMessage.class));
        NotificacionCorreoService servicio = new NotificacionCorreoService(mailSender, "elvolcan@gmail.com");

        assertDoesNotThrow(() -> servicio.enviarEnlaceRecuperacion("cliente@elvolcan.cl", ENLACE));
    }

    // --- Selección de la implementación con app.notificacion.modo ---

    private final ApplicationContextRunner contexto = new ApplicationContextRunner()
            .withBean(JavaMailSender.class, () -> mock(JavaMailSender.class))
            .withUserConfiguration(NotificacionLogService.class, NotificacionCorreoService.class);

    @Test
    @DisplayName("Sin la propiedad se usa el modo log (igual que antes)")
    void porDefectoModoLog() {
        contexto.run(ctx -> {
            assertThat(ctx).hasSingleBean(NotificacionService.class);
            assertThat(ctx.getBean(NotificacionService.class)).isInstanceOf(NotificacionLogService.class);
        });
    }

    @Test
    @DisplayName("app.notificacion.modo=log usa NotificacionLogService")
    void modoLog() {
        contexto.withPropertyValues("app.notificacion.modo=log").run(ctx ->
                assertThat(ctx.getBean(NotificacionService.class)).isInstanceOf(NotificacionLogService.class));
    }

    @Test
    @DisplayName("app.notificacion.modo=correo usa NotificacionCorreoService")
    void modoCorreo() {
        contexto.withPropertyValues("app.notificacion.modo=correo").run(ctx -> {
            assertThat(ctx).hasSingleBean(NotificacionService.class);
            assertThat(ctx.getBean(NotificacionService.class)).isInstanceOf(NotificacionCorreoService.class);
        });
    }
}
