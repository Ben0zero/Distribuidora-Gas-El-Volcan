package cl.elvolcan.auth.service.notificacion;

/**
 * Envío de avisos al usuario. Hoy la implementación de desarrollo escribe en el log
 * (NotificacionLogService); para producción se agrega una implementación con correo real
 * (spring-boot-starter-mail) sin cambiar RecuperacionService.
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
