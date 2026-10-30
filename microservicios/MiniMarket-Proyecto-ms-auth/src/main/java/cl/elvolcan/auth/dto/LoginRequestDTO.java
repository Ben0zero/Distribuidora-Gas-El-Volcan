package cl.elvolcan.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "Estructura de datos para iniciar sesión")
public class LoginRequestDTO {

    @Schema(description = "Nombre de usuario registrado", example = "eladmin")
    @NotBlank(message = "El nombre de usuario no puede estar vacío")
    private String username;

    @Schema(description = "Contraseña del usuario", example = "elsuperadmin123")
    @NotBlank(message = "La contraseña no puede estar vacía")
    private String password;

}
