package cl.elvolcan.auth.security;

import cl.elvolcan.auth.exception.DemasiadosIntentosException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Límite de intentos fallidos de login (H-07), en memoria.
 * - Usuario + IP: 5 fallos en 15 minutos bloquean esa combinación por 15 minutos. Se cuenta por
 *   usuario + IP (y no solo por usuario) para que un tercero no pueda bloquear la cuenta de otro,
 *   por ejemplo la del admin, desde otra IP.
 * - IP: 20 fallos en 15 minutos (con cualquier usuario) bloquean la IP por 15 minutos; frena a
 *   quien prueba muchos usuarios.
 * Los usuarios inexistentes se cuentan igual (no se revela si existen). Un login exitoso reinicia
 * el contador de ese usuario + IP. Las entradas vencidas se borran como máximo una vez por minuto,
 * y los mapas tienen un tope de tamaño para no crecer sin límite.
 * Al ser memoria local, el estado se pierde al reiniciar ms-auth y no se comparte entre instancias.
 */
@Component
public class LimiteIntentosLogin {

    private static final Logger log = LoggerFactory.getLogger(LimiteIntentosLogin.class);

    public static final String MENSAJE = "Demasiados intentos. Intenta nuevamente en unos minutos.";
    static final int MAX_FALLOS_USUARIO_IP = 5;
    static final int MAX_FALLOS_IP = 20;
    static final Duration VENTANA = Duration.ofMinutes(15);
    static final Duration BLOQUEO = Duration.ofMinutes(15);
    static final Duration INTERVALO_LIMPIEZA = Duration.ofMinutes(1);
    static final int MAX_ENTRADAS = 10_000;

    private final Map<String, Registro> porUsuarioIp = new ConcurrentHashMap<>();
    private final Map<String, Registro> porIp = new ConcurrentHashMap<>();
    private final Clock reloj;
    private volatile Instant ultimaLimpieza;

    public LimiteIntentosLogin() {
        this(Clock.systemUTC());
    }

    // Para pruebas: reloj fijo que se puede avanzar
    LimiteIntentosLogin(Clock reloj) {
        this.reloj = reloj;
        this.ultimaLimpieza = reloj.instant();
    }

    /** Lanza DemasiadosIntentosException si el usuario + IP o la IP están bloqueados. */
    public void verificar(String usuario, String ip) {
        Instant ahora = reloj.instant();
        limpiarSiCorresponde(ahora);
        if (estaBloqueado(porIp.get(ip(ip)), ahora) || estaBloqueado(porUsuarioIp.get(clave(usuario, ip)), ahora)) {
            throw new DemasiadosIntentosException(MENSAJE);
        }
    }

    /** Registra un login fallido (exista o no el usuario). Si se alcanza un umbral, bloquea y lo deja en el log. */
    public void registrarFallo(String usuario, String ip) {
        Instant ahora = reloj.instant();
        limpiarSiCorresponde(ahora);
        Registro deUsuario = registro(porUsuarioIp, clave(usuario, ip), ahora);
        if (deUsuario != null && deUsuario.registrarFallo(ahora, MAX_FALLOS_USUARIO_IP)) {
            log.warn("Login bloqueado {} min por {} intentos fallidos: usuario={} ip={}",
                    BLOQUEO.toMinutes(), MAX_FALLOS_USUARIO_IP, paraLog(usuario), paraLog(ip));
        }
        Registro deIp = registro(porIp, ip(ip), ahora);
        if (deIp != null && deIp.registrarFallo(ahora, MAX_FALLOS_IP)) {
            log.warn("IP bloqueada {} min por {} intentos fallidos de login: usuario={} ip={}",
                    BLOQUEO.toMinutes(), MAX_FALLOS_IP, paraLog(usuario), paraLog(ip));
        }
    }

    /** Login correcto: reinicia el contador de ese usuario + IP. */
    public void registrarExito(String usuario, String ip) {
        porUsuarioIp.remove(clave(usuario, ip));
    }

    // --- internos ---

    private boolean estaBloqueado(Registro registro, Instant ahora) {
        return registro != null && registro.bloqueado(ahora);
    }

    // Devuelve el registro de la clave; si el mapa llegó al tope (incluso tras limpiar), no crea uno nuevo
    private Registro registro(Map<String, Registro> mapa, String clave, Instant ahora) {
        Registro existente = mapa.get(clave);
        if (existente != null) {
            return existente;
        }
        if (mapa.size() >= MAX_ENTRADAS) {
            limpiar(ahora);
            if (mapa.size() >= MAX_ENTRADAS) {
                log.warn("Límite de intentos de login: se alcanzó el máximo de {} entradas", MAX_ENTRADAS);
                return null;
            }
        }
        return mapa.computeIfAbsent(clave, c -> new Registro());
    }

    private void limpiarSiCorresponde(Instant ahora) {
        if (!ahora.isBefore(ultimaLimpieza.plus(INTERVALO_LIMPIEZA))) {
            limpiar(ahora);
        }
    }

    void limpiar(Instant ahora) {
        ultimaLimpieza = ahora;
        porUsuarioIp.values().removeIf(r -> r.vencido(ahora));
        porIp.values().removeIf(r -> r.vencido(ahora));
    }

    int entradas() {
        return porUsuarioIp.size() + porIp.size();
    }

    private static String clave(String usuario, String ip) {
        String u = usuario == null ? "" : usuario.trim().toLowerCase(Locale.ROOT);
        if (u.length() > 100) {
            u = u.substring(0, 100);
        }
        return u + "|" + ip(ip);
    }

    private static String ip(String ip) {
        return ip == null ? "desconocida" : ip;
    }

    // Evita que un usuario con saltos de línea falsifique entradas del log
    private static String paraLog(String valor) {
        if (valor == null) {
            return "-";
        }
        String limpio = valor.replaceAll("[\\r\\n\\t]", "_");
        return limpio.length() > 100 ? limpio.substring(0, 100) : limpio;
    }

    /** Fallos dentro de la ventana y fin del bloqueo vigente (si lo hay). */
    private static final class Registro {
        private final Deque<Instant> fallos = new ArrayDeque<>();
        private Instant bloqueadoHasta;

        synchronized boolean bloqueado(Instant ahora) {
            return bloqueadoHasta != null && ahora.isBefore(bloqueadoHasta);
        }

        /** Devuelve true si este fallo provocó un bloqueo nuevo. */
        synchronized boolean registrarFallo(Instant ahora, int maximo) {
            if (bloqueado(ahora)) {
                return false;
            }
            descartarAntiguos(ahora);
            fallos.addLast(ahora);
            if (fallos.size() >= maximo) {
                bloqueadoHasta = ahora.plus(BLOQUEO);
                fallos.clear();
                return true;
            }
            return false;
        }

        synchronized boolean vencido(Instant ahora) {
            descartarAntiguos(ahora);
            return fallos.isEmpty() && !bloqueado(ahora);
        }

        private void descartarAntiguos(Instant ahora) {
            Instant limite = ahora.minus(VENTANA);
            while (!fallos.isEmpty() && !fallos.peekFirst().isAfter(limite)) {
                fallos.pollFirst();
            }
        }
    }
}
