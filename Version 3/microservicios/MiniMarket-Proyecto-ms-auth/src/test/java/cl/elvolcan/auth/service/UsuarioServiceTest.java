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
        dto.setRut("16543217");
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
        u.setRut("16543217");
        u.setUsername("carla@elvolcan.cl");
        u.setPassword("hash-anterior");
        u.setRol(rol("CLIENTE"));
        return u;
    }

    @Test
    @DisplayName("crear guarda un VENDEDOR con la contraseña encriptada y responde sin contraseña")
    void crearVendedor() {
        when(usuarioRepository.existsByRut("16543217")).thenReturn(false);
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

        UsuarioResponseDTO respuesta = usuarioService.actualizar(5L, dto, "admin@duoc.cl");

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
        assertThrows(RegistroDuplicadoException.class, () -> usuarioService.actualizar(5L, dto, "admin@duoc.cl"));
    }

    @Test
    @DisplayName("actualizar o eliminar un usuario inexistente lanza UsuarioNoEncontradoException (404)")
    void usuarioInexistente() {
        when(usuarioRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(UsuarioNoEncontradoException.class, () -> usuarioService.actualizar(99L, vendedor(), "admin@duoc.cl"));
        assertThrows(UsuarioNoEncontradoException.class, () -> usuarioService.eliminar(99L, "admin@duoc.cl"));
        verify(usuarioRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("un ADMIN no puede eliminar su propia cuenta (400)")
    void noPuedeEliminarSuPropiaCuenta() {
        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(existente()));

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> usuarioService.eliminar(5L, "carla@elvolcan.cl"));

        assertEquals("No puedes eliminar tu propia cuenta", error.getMessage());
        verify(usuarioRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("un ADMIN elimina la cuenta de otro usuario")
    void eliminaAOtroUsuario() {
        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(existente()));

        usuarioService.eliminar(5L, "admin@duoc.cl");

        verify(usuarioRepository).deleteById(5L);
    }

    // --- RUT: dígito verificador solo al crear ---

    @Test
    @DisplayName("crear con un RUT de dígito verificador inválido lanza 400 y no guarda")
    void crearConRutInvalido() {
        UsuarioAdminRequestDTO dto = vendedor();
        dto.setRut("16.543.210");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> usuarioService.crear(dto));
        assertTrue(ex.getMessage().contains("dígito verificador"));
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    @DisplayName("crear guarda el RUT normalizado aunque llegue con puntos y guion")
    void crearNormalizaRut() {
        UsuarioAdminRequestDTO dto = vendedor();
        dto.setRut("16.543.217");
        when(usuarioRepository.existsByRut("16543217")).thenReturn(false);
        when(usuarioRepository.existsByUsername(anyString())).thenReturn(false);
        when(rolRepository.findByNombreRol("VENDEDOR")).thenReturn(Optional.of(rol("VENDEDOR")));
        when(passwordEncoder.encode(anyString())).thenReturn("hash");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        assertEquals("16543217", usuarioService.crear(dto).getRut());
    }

    @Test
    @DisplayName("actualizar NO exige el dígito verificador (usuarios existentes con DV antiguo)")
    void actualizarConRutAntiguoInvalido() {
        Usuario usuario = existente();
        usuario.setRut("18765432"); // DV inválido guardado antes de esta validación
        UsuarioAdminRequestDTO dto = vendedor();
        dto.setRut("18.765.432");
        dto.setPassword(null);
        when(usuarioRepository.findById(5L)).thenReturn(Optional.of(usuario));
        when(rolRepository.findByNombreRol("VENDEDOR")).thenReturn(Optional.of(rol("VENDEDOR")));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        assertEquals("18765432", usuarioService.actualizar(5L, dto, "admin@duoc.cl").getRut());
        verify(usuarioRepository, never()).existsByRut(anyString()); // mismo RUT normalizado: no hay cambio
    }

    // --- H-16: rol propio y último administrador ---

    private static Usuario admin(String username) {
        Usuario u = new Usuario();
        u.setId(1L);
        u.setNombre("Juan Perez");
        u.setRut("190110222");
        u.setUsername(username);
        u.setPassword("hash");
        u.setRol(rol("ADMIN"));
        return u;
    }

    private static UsuarioAdminRequestDTO edicion(String username, String nombreRol) {
        UsuarioAdminRequestDTO dto = new UsuarioAdminRequestDTO();
        dto.setNombre("Juan Perez");
        dto.setRut("19.011.022-2");
        dto.setUsername(username);
        dto.setNombreRol(nombreRol);
        return dto;
    }

    @Test
    @DisplayName("H-16: un ADMIN no puede cambiar su propio rol (400) y no se guarda nada")
    void adminNoCambiaSuPropioRol() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(admin("admin@duoc.cl")));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> usuarioService.actualizar(1L, edicion("admin@duoc.cl", "CLIENTE"), "ADMIN@duoc.cl"));

        assertEquals("No puedes cambiar tu propio rol de administrador", ex.getMessage());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("H-16: no se puede quitar el rol al último ADMIN (400)")
    void noSeQuitaElRolAlUltimoAdmin() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(admin("otro.admin@duoc.cl")));
        when(usuarioRepository.countByRol_NombreRol("ADMIN")).thenReturn(1L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> usuarioService.actualizar(1L, edicion("otro.admin@duoc.cl", "vendedor"), "admin@duoc.cl"));

        assertTrue(ex.getMessage().startsWith("Debe quedar al menos un administrador"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("H-16: se puede quitar el rol a otro ADMIN si quedan más administradores")
    void quitaRolAOtroAdminSiQuedanMas() {
        Usuario otro = admin("otro.admin@duoc.cl");
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(otro));
        when(usuarioRepository.countByRol_NombreRol("ADMIN")).thenReturn(2L);
        when(rolRepository.findByNombreRol("VENDEDOR")).thenReturn(Optional.of(rol("VENDEDOR")));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioResponseDTO respuesta = usuarioService.actualizar(1L, edicion("otro.admin@duoc.cl", "VENDEDOR"), "admin@duoc.cl");

        assertEquals("VENDEDOR", respuesta.getNombreRol());
    }

    @Test
    @DisplayName("H-16: un ADMIN puede editar sus otros datos si mantiene el rol ADMIN")
    void adminEditaSusDatosManteniendoRol() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(admin("admin@duoc.cl")));
        when(rolRepository.findByNombreRol("ADMIN")).thenReturn(Optional.of(rol("ADMIN")));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioResponseDTO respuesta = usuarioService.actualizar(1L, edicion("admin@duoc.cl", "admin"), "admin@duoc.cl");

        assertEquals("ADMIN", respuesta.getNombreRol());
        verify(usuarioRepository, never()).countByRol_NombreRol(anyString());
    }
}
