package cl.elvolcan.auth.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Datos de respuesta del usuario autenticado o registrado")
public class UsuarioResponseDTO {
    
    @Schema(example = "1")
    private Long id;
    @Schema(example = "Juan Perez")
    private String nombre;
    @Schema(example = "12345678-9")
    private String rut;
    @Schema(example = "jperez")
    private String username;
    @Schema(example = "ADMIN")
    private String nombreRol;
    @Schema(description = "Direccion del usuario", example = "Av. Independencia 123")
    private String direccion;
    @Schema(example = "Region de Nuble")
    private String region;
    @Schema(example = "Chillan")
    private String comuna;
    @Schema(example = "Residencial")
    private String tipoCliente;
    @Schema(example = "+56912345678")
    private String telefono;
    // Solo lo trae el login: en listados y altas de usuarios se omite del JSON
    @Schema(description = "Token JWT generado (solo en el login)", example = "eyJhbGciOiJIUzI1NiJ9...")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String token;
}
