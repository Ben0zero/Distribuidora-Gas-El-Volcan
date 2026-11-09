package cl.elvolcan.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Datos con que un ADMIN crea o edita usuarios (POST/PUT /api/v1/usuarios).
 * A diferencia del registro público, aquí sí se elige el rol.
 * La contraseña es obligatoria al crear y opcional al editar (vacía = no se cambia).
 */
@Data
@Schema(description = "Datos para crear o editar un usuario desde el panel de administración")
public class UsuarioAdminRequestDTO {

    @Schema(description = "Nombre completo", example = "María Soto")
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
    private String nombre;

    @Schema(description = "RUT/RUN sin puntos ni guion", example = "18765432")
    @NotBlank(message = "El RUT es obligatorio")
    private String rut;

    @Schema(description = "Correo con el que inicia sesión", example = "vendedor2@elvolcan.cl")
    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 4, max = 100, message = "El usuario debe tener entre 4 y 100 caracteres")
    private String username;

    @Schema(description = "Contraseña (obligatoria al crear; al editar, vacía = no cambia)", example = "Vende123")
    @Size(min = 6, max = 72, message = "La contraseña debe tener entre 6 y 72 caracteres")
    private String password;

    @Schema(description = "Rol del usuario", example = "VENDEDOR", allowableValues = {"ADMIN", "VENDEDOR", "CLIENTE"})
    @NotBlank(message = "El rol es obligatorio")
    @Pattern(regexp = "(?i)ADMIN|VENDEDOR|CLIENTE", message = "El rol debe ser ADMIN, VENDEDOR o CLIENTE")
    private String nombreRol;

    @Schema(example = "Av. Argentina 455")
    private String direccion;

    @Schema(example = "Región de Ñuble")
    private String region;

    @Schema(example = "Chillán")
    private String comuna;

    @Schema(example = "Residencial", allowableValues = {"Residencial", "Comercial"})
    private String tipoCliente;

    @Schema(example = "+56922334455")
    private String telefono;
}
