package cl.elvolcan.auth.service.notificacion;

/**
 * Envío de avisos al usuario. La implementación se elige con app.notificacion.modo:
 * "log" (por defecto, NotificacionLogService: escribe el enlace en el log de ms-auth) o
 * "correo" (NotificacionCorreoService: SMTP con spring-boot-starter-mail). RecuperacionService no cambia.
 */
public interface NotificacionService {

    /**
     * Envía el enlace para restablecer la contraseña.
     *
     * @param destinatario usuario (correo) que pidió la recuperación
     * @param enlace       enlace de un solo uso que contiene el token
     */
    void enviarEnlaceRecuperacion(String destinatario, String enlace);
}
