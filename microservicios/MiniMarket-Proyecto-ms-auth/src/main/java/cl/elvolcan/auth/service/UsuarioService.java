package cl.elvolcan.auth.service;

import cl.elvolcan.auth.util.Rut;
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
        // Al CREAR se exige un RUT válido (módulo 11) y se guarda normalizado (sin puntos ni guion).
        // Al editar no se revisa el dígito verificador: hay usuarios antiguos con un DV inválido.
        String rut = Rut.normalizar(request.getRut());
        if (!Rut.esValido(rut)) {
            throw new IllegalArgumentException("El RUT no es válido: revisa el dígito verificador");
        }
        if (usuarioRepository.existsByRut(rut)) {
            throw new RegistroDuplicadoException("Error: Ya existe un usuario registrado con este RUT");
        }
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            throw new RegistroDuplicadoException("Error: El nombre de usuario ya está en uso");
        }

        Usuario usuario = new Usuario();
        usuario.setRut(rut);
        usuario.setUsername(request.getUsername());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        copiarDatos(request, usuario);
        return aRespuesta(usuarioRepository.save(usuario));
    }

    static final String ROL_ADMIN = "ADMIN";

    /**
     * Actualiza un usuario. H-16: un administrador no puede quitarse su propio rol, y no se puede
     * quitar el rol al último ADMIN (el sistema quedaría sin administradores). Ambos casos: 400.
     *
     * @param usernameActual usuario autenticado que ejecuta la acción
     */
    public UsuarioResponseDTO actualizar(Long id, UsuarioAdminRequestDTO request, String usernameActual) {
        Usuario usuario = buscar(id);
        verificarCambioDeRol(usuario, request.getNombreRol(), usernameActual);

        // RUT y usuario pueden cambiar, pero no a uno que ya use otra persona.
        // Al editar el RUT solo se normaliza (no se exige el dígito verificador).
        String rut = Rut.normalizar(request.getRut());
        if (!usuario.getRut().equals(rut) && usuarioRepository.existsByRut(rut)) {
            throw new RegistroDuplicadoException("Error: Ya existe un usuario registrado con este RUT");
        }
        if (!usuario.getUsername().equals(request.getUsername()) && usuarioRepository.existsByUsername(request.getUsername())) {
            throw new RegistroDuplicadoException("Error: El nombre de usuario ya está en uso");
        }

        usuario.setRut(rut);
        usuario.setUsername(request.getUsername());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        copiarDatos(request, usuario);
        return aRespuesta(usuarioRepository.save(usuario));
    }

    /**
     * Elimina un usuario. No permite que un administrador borre su propia cuenta
     * (perdería el acceso al panel) y responde 404 si el ID no existe.
     *
     * @param usernameActual usuario autenticado que ejecuta la acción
     */
    public void eliminar(Long id, String usernameActual) {
        Usuario usuario = buscar(id);
        if (usernameActual != null && usernameActual.equalsIgnoreCase(usuario.getUsername())) {
            throw new IllegalArgumentException("No puedes eliminar tu propia cuenta");
        }
        usuarioRepository.deleteById(id);
    }

    private void verificarCambioDeRol(Usuario usuario, String rolNuevo, String usernameActual) {
        boolean eraAdmin = usuario.getRol() != null && ROL_ADMIN.equals(usuario.getRol().getNombreRol());
        boolean seguiraAdmin = rolNuevo != null && ROL_ADMIN.equals(rolNuevo.trim().toUpperCase(Locale.ROOT));
        if (!eraAdmin || seguiraAdmin) {
            return;
        }
        if (usernameActual != null && usernameActual.equalsIgnoreCase(usuario.getUsername())) {
            throw new IllegalArgumentException("No puedes cambiar tu propio rol de administrador");
        }
        if (usuarioRepository.countByRol_NombreRol(ROL_ADMIN) <= 1) {
            throw new IllegalArgumentException("Debe quedar al menos un administrador: no se puede quitar el rol al último ADMIN");
        }
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
