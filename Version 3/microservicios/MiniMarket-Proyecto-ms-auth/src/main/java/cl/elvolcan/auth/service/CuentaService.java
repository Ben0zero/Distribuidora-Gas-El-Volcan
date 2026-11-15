package cl.elvolcan.auth.service;

import cl.elvolcan.auth.dto.CambioContrasenaRequestDTO;
import cl.elvolcan.auth.exception.UsuarioNoEncontradoException;
import cl.elvolcan.auth.model.Usuario;
import cl.elvolcan.auth.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/** Operaciones del propio usuario sobre su cuenta (requieren sesión iniciada). */
@Service
public class CuentaService {

    private static final Logger log = LoggerFactory.getLogger(CuentaService.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public CuentaService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Cambia la contraseña del usuario autenticado. Exige la contraseña actual: el token por sí
     * solo no basta (si alguien roba una sesión abierta, no puede cambiar la clave sin conocerla).
     */
    public void cambiarContrasena(String username, CambioContrasenaRequestDTO request) {
        Usuario usuario = usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new UsuarioNoEncontradoException("Usuario no encontrado"));

        if (!passwordEncoder.matches(request.getContrasenaActual(), usuario.getPassword())) {
            throw new IllegalArgumentException("La contraseña actual no es correcta");
        }
        if (request.getContrasenaActual().equals(request.getContrasenaNueva())) {
            throw new IllegalArgumentException("La contraseña nueva debe ser distinta de la actual");
        }

        usuario.setPassword(passwordEncoder.encode(request.getContrasenaNueva()));
        usuarioRepository.save(usuario);
        log.info("Contraseña cambiada por el usuario {}", username);
    }
}
