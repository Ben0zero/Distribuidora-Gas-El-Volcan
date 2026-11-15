package cl.elvolcan.auth.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import cl.elvolcan.auth.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    
    Optional<Usuario> findByUsername(String username);

    boolean existsByRut(String rut);

    boolean existsByUsername(String username);

    // Cuántos usuarios tienen un rol (ej. "ADMIN"), para no dejar el sistema sin administradores
    long countByRol_NombreRol(String nombreRol);
}
