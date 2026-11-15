package cl.elvolcan.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Cambio de contraseña del usuario con sesión iniciada")
public class CambioContrasenaRequestDTO {

    @Schema(description = "Contraseña actual (se verifica con BCrypt)", example = "Cliente123")
    @NotBlank(message = "Ingresa tu contraseña actual")
    private String contrasenaActual;

    // Misma política que el registro (H-07): 8 a 72 caracteres con al menos una letra y un número
    @Schema(description = "Contraseña nueva (mín. 8, con letra y número)", example = "NuevaClave2026")
    @NotBlank(message = "Ingresa la contraseña nueva")
    @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "La contraseña debe incluir al menos una letra y un número")
    private String contrasenaNueva;
}
