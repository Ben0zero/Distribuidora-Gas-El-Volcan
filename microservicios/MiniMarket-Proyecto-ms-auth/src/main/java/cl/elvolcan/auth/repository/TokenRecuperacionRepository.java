package cl.elvolcan.auth.repository;

import cl.elvolcan.auth.model.TokenRecuperacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TokenRecuperacionRepository extends JpaRepository<TokenRecuperacion, Long> {

    Optional<TokenRecuperacion> findByTokenHash(String tokenHash);

    /** Solicitudes recientes de un usuario (para el límite de 3 cada 15 minutos). */
    long countByUsuarioIdAndCreadoEnAfter(Long usuarioId, LocalDateTime desde);

    /** Tokens aún disponibles de un usuario (se invalidan al pedir uno nuevo). */
    List<TokenRecuperacion> findByUsuarioIdAndUsadoEnIsNull(Long usuarioId);
}
