package cl.elvolcan.auth.service.notificacion;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Implementación de DESARROLLO: escribe el enlace de recuperación SOLO en el log de ms-auth.
 * Nunca se devuelve en la respuesta de la API. Reemplazar por un envío de correo en producción.
 */
@Service
public class NotificacionLogService implements NotificacionService {

    private static final Logger log = LoggerFactory.getLogger(NotificacionLogService.class);

    @Override
    public void enviarEnlaceRecuperacion(String destinatario, String enlace) {
        log.info("[DESARROLLO] Enlace para restablecer la contraseña de {} (vence en 15 minutos): {}", destinatario, enlace);
    }
}
