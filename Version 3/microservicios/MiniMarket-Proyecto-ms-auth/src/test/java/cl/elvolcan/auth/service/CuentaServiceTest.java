package cl.elvolcan.auth.service;

import cl.elvolcan.auth.dto.CambioContrasenaRequestDTO;
import cl.elvolcan.auth.exception.UsuarioNoEncontradoException;
import cl.elvolcan.auth.model.Usuario;
import cl.elvolcan.auth.repository.UsuarioRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
class CuentaServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private CuentaService cuentaService;

    private Usuario usuario() {
        Usuario u = new Usuario();
        u.setUsername("cliente@elvolcan.cl");
        u.setPassword("hash-actual");
        return u;
    }

    private CambioContrasenaRequestDTO cambio(String actual, String nueva) {
        CambioContrasenaRequestDTO dto = new CambioContrasenaRequestDTO();
        dto.setContrasenaActual(actual);
        dto.setContrasenaNueva(nueva);
        return dto;
    }

    @Test
    @DisplayName("con la contraseña actual correcta guarda la nueva encriptada con BCrypt")
    void cambiaConContrasenaActualCorrecta() {
        Usuario u = usuario();
        when(usuarioRepository.findByUsername("cliente@elvolcan.cl")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("Cliente123", "hash-actual")).thenReturn(true);
        when(passwordEncoder.encode("NuevaClave2026")).thenReturn("hash-nuevo");

        cuentaService.cambiarContrasena("cliente@elvolcan.cl", cambio("Cliente123", "NuevaClave2026"));

        assertEquals("hash-nuevo", u.getPassword());
        verify(usuarioRepository).save(u);
    }

    @Test
    @DisplayName("con la contraseña actual incorrecta lanza 400 y no guarda")
    void rechazaContrasenaActualIncorrecta() {
        when(usuarioRepository.findByUsername("cliente@elvolcan.cl")).thenReturn(Optional.of(usuario()));
        when(passwordEncoder.matches("Mala1234", "hash-actual")).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> cuentaService.cambiarContrasena("cliente@elvolcan.cl", cambio("Mala1234", "NuevaClave2026")));

        assertEquals("La contraseña actual no es correcta", ex.getMessage());
        verify(passwordEncoder, never()).encode(anyString());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("la nueva debe ser distinta de la actual")
    void rechazaMismaContrasena() {
        when(usuarioRepository.findByUsername("cliente@elvolcan.cl")).thenReturn(Optional.of(usuario()));
        when(passwordEncoder.matches("Cliente123", "hash-actual")).thenReturn(true);

        assertThrows(IllegalArgumentException.class,
                () -> cuentaService.cambiarContrasena("cliente@elvolcan.cl", cambio("Cliente123", "Cliente123")));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    @DisplayName("si el usuario del token ya no existe lanza 404")
    void usuarioInexistente() {
        when(usuarioRepository.findByUsername("borrado@elvolcan.cl")).thenReturn(Optional.empty());

        assertThrows(UsuarioNoEncontradoException.class,
                () -> cuentaService.cambiarContrasena("borrado@elvolcan.cl", cambio("Cliente123", "NuevaClave2026")));
    }
}
