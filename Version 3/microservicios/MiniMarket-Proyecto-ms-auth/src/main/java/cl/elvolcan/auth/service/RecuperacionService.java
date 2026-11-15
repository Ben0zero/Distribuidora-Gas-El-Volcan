package cl.elvolcan.auth.service;

import cl.elvolcan.auth.model.TokenRecuperacion;
import cl.elvolcan.auth.model.Usuario;
import cl.elvolcan.auth.repository.TokenRecuperacionRepository;
import cl.elvolcan.auth.repository.UsuarioRepository;
import cl.elvolcan.auth.service.notificacion.NotificacionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;

/**
 * Recuperación de contraseña con enlace de un solo uso.
 * - solicitar(): responde igual exista o no la cuenta (el controlador siempre devuelve 200 con el
 *   mismo mensaje). Si existe, invalida los enlaces anteriores, crea un token aleatorio de 32 bytes,
 *   guarda solo su SHA-256 (vence en 15 minutos) y envía el enlace por NotificacionService.
 * - restablecer(): valida el token (existe, no usado, no vencido), guarda la nueva contraseña con
 *   BCrypt y marca el token como usado.
 * Límite: máximo 3 solicitudes por usuario cada 15 minutos.
 */
@Service
public class RecuperacionService {

    private static final Logger log = LoggerFactory.getLogger(RecuperacionService.class);

    static final Duration VIGENCIA = Duration.ofMinutes(15);
    static final int MAX_SOLICITUDES = 3;
    static final Duration VENTANA_LIMITE = Duration.ofMinutes(15);
    static final int BYTES_TOKEN = 32;
    static final String ENLACE_INVALIDO = "El enlace no es válido o ya venció. Solicita uno nuevo.";

    private final UsuarioRepository usuarioRepository;
    private final TokenRecuperacionRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificacionService notificacionService;
    private final String urlFrontend;
    private final Clock reloj;
    private final SecureRandom aleatorio = new SecureRandom();

    @Autowired
    public RecuperacionService(UsuarioRepository usuarioRepository, TokenRecuperacionRepository tokenRepository,
                               PasswordEncoder passwordEncoder, NotificacionService notificacionService,
                               @Value("${app.frontend.url:http://localhost:5173}") String urlFrontend) {
        this(usuarioRepository, tokenRepository, passwordEncoder, notificacionService, urlFrontend, Clock.systemDefaultZone());
    }

    // Para pruebas: permite fijar la hora (vencimiento y límite de solicitudes)
    RecuperacionService(UsuarioRepository usuarioRepository, TokenRecuperacionRepository tokenRepository,
                        PasswordEncoder passwordEncoder, NotificacionService notificacionService,
                        String urlFrontend, Clock reloj) {
        this.usuarioRepository = usuarioRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificacionService = notificacionService;
        this.urlFrontend = urlFrontend.replaceAll("/+$", "");
        this.reloj = reloj;
    }

    /** Pide un enlace de recuperación. No lanza ni informa nada si la cuenta no existe (anti-enumeración). */
    @Transactional
    public void solicitar(String usuarioIngresado) {
        String username = usuarioIngresado == null ? "" : usuarioIngresado.trim().toLowerCase(Locale.ROOT);
        Optional<Usuario> encontrado = usuarioRepository.findByUsername(username);
        if (encontrado.isEmpty()) {
            log.info("Solicitud de recuperación para una cuenta inexistente (no se envía nada)");
            return;
        }
        Usuario usuario = encontrado.get();
        LocalDateTime ahora = LocalDateTime.now(reloj);

        if (tokenRepository.countByUsuarioIdAndCreadoEnAfter(usuario.getId(), ahora.minus(VENTANA_LIMITE)) >= MAX_SOLICITUDES) {
            log.warn("Límite de solicitudes de recuperación alcanzado para el usuario id={}", usuario.getId());
            return;
        }

        // Un solo enlace vigente por usuario: los anteriores dejan de servir
        for (TokenRecuperacion anterior : tokenRepository.findByUsuarioIdAndUsadoEnIsNull(usuario.getId())) {
            anterior.setUsadoEn(ahora);
            tokenRepository.save(anterior);
        }

        String token = generarToken();
        TokenRecuperacion registro = new TokenRecuperacion();
        registro.setUsuarioId(usuario.getId());
        registro.setTokenHash(sha256(token));
        registro.setCreadoEn(ahora);
        registro.setExpiraEn(ahora.plus(VIGENCIA));
        tokenRepository.save(registro);

        notificacionService.enviarEnlaceRecuperacion(usuario.getUsername(), urlFrontend + "/restablecer?token=" + token);
    }

    /** Restablece la contraseña con un token válido. Cualquier problema con el token da el mismo mensaje. */
    @Transactional
    public void restablecer(String token, String contrasenaNueva) {
        LocalDateTime ahora = LocalDateTime.now(reloj);
        TokenRecuperacion registro = tokenRepository.findByTokenHash(sha256(token == null ? "" : token.trim()))
                .filter(t -> t.getUsadoEn() == null)
                .filter(t -> t.getExpiraEn().isAfter(ahora))
                .orElseThrow(() -> new IllegalArgumentException(ENLACE_INVALIDO));
        Usuario usuario = usuarioRepository.findById(registro.getUsuarioId())
                .orElseThrow(() -> new IllegalArgumentException(ENLACE_INVALIDO));

        usuario.setPassword(passwordEncoder.encode(contrasenaNueva));
        usuarioRepository.save(usuario);
        registro.setUsadoEn(ahora);
        tokenRepository.save(registro);
        log.info("Contraseña restablecida con enlace de recuperación para el usuario id={}", usuario.getId());
    }

    // 32 bytes aleatorios de SecureRandom en Base64 URL (sin relleno): 43 caracteres aptos para un enlace
    private String generarToken() {
        byte[] bytes = new byte[BYTES_TOKEN];
        aleatorio.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    static String sha256(String valor) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(valor.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}
