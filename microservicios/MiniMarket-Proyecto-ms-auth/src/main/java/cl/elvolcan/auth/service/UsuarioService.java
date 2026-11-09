package cl.elvolcan.auth.service;

import cl.elvolcan.auth.dto.UsuarioAdminRequestDTO;
import cl.elvolcan.auth.dto.UsuarioResponseDTO;
import cl.elvolcan.auth.exception.RegistroDuplicadoException;
import cl.elvolcan.auth.exception.UsuarioNoEncontradoException;
import cl.elvolcan.auth.model.Rol;
import cl.elvolcan.auth.model.Usuario;
import cl.elvolcan.auth.repository.RolRepository;
import cl.elvolcan.auth.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

/**
 * CRUD de usuarios para el ADMIN (V1 y V2 usan este servicio).
 * Responde siempre con UsuarioResponseDTO: nunca expone la entidad ni la contraseña.
 */
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, RolRepository rolRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UsuarioResponseDTO> listar() {
        return usuarioRepository.findAll().stream().map(UsuarioService::aRespuesta).toList();
    }

    public UsuarioResponseDTO obtener(Long id) {
        return aRespuesta(buscar(id));
    }

    public UsuarioResponseDTO crear(UsuarioAdminRequestDTO request) {
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("La contraseña es obligatoria al crear un usuario");
        }
        if (usuarioRepository.existsByRut(request.getRut())) {
            throw new RegistroDuplicadoException("Error: Ya existe un usuario registrado con este RUT");
        }
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            throw new RegistroDuplicadoException("Error: El nombre de usuario ya está en uso");
        }

        Usuario usuario = new Usuario();
        usuario.setRut(request.getRut());
        usuario.setUsername(request.getUsername());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        copiarDatos(request, usuario);
        return aRespuesta(usuarioRepository.save(usuario));
    }

    public UsuarioResponseDTO actualizar(Long id, UsuarioAdminRequestDTO request) {
        Usuario usuario = buscar(id);

        // RUT y usuario pueden cambiar, pero no a uno que ya use otra persona
        if (!usuario.getRut().equals(request.getRut()) && usuarioRepository.existsByRut(request.getRut())) {
            throw new RegistroDuplicadoException("Error: Ya existe un usuario registrado con este RUT");
        }
        if (!usuario.getUsername().equals(request.getUsername()) && usuarioRepository.existsByUsername(request.getUsername())) {
            throw new RegistroDuplicadoException("Error: El nombre de usuario ya está en uso");
        }

        usuario.setRut(request.getRut());
        usuario.setUsername(request.getUsername());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        copiarDatos(request, usuario);
        return aRespuesta(usuarioRepository.save(usuario));
    }

    public void eliminar(Long id) {
        if (!usuarioRepository.existsById(id)) {
            throw new UsuarioNoEncontradoException(id);
        }
        usuarioRepository.deleteById(id);
    }

    private Usuario buscar(Long id) {
        return usuarioRepository.findById(id).orElseThrow(() -> new UsuarioNoEncontradoException(id));
    }

    private void copiarDatos(UsuarioAdminRequestDTO request, Usuario usuario) {
        usuario.setNombre(request.getNombre());
        usuario.setRol(buscarRol(request.getNombreRol()));
        usuario.setDireccion(request.getDireccion());
        usuario.setRegion(request.getRegion());
        usuario.setComuna(request.getComuna());
        usuario.setTipoCliente(request.getTipoCliente());
        usuario.setTelefono(request.getTelefono());
    }

    private Rol buscarRol(String nombreRol) {
        String nombre = nombreRol == null ? "" : nombreRol.trim().toUpperCase(Locale.ROOT);
        return rolRepository.findByNombreRol(nombre)
                .orElseThrow(() -> new IllegalArgumentException("El rol " + nombreRol + " no existe"));
    }

    static UsuarioResponseDTO aRespuesta(Usuario u) {
        UsuarioResponseDTO dto = new UsuarioResponseDTO();
        dto.setId(u.getId());
        dto.setNombre(u.getNombre());
        dto.setRut(u.getRut());
        dto.setUsername(u.getUsername());
        dto.setNombreRol(u.getRol() != null ? u.getRol().getNombreRol() : null);
        dto.setDireccion(u.getDireccion());
        dto.setRegion(u.getRegion());
        dto.setComuna(u.getComuna());
        dto.setTipoCliente(u.getTipoCliente());
        dto.setTelefono(u.getTelefono());
        return dto;
    }
}
