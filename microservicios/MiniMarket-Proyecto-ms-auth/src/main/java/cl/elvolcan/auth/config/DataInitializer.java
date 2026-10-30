package cl.elvolcan.auth.config;

import cl.elvolcan.auth.model.Rol;
import cl.elvolcan.auth.model.Usuario;
import cl.elvolcan.auth.repository.RolRepository;
import cl.elvolcan.auth.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UsuarioRepository usuarioRepository, RolRepository rolRepository, PasswordEncoder passwordEncoder) {
        return args -> {

            if (usuarioRepository.count() > 0) {
                System.out.println("Base de datos de usuarios ya tiene datos, omitiendo inicializacion.");
                return;
            }

            System.out.println("Base de datos vacia. Cargando usuarios y roles de El Volcan...");

            // Roles del negocio para Distribuidora de Gas El Volcan
            Rol rolAdmin = crearRolSiNoExiste(rolRepository, "ADMIN");
            Rol rolVendedor = crearRolSiNoExiste(rolRepository, "VENDEDOR");
            Rol rolCliente = crearRolSiNoExiste(rolRepository, "CLIENTE");

            // Usuario administrador (igual al que espera el frontend)
            crearUsuario(usuarioRepository, passwordEncoder, "admin@duoc.cl", "Admin123", rolAdmin,
                    "Juan Perez", "19011022", null, null, null, null, null);

            // Vendedor de ejemplo
            crearUsuario(usuarioRepository, passwordEncoder, "vendedor@elvolcan.cl", "Vendedor123", rolVendedor,
                    "Maria Soto", "18765432", "Av. Argentina 455", "Region de Ñuble", "Chillán", "Comercial", "+56922334455");

            // Cliente de ejemplo
            crearUsuario(usuarioRepository, passwordEncoder, "cliente@elvolcan.cl", "Cliente123", rolCliente,
                    "Pedro Rojas", "17234567", "Calle Nueva 789", "Region de Ñuble", "Chillán", "Residencial", "+56911223344");

            System.out.println("Los 3 usuarios y 3 roles de El Volcan fueron cargados con exito.");
        };
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
