package cl.elvolcan.auth.service.notificacion;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Envía el enlace de recuperación por correo (SMTP). Se activa con app.notificacion.modo=correo;
 * las credenciales (spring.mail.*) se leen de ~/.elvolcan/secrets.properties.
 * Si el envío falla, solo se registra en el log: el usuario recibe la misma respuesta de siempre
 * (no se revela si la cuenta existe ni si el correo salió).
 */
@Service
@ConditionalOnProperty(name = "app.notificacion.modo", havingValue = "correo")
public class NotificacionCorreoService implements NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionCorreoService.class);

    static final String ASUNTO = "Restablece tu contraseña - Distribuidora de Gas El Volcán";

    private final JavaMailSender mailSender;
    private final String remitente;

    public NotificacionCorreoService(JavaMailSender mailSender,
                                     @Value("${app.notificacion.remitente:${spring.mail.username:}}") String remitente) {
        this.mailSender = mailSender;
        this.remitente = remitente;
    }

    @Override
    public void enviarEnlaceRecuperacion(String destinatario, String enlace) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        if (remitente != null && !remitente.isBlank()) {
            mensaje.setFrom(remitente);
        }
        mensaje.setTo(destinatario);
        mensaje.setSubject(ASUNTO);
        mensaje.setText(cuerpo(enlace));
        try {
            mailSender.send(mensaje);
            log.info("Correo de recuperación enviado a {}", destinatario);
        } catch (MailException e) {
            // Sin el enlace ni el token en el log; el detalle técnico basta para diagnosticar el SMTP
            log.error("No se pudo enviar el correo de recuperación a {}: {}", destinatario, e.getMessage());
        }
    }

    static String cuerpo(String enlace) {
        return """
                Hola:

                Recibimos una solicitud para restablecer la contraseña de tu cuenta en Distribuidora de Gas El Volcán.

                Para crear una nueva contraseña, abre este enlace:
                %s

                El enlace vence en 15 minutos y solo se puede usar una vez.

                Si no pediste este cambio, puedes ignorar este correo: tu contraseña actual sigue siendo válida.

                Distribuidora de Gas El Volcán
                """.formatted(enlace);
    }
}
