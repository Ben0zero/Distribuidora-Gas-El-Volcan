package cl.elvolcan.auth.config;

import cl.elvolcan.auth.model.Rol;
import cl.elvolcan.auth.model.Usuario;
import cl.elvolcan.auth.repository.RolRepository;
import cl.elvolcan.auth.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    // RUT de la semilla, normalizados (cuerpo + dígito verificador módulo 11, sin puntos ni guion)
    static final String RUT_ADMIN = "190110222";     // 19.011.022-2
    static final String RUT_VENDEDOR = "187654327";  // 18.765.432-7
    static final String RUT_CLIENTE = "172345670";   // 17.234.567-0

    // Usuario semilla -> { RUT antiguo sin dígito verificador válido, RUT corregido }
    static final Map<String, String[]> CORRECCION_RUT = Map.of(
            "admin@duoc.cl", new String[]{"19011022", RUT_ADMIN},
            "vendedor@elvolcan.cl", new String[]{"18765432", RUT_VENDEDOR},
            "cliente@elvolcan.cl", new String[]{"17234567", RUT_CLIENTE});

    @Bean
    CommandLineRunner initDatabase(UsuarioRepository usuarioRepository, RolRepository rolRepository, PasswordEncoder passwordEncoder) {
        return args -> {

            if (usuarioRepository.count() > 0) {
                // La semilla ya existe: solo se corrige el RUT antiguo de los 3 usuarios (idempotente)
                corregirRutSemilla(usuarioRepository);
                log.info("Base de datos de usuarios ya tiene datos, omitiendo inicializacion.");
                return;
            }

            log.info("Base de datos vacia. Cargando usuarios y roles de El Volcan...");

            // Roles del negocio para Distribuidora de Gas El Volcan
            Rol rolAdmin = crearRolSiNoExiste(rolRepository, "ADMIN");
            Rol rolVendedor = crearRolSiNoExiste(rolRepository, "VENDEDOR");
            Rol rolCliente = crearRolSiNoExiste(rolRepository, "CLIENTE");

            // Usuario administrador (igual al que espera el frontend)
            crearUsuario(usuarioRepository, passwordEncoder, "admin@duoc.cl", "Admin123", rolAdmin,
                    "Juan Perez", RUT_ADMIN, null, null, null, null, null);

            // Vendedor de ejemplo
            crearUsuario(usuarioRepository, passwordEncoder, "vendedor@elvolcan.cl", "Vendedor123", rolVendedor,
                    "Maria Soto", RUT_VENDEDOR, "Av. Argentina 455", "Region de Ñuble", "Chillán", "Comercial", "+56922334455");

            // Cliente de ejemplo
            crearUsuario(usuarioRepository, passwordEncoder, "cliente@elvolcan.cl", "Cliente123", rolCliente,
                    "Pedro Rojas", RUT_CLIENTE, "Calle Nueva 789", "Region de Ñuble", "Chillán", "Residencial", "+56911223344");

            log.info("Los 3 usuarios y 3 roles de El Volcan fueron cargados con exito.");
        };
    }

    /**
     * Las BD sembradas antes de validar el RUT guardaron los 3 usuarios semilla con un dígito
     * verificador inválido. Se actualiza el RUT SOLO si todavía tiene el valor antiguo: si ya se
     * corrigió o alguien lo cambió, no se toca. Devuelve cuántos usuarios se corrigieron.
     */
    static int corregirRutSemilla(UsuarioRepository repo) {
        int corregidos = 0;
        for (Map.Entry<String, String[]> e : CORRECCION_RUT.entrySet()) {
            String antiguo = e.getValue()[0];
            String nuevo = e.getValue()[1];
            Usuario usuario = repo.findByUsername(e.getKey()).orElse(null);
            if (usuario == null || !antiguo.equals(usuario.getRut())) {
                continue;
            }
            if (repo.existsByRut(nuevo)) {
                log.warn("No se corrige el RUT de {}: otro usuario ya tiene el RUT corregido", e.getKey());
                continue;
            }
            usuario.setRut(nuevo);
            repo.save(usuario);
            corregidos++;
            log.info("RUT del usuario semilla {} corregido (digito verificador valido)", e.getKey());
        }
        return corregidos;
    }

    private Rol crearRolSiNoExiste(RolRepository repository, String nombreRol) {
        return repository.findByNombreRol(nombreRol).orElseGet(() -> {
            Rol nuevoRol = new Rol();
            nuevoRol.setNombreRol(nombreRol);
            return repository.save(nuevoRol);
        });
    }

    private void crearUsuario(UsuarioRepository repo, PasswordEncoder encoder, String username, String password, Rol rol,
                              String nombre, String rut, String direccion, String region, String comuna,
                              String tipoCliente, String telefono) {
        if (repo.existsByUsername(username)) {
            return;
        }
        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setPassword(encoder.encode(password));
        usuario.setRol(rol);
        usuario.setNombre(nombre);
        usuario.setRut(rut);
        usuario.setDireccion(direccion);
        usuario.setRegion(region);
        usuario.setComuna(comuna);
        usuario.setTipoCliente(tipoCliente);
        usuario.setTelefono(telefono);
        repo.save(usuario);
    }
}
