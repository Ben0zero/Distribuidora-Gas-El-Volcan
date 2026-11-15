package cl.elvolcan.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
@Schema(description = "Estructura de datos para registrar un nuevo usuario")
public class RegistroRequestDTO {
    
    @Schema(description = "Nombre completo", example = "Juan Perez")
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    @Schema(description = "RUT del usuario, con o sin puntos y guion (se valida el dígito verificador)", example = "12.345.678-5")
    @NotBlank(message = "El RUT es obligatorio")
    private String rut;

    @Schema(description = "Nombre de usuario para el sistema", example = "jperez")
    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 4, message = "El usuario debe tener al menos 4 caracteres")
    private String username;

    // Política de contraseñas (H-07): mínimo 8 caracteres, con al menos una letra y un número
    @Schema(description = "Contraseña de acceso (mín. 8, con letra y número)", example = "Secreta123")
    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "La contraseña debe incluir al menos una letra y un número")
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
