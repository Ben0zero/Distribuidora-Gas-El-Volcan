package cl.elvolcan.auth.service;

import cl.elvolcan.auth.dto.UsuarioAdminRequestDTO;
import cl.elvolcan.auth.dto.UsuarioResponseDTO;
import cl.elvolcan.auth.exception.RegistroDuplicadoException;
import cl.elvolcan.auth.exception.UsuarioNoEncontradoException;
import cl.elvolcan.auth.model.Rol;
import cl.elvolcan.auth.model.Usuario;
import cl.elvolcan.auth.repository.RolRepository;
import cl.elvolcan.auth.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private RolRepository rolRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UsuarioService usuarioService;

    private static Rol rol(String nombre) {
        Rol r = new Rol();
        r.setNombreRol(nombre);
        return r;
    }

    private static UsuarioAdminRequestDTO vendedor() {
        UsuarioAdminRequestDTO dto = new UsuarioAdminRequestDTO();
        dto.setNombre("Carla Muñoz");
        dto.setRut("16543210");
        dto.setUsername("carla@elvolcan.cl");
        dto.setPassword("Vende123");
        dto.setNombreRol("vendedor"); // se acepta sin importar mayúsculas
        dto.setComuna("Chillán");
        return dto;
    }

    private static Usuario existente() {
        Usuario u = new Usuario();
        u.setId(5L);
        u.setNombre("Carla");
        u.setRut("16543210");
        u.setUsername("carla@elvolcan.cl");
        u.setPassword("hash-anterior");
        u.setRol(rol("CLIENTE"));
        return u;
    }

    @Test
    @DisplayName("crear guarda un VENDEDOR con la contraseña encriptada y responde sin contraseña")
    void crearVendedor() {
        when(usuarioRepository.existsByRut("16543210")).thenReturn(false);
        when(usuarioRepository.existsByUsername("carla@elvolcan.cl")).thenReturn(false);
        when(rolRepository.findByNombreRol("VENDEDOR")).thenReturn(Optional.of(rol("VENDEDOR")));
        when(passwordEncoder.encode("Vende123")).thenReturn("hash-bcrypt");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioResponseDTO respuesta = usuarioService.crear(vendedor());

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        assertEquals("hash-bcrypt", captor.getValue().getPassword());
        assertEquals("VENDEDOR", captor.getValue().getRol().getNombreRol());
        assertEquals("VENDEDOR", respuesta.getNombreRol());
        assertEquals("carla@elvolcan.cl", respuesta.getUsername());
        assertNull(respuesta.getToken());
    }

    @Test
    @DisplayName("crear sin contraseña lanza IllegalArgumentException (400)")
    void crearSinPassword() {
        UsuarioAdminRequestDTO dto = vendedor();
        dto.setPassword(" ");
        assertThrows(IllegalArgumentException.class, () -> usuarioService.crear(dto));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("crear con usuario duplicado lanza RegistroDuplicadoException (409)")
    void crearDuplicado() {
        when(usuarioRepository.existsByRut(anyString())).thenReturn(false);
        when(usuarioRepository.existsByUsername("carla@elvolcan.cl")).thenReturn(true);
        assertThrows(RegistroDuplicadoException.class, () -> usuarioService.crear(vendedor()));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("crear con un rol inexistente lanza IllegalArgumentException (400)")
    void crearRolInexistente() {
        UsuarioAdminRequestDTO dto = vendedor();
        dto.setNombreRol("SUPERVISOR");
        when(usuarioRepository.existsByRut(anyString())).thenReturn(false);
        when(usuarioRepository.existsByUsername(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hash");
        when(rolRepository.findByNombreRol("SUPERVISOR")).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> usuarioService.crear(dto));
    }

    @Test
    @DisplayName("actualizar cambia el rol y conserva la contraseña si viene vacía")
    void actualizarSinCambiarPassword() {
        Usuario usuario = existente();
        UsuarioAdminRequestDTO dto = vendedor();
        dto.setPassword(null);
        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(usuario));
        when(rolRepository.findByNombreRol("VENDEDOR")).thenReturn(Optional.of(rol("VENDEDOR")));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioResponseDTO respuesta = usuarioService.actualizar(5L, dto);

        assertEquals("VENDEDOR", respuesta.getNombreRol());
        assertEquals("Carla Muñoz", respuesta.getNombre());
        assertEquals("hash-anterior", usuario.getPassword());
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("actualizar a un usuario que ya usa otra persona lanza 409")
    void actualizarAUsernameAjeno() {
        UsuarioAdminRequestDTO dto = vendedor();
        dto.setUsername("admin@duoc.cl");
        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(existente()));
        when(usuarioRepository.existsByUsername("admin@duoc.cl")).thenReturn(true);
        assertThrows(RegistroDuplicadoException.class, () -> usuarioService.actualizar(5L, dto));
    }

    @Test
    @DisplayName("actualizar o eliminar un usuario inexistente lanza UsuarioNoEncontradoException (404)")
    void usuarioInexistente() {
        when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());
        when(usuarioRepository.existsById(99L)).thenReturn(false);
        assertThrows(UsuarioNoEncontradoException.class, () -> usuarioService.actualizar(99L, vendedor()));
        assertThrows(UsuarioNoEncontradoException.class, () -> usuarioService.eliminar(99L));
        verify(usuarioRepository, never()).deleteById(any());
    }
}
