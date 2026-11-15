package cl.elvolcan.auth.service.notificacion;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Implementación de DESARROLLO: escribe el enlace de recuperación SOLO en el log de ms-auth.
 * Nunca se devuelve en la respuesta de la API. Es el modo por defecto (app.notificacion.modo=log);
 * con app.notificacion.modo=correo se usa NotificacionCorreoService.
 */
@Service
@ConditionalOnProperty(name = "app.notificacion.modo", havingValue = "log", matchIfMissing = true)
public class NotificacionLogService implements NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionLogService.class);

    @Override
    public void enviarEnlaceRecuperacion(String destinatario, String enlace) {
        log.info("[DESARROLLO] Enlace para restablecer la contraseña de {} (vence en 15 minutos): {}", destinatario, enlace);
    }
}
