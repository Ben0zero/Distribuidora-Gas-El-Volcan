package cl.elvolcan.ventas.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
@Schema(description = "Objeto que representa la solicitud para registrar una nueva venta en caja")
public class VentaRequestDTO {

    @Schema(description = "Tipo de cliente que determina el precio", example = "Residencial", allowableValues = {"Residencial", "Comercial"})
    private String tipoCliente = "Residencial";

    @Schema(description = "Dirección de despacho", example = "Av. Argentina 455")
    @NotBlank(message = "La dirección de despacho es obligatoria")
    @Size(max = 200, message = "La dirección no puede superar 200 caracteres")
    private String direccion;

    @Schema(description = "Comuna de despacho (Región de Ñuble)", example = "Chillán")
    @NotBlank(message = "La comuna es obligatoria")
    @Size(max = 80, message = "La comuna no puede superar 80 caracteres")
    private String comuna;

    @Schema(description = "Método de pago elegido en el checkout", example = "Efectivo", allowableValues = {"Efectivo", "Tarjeta"})
    @NotBlank(message = "El método de pago es obligatorio")
    @Pattern(regexp = "Efectivo|Tarjeta", message = "El método de pago debe ser Efectivo o Tarjeta")
    private String metodoPago;

    @NotEmpty(message = "La venta debe tener al menos un producto")
    @Valid // Dispara la validación interna de la lista
    @Schema(description = "Lista de productos de gas incluidos en la venta")
    private List<DetalleVentaRequestDTO> detalles;
}
