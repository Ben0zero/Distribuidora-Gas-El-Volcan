package cl.elvolcan.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Estructura de datos para registrar un nuevo usuario")
public class RegistroRequestDTO {
    
    @Schema(description = "Nombre completo", example = "Juan Perez")
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @Schema(description = "RUT del usuario", example = "12345678-9")
    @NotBlank(message = "El RUT es obligatorio")
    private String rut;

    @Schema(description = "Nombre de usuario para el sistema", example = "jperez")
    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 4, message = "El usuario debe tener al menos 4 caracteres")
    private String username;

    @Schema(description = "Contraseña de acceso", example = "secreta123")
    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;

    // El rol NO se recibe desde el cliente: el registro público siempre crea usuarios CLIENTE.
    // Los usuarios VENDEDOR o ADMIN solo los crea un ADMIN desde /api/usuarios.

    @Schema(description = "Direccion de entrega", example = "Av. Independencia 123")
    @NotBlank(message = "La direccion es obligatoria")
    private String direccion;

    @Schema(description = "Region", example = "Region de Nuble")
    @NotBlank(message = "La region es obligatoria")
    private String region;

    @Schema(description = "Comuna", example = "Chillan")
    @NotBlank(message = "La comuna es obligatoria")
    private String comuna;

    @Schema(description = "Tipo de cliente", example = "Residencial", allowableValues = {"Residencial", "Comercial"})
    @NotBlank(message = "El tipo de cliente es obligatorio (Residencial o Comercial)")
    private String tipoCliente;

    @Schema(description = "Telefono (opcional)", example = "+56912345678")
    private String telefono;

}
