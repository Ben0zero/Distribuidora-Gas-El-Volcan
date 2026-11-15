package cl.elvolcan.auth.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Token de un solo uso para restablecer la contraseña. Solo se guarda el HASH (SHA-256) del token:
 * si alguien lee la tabla, no puede usar los enlaces. El token en claro solo viaja en el enlace.
 * usuarioId no es FK para no impedir que el admin elimine un usuario con solicitudes pendientes.
 */
@Entity
@Table(name = "tokens_recuperacion", indexes = @Index(name = "idx_token_recup_usuario", columnList = "usuario_id"))
@Data
@NoArgsConstructor
public class TokenRecuperacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    /** SHA-256 del token en hexadecimal (64 caracteres). */
    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    @Column(name = "expira_en", nullable = false)
    private LocalDateTime expiraEn;

    /** Cuándo se usó (o se invalidó por una solicitud más nueva). null = aún disponible. */
    @Column(name = "usado_en")
    private LocalDateTime usadoEn;
}
