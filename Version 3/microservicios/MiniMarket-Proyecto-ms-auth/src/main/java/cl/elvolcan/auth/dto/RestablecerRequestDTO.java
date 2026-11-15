package cl.elvolcan.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Nueva contraseña usando el token del enlace de recuperación")
public class RestablecerRequestDTO {

    @Schema(description = "Token que viene en el enlace (?token=...)")
    @NotBlank(message = "Falta el token del enlace")
    @Size(max = 100, message = "El token no es válido")
    private String token;

    // Misma política que el registro (H-07): 8 a 72 caracteres con al menos una letra y un número
    @Schema(description = "Contraseña nueva (mín. 8, con letra y número)", example = "NuevaClave2026")
    @NotBlank(message = "Ingresa la contraseña nueva")
    @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "La contraseña debe incluir al menos una letra y un número")
    private String contrasenaNueva;
}
