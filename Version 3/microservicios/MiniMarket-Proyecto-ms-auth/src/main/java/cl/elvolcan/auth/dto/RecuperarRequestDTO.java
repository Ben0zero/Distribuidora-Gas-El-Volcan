package cl.elvolcan.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Solicitud de enlace para restablecer la contraseña")
public class RecuperarRequestDTO {

    @Schema(description = "Usuario (correo) de la cuenta", example = "cliente@elvolcan.cl")
    @NotBlank(message = "Ingresa tu usuario o correo")
    @Size(max = 100, message = "El usuario no puede superar 100 caracteres")
    private String usuario;
}
