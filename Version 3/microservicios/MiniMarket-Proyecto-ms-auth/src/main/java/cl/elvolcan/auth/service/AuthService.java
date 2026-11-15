package cl.elvolcan.auth.service;


import cl.elvolcan.auth.util.Rut;
import org.springframework.security.authentication.BadCredentialsException;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import cl.elvolcan.auth.dto.LoginRequestDTO;
import cl.elvolcan.auth.dto.RegistroRequestDTO;
import cl.elvolcan.auth.dto.UsuarioResponseDTO;
import cl.elvolcan.auth.exception.RegistroDuplicadoException;
import cl.elvolcan.auth.model.Rol;
import cl.elvolcan.auth.model.Usuario;
import cl.elvolcan.auth.repository.RolRepository;
import cl.elvolcan.auth.repository.UsuarioRepository;
import cl.elvolcan.auth.security.LimiteIntentosLogin;
import cl.elvolcan.auth.security.jwt.JwtUtil;

@Service
public class AuthService {

    // Rol que recibe todo usuario creado desde el registro publico (/api/v1/auth/register)
    public static final String ROL_REGISTRO_PUBLICO = "CLIENTE";
    

    
    private final UsuarioRepository usuarioRepository;                //traer al repo, en vez de final se puede usar un @AutoWired y se elimina el constructor
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final LimiteIntentosLogin limiteIntentos;


    public AuthService(UsuarioRepository usuarioRepository, RolRepository rolRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
                       LimiteIntentosLogin limiteIntentos){          //inyeccion de dependencias
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.limiteIntentos = limiteIntentos;
    }

    // METODO DE LOGIN (ip = IP del cliente, para el límite de intentos fallidos)
    public UsuarioResponseDTO login(LoginRequestDTO request, String ip){

        // H-07: si el usuario + IP o la IP están bloqueados, 429 antes de consultar la BD
        // (aunque esta vez la contraseña sea correcta)
        limiteIntentos.verificar(request.getUsername(), ip);

        //buscar si existe el username
        Optional<Usuario> usuarioOpt = usuarioRepository.findByUsername(request.getUsername());
        if (usuarioOpt.isEmpty()) {
            // un usuario inexistente cuenta igual que una contraseña mala (no se revela si existe)
            limiteIntentos.registrarFallo(request.getUsername(), ip);
            throw new BadCredentialsException("Error: Usuario o contraseña incorrectos");
            // tiene que ser usuario o contra incorrectos, nunca dar informacion de más, siempre generico
        }

        Usuario usuario = usuarioOpt.get();

        //comparacion de contraseñas
        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            limiteIntentos.registrarFallo(request.getUsername(), ip);
            throw new BadCredentialsException("Error: Usuario o contraseña incorrectos");
        }

        // login correcto: se reinicia el contador de este usuario + IP
        limiteIntentos.registrarExito(request.getUsername(), ip);

        //se genera el token (incluye el tipo de cliente para que ms-ventas no confíe en el body)
        String tokenGenerado = jwtUtil.generateToken(usuario.getUsername(), usuario.getRol().getNombreRol(),
                usuario.getTipoCliente());

        //si todo pasa y esta bien, se retorna
        UsuarioResponseDTO response = new UsuarioResponseDTO();
        response.setId(usuario.getId());
        response.setNombre(usuario.getNombre());
        response.setRut(usuario.getRut());
        response.setUsername(usuario.getUsername());
        response.setNombreRol(usuario.getRol().getNombreRol());
        response.setDireccion(usuario.getDireccion());
        response.setRegion(usuario.getRegion());
        response.setComuna(usuario.getComuna());
        response.setTipoCliente(usuario.getTipoCliente());
        response.setTelefono(usuario.getTelefono());
        response.setToken(tokenGenerado);

        return response;
    }

    // METODO DE REGISTRO
    public UsuarioResponseDTO registrar(RegistroRequestDTO request){

        // Al CREAR se exige un RUT válido (módulo 11) y se guarda normalizado (sin puntos ni guion).
        // Al editar no se revisa el dígito verificador: hay usuarios antiguos con un DV inválido.
        String rut = Rut.normalizar(request.getRut());
        if (!Rut.esValido(rut)) {
            throw new IllegalArgumentException("El RUT no es válido: revisa el dígito verificador");
        }

        // duplicados -> 409 Conflict (antes caían en el handler genérico como 401)
        if (usuarioRepository.existsByRut(rut)) {
            throw new RegistroDuplicadoException("Error: Ya existe un usuario registrado con este RUT");
        }

        if (usuarioRepository.existsByUsername(request.getUsername())) {
            throw new RegistroDuplicadoException("Error: El nombre de usuario ya está en uso");
        }

        // el registro publico SIEMPRE asigna el rol CLIENTE (nunca se toma el rol desde el body)
        Rol rolAsignado = rolRepository.findByNombreRol(ROL_REGISTRO_PUBLICO)
            .orElseThrow(() -> new RuntimeException("Error: El rol " + ROL_REGISTRO_PUBLICO + " no existe"));

        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setNombre(request.getNombre());
        nuevoUsuario.setRut(rut);
        nuevoUsuario.setUsername(request.getUsername());

        //aca se encripta la clave antes de guardarla en bd
        nuevoUsuario.setPassword(passwordEncoder.encode(request.getPassword())); 
        nuevoUsuario.setRol(rolAsignado);

        // datos adicionales del formulario de registro de El Volcan
        nuevoUsuario.setDireccion(request.getDireccion());
        nuevoUsuario.setRegion(request.getRegion());
        nuevoUsuario.setComuna(request.getComuna());
        nuevoUsuario.setTipoCliente(request.getTipoCliente());
        nuevoUsuario.setTelefono(request.getTelefono());

        Usuario usuarioGuardado = usuarioRepository.save(nuevoUsuario);

        //aca se registra el token va nulo, debe logearse para obtenerlo
        UsuarioResponseDTO response = new UsuarioResponseDTO();
        response.setId(usuarioGuardado.getId());
        response.setNombre(usuarioGuardado.getNombre());
        response.setRut(usuarioGuardado.getRut());
        response.setUsername(usuarioGuardado.getUsername());
        response.setNombreRol(usuarioGuardado.getRol().getNombreRol());
        response.setDireccion(usuarioGuardado.getDireccion());
        response.setRegion(usuarioGuardado.getRegion());
        response.setComuna(usuarioGuardado.getComuna());
        response.setTipoCliente(usuarioGuardado.getTipoCliente());
        response.setTelefono(usuarioGuardado.getTelefono());
        
        return response;
    }

}
