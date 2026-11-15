package cl.elvolcan.auth.service;

import cl.elvolcan.auth.model.TokenRecuperacion;
import cl.elvolcan.auth.model.Usuario;
import cl.elvolcan.auth.repository.TokenRecuperacionRepository;
import cl.elvolcan.auth.repository.UsuarioRepository;
import cl.elvolcan.auth.service.notificacion.NotificacionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecuperacionServiceTest {

    // Hora fija: así se prueban el vencimiento y el límite sin esperar
    private static final ZoneId ZONA = ZoneId.of("America/Santiago");
    private static final Clock RELOJ = Clock.fixed(Instant.parse("2026-11-15T15:00:00Z"), ZONA);
    private static final LocalDateTime AHORA = LocalDateTime.now(RELOJ);

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private TokenRecuperacionRepository tokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private NotificacionService notificacionService;

    private RecuperacionService servicio;

    @BeforeEach
    void setUp() {
        servicio = new RecuperacionService(usuarioRepository, tokenRepository, passwordEncoder, notificacionService,
                "http://localhost:5173/", RELOJ);
    }

    private Usuario cliente() {
        Usuario u = new Usuario();
        u.setId(3L);
        u.setUsername("cliente@elvolcan.cl");
        u.setPassword("hash-anterior");
        return u;
    }

    private TokenRecuperacion registro(LocalDateTime expira, LocalDateTime usado) {
        TokenRecuperacion t = new TokenRecuperacion();
        t.setUsuarioId(3L);
        t.setCreadoEn(expira.minus(RecuperacionService.VIGENCIA));
        t.setExpiraEn(expira);
        t.setUsadoEn(usado);
        return t;
    }

    // --- solicitar ---

    @Test
    @DisplayName("cuenta existente: guarda solo el SHA-256 del token (vence en 15 min) y envía el enlace por NotificacionService")
    void solicitarCuentaExistente() {
        when(usuarioRepository.findByUsername("cliente@elvolcan.cl")).thenReturn(Optional.of(cliente()));
        when(tokenRepository.countByUsuarioIdAndCreadoEnAfter(eq(3L), any())).thenReturn(0L);
        TokenRecuperacion anterior = registro(AHORA.plusMinutes(5), null);
        when(tokenRepository.findByUsuarioIdAndUsadoEnIsNull(3L)).thenReturn(List.of(anterior));

        servicio.solicitar("  Cliente@ElVolcan.cl ");

        ArgumentCaptor<String> enlace = ArgumentCaptor.forClass(String.class);
        verify(notificacionService).enviarEnlaceRecuperacion(eq("cliente@elvolcan.cl"), enlace.capture());
        assertTrue(enlace.getValue().startsWith("http://localhost:5173/restablecer?token="));
        String token = enlace.getValue().substring(enlace.getValue().indexOf("token=") + 6);
        assertTrue(token.length() >= 43, "32 bytes en Base64 URL son al menos 43 caracteres");

        ArgumentCaptor<TokenRecuperacion> guardados = ArgumentCaptor.forClass(TokenRecuperacion.class);
        verify(tokenRepository, times(2)).save(guardados.capture());
        TokenRecuperacion nuevo = guardados.getAllValues().get(1);
        assertEquals(RecuperacionService.sha256(token), nuevo.getTokenHash()); // solo el hash
        assertNotEquals(token, nuevo.getTokenHash());
        assertEquals(64, nuevo.getTokenHash().length());
        assertEquals(AHORA.plusMinutes(15), nuevo.getExpiraEn());
        assertNull(nuevo.getUsadoEn());
        // el enlace anterior quedó invalidado
        assertEquals(AHORA, anterior.getUsadoEn());
    }

    @Test
    @DisplayName("cuenta inexistente: no guarda ni envía nada y no lanza error (misma respuesta en el controlador)")
    void solicitarCuentaInexistente() {
        when(usuarioRepository.findByUsername("nadie@elvolcan.cl")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> servicio.solicitar("nadie@elvolcan.cl"));

        verifyNoInteractions(tokenRepository, notificacionService);
    }

    @Test
    @DisplayName("límite: con 3 solicitudes en los últimos 15 minutos no se crea otro enlace")
    void solicitarSobreElLimite() {
        when(usuarioRepository.findByUsername("cliente@elvolcan.cl")).thenReturn(Optional.of(cliente()));
        when(tokenRepository.countByUsuarioIdAndCreadoEnAfter(3L, AHORA.minusMinutes(15))).thenReturn(3L);

        servicio.solicitar("cliente@elvolcan.cl");

        verify(tokenRepository, never()).save(any());
        verifyNoInteractions(notificacionService);
    }

    @Test
    @DisplayName("cada solicitud genera un token distinto")
    void tokensDistintos() {
        when(usuarioRepository.findByUsername("cliente@elvolcan.cl")).thenReturn(Optional.of(cliente()));
        when(tokenRepository.countByUsuarioIdAndCreadoEnAfter(eq(3L), any())).thenReturn(0L);
        when(tokenRepository.findByUsuarioIdAndUsadoEnIsNull(3L)).thenReturn(List.of());

        servicio.solicitar("cliente@elvolcan.cl");
        servicio.solicitar("cliente@elvolcan.cl");

        ArgumentCaptor<String> enlaces = ArgumentCaptor.forClass(String.class);
        verify(notificacionService, times(2)).enviarEnlaceRecuperacion(anyString(), enlaces.capture());
        assertNotEquals(enlaces.getAllValues().get(0), enlaces.getAllValues().get(1));
    }

    // --- restablecer ---

    @Test
    @DisplayName("token válido: guarda la nueva contraseña con BCrypt y marca el token como usado")
    void restablecerConTokenValido() {
        TokenRecuperacion vigente = registro(AHORA.plusMinutes(10), null);
        Usuario usuario = cliente();
        when(tokenRepository.findByTokenHash(RecuperacionService.sha256("token-valido"))).thenReturn(Optional.of(vigente));
        when(usuarioRepository.findById(3L)).thenReturn(Optional.of(usuario));
        when(passwordEncoder.encode("NuevaClave2026")).thenReturn("hash-nuevo");

        servicio.restablecer("token-valido", "NuevaClave2026");

        assertEquals("hash-nuevo", usuario.getPassword());
        verify(usuarioRepository).save(usuario);
        assertEquals(AHORA, vigente.getUsadoEn());
        verify(tokenRepository).save(vigente);
    }

    @Test
    @DisplayName("token vencido: 400 con el mensaje genérico y no cambia la contraseña")
    void restablecerConTokenVencido() {
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(registro(AHORA.minusMinutes(1), null)));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> servicio.restablecer("token-vencido", "NuevaClave2026"));

        assertEquals(RecuperacionService.ENLACE_INVALIDO, ex.getMessage());
        verifyNoInteractions(passwordEncoder);
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("token ya usado: 400 y no se puede reutilizar")
    void restablecerConTokenUsado() {
        when(tokenRepository.findByTokenHash(anyString()))
                .thenReturn(Optional.of(registro(AHORA.plusMinutes(10), AHORA.minusMinutes(2))));

        assertThrows(IllegalArgumentException.class, () -> servicio.restablecer("token-usado", "NuevaClave2026"));
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    @DisplayName("token inexistente: 400 con el mismo mensaje")
    void restablecerConTokenInexistente() {
        when(tokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> servicio.restablecer("no-existe", "NuevaClave2026"));
        assertEquals(RecuperacionService.ENLACE_INVALIDO, ex.getMessage());
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    @DisplayName("sha256 produce 64 caracteres hexadecimales y es estable")
    void sha256() {
        assertEquals("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824", RecuperacionService.sha256("hello"));
    }
}
