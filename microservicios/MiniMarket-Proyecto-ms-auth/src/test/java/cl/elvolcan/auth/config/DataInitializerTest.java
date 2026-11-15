package cl.elvolcan.auth.config;

import cl.elvolcan.auth.model.Rol;
import cl.elvolcan.auth.model.Usuario;
import cl.elvolcan.auth.repository.RolRepository;
import cl.elvolcan.auth.repository.UsuarioRepository;
import cl.elvolcan.auth.util.Rut;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/** Semilla de ms-auth: RUT con dígito verificador válido y corrección idempotente de las BD antiguas. */
class DataInitializerTest {

    private UsuarioRepository usuarioRepository;
    private RolRepository rolRepository;
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        usuarioRepository = mock(UsuarioRepository.class);
        rolRepository = mock(RolRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        when(usuarioRepository.findByUsername(anyString())).thenReturn(Optional.empty());
    }

    private Usuario usuario(String username, String rut) {
        Usuario u = new Usuario();
        u.setUsername(username);
        u.setRut(rut);
        return u;
    }

    @Test
    @DisplayName("Los 3 RUT de la semilla tienen dígito verificador válido (módulo 11)")
    void rutSemillaValidos() {
        assertTrue(Rut.esValido(DataInitializer.RUT_ADMIN));
        assertTrue(Rut.esValido(DataInitializer.RUT_VENDEDOR));
        assertTrue(Rut.esValido(DataInitializer.RUT_CLIENTE));
    }

    @Test
    @DisplayName("BD vacía: siembra los 3 usuarios con RUT válidos")
    void bdVaciaSiembraRutValidos() throws Exception {
        when(usuarioRepository.count()).thenReturn(0L);
        when(rolRepository.findByNombreRol(anyString())).thenReturn(Optional.of(new Rol()));
        when(passwordEncoder.encode(anyString())).thenReturn("hash");

        new DataInitializer().initDatabase(usuarioRepository, rolRepository, passwordEncoder).run();

        ArgumentCaptor<Usuario> guardados = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository, times(3)).save(guardados.capture());
        List<String> ruts = guardados.getAllValues().stream().map(Usuario::getRut).toList();
        assertEquals(List.of("190110222", "187654327", "172345670"), ruts);
        assertTrue(ruts.stream().allMatch(Rut::esValido));
    }

    @Test
    @DisplayName("BD con datos: corrige el RUT antiguo de los usuarios semilla y no vuelve a sembrar")
    void bdConDatosCorrigeRutAntiguo() throws Exception {
        Usuario admin = usuario("admin@duoc.cl", "19011022");
        when(usuarioRepository.count()).thenReturn(3L);
        when(usuarioRepository.findByUsername("admin@duoc.cl")).thenReturn(Optional.of(admin));

        new DataInitializer().initDatabase(usuarioRepository, rolRepository, passwordEncoder).run();

        assertEquals("190110222", admin.getRut());
        verify(usuarioRepository).save(admin);
        verify(usuarioRepository, never()).existsByUsername(anyString()); // no siembra de nuevo
    }

    @Test
    @DisplayName("Es idempotente: un RUT ya corregido o distinto del antiguo no se toca")
    void noTocaRutYaCorregidoODistinto() {
        Usuario vendedor = usuario("vendedor@elvolcan.cl", "187654327"); // ya corregido
        Usuario cliente = usuario("cliente@elvolcan.cl", "111111111");   // lo cambió alguien
        when(usuarioRepository.findByUsername("vendedor@elvolcan.cl")).thenReturn(Optional.of(vendedor));
        when(usuarioRepository.findByUsername("cliente@elvolcan.cl")).thenReturn(Optional.of(cliente));

        assertEquals(0, DataInitializer.corregirRutSemilla(usuarioRepository));
        assertEquals("187654327", vendedor.getRut());
        assertEquals("111111111", cliente.getRut());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("Segunda ejecución no corrige nada más")
    void segundaEjecucionNoCambiaNada() {
        Usuario cliente = usuario("cliente@elvolcan.cl", "17234567");
        when(usuarioRepository.findByUsername("cliente@elvolcan.cl")).thenReturn(Optional.of(cliente));

        assertEquals(1, DataInitializer.corregirRutSemilla(usuarioRepository));
        assertEquals(0, DataInitializer.corregirRutSemilla(usuarioRepository));
        assertEquals("172345670", cliente.getRut());
        verify(usuarioRepository, times(1)).save(cliente);
    }

    @Test
    @DisplayName("Si otro usuario ya tiene el RUT corregido, no se cambia (evita duplicados)")
    void noCorrigeSiElRutNuevoYaExiste() {
        Usuario admin = usuario("admin@duoc.cl", "19011022");
        when(usuarioRepository.findByUsername("admin@duoc.cl")).thenReturn(Optional.of(admin));
        when(usuarioRepository.existsByRut("190110222")).thenReturn(true);

        assertEquals(0, DataInitializer.corregirRutSemilla(usuarioRepository));
        assertEquals("19011022", admin.getRut());
        verify(usuarioRepository, never()).save(any());
    }
}
