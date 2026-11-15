package cl.elvolcan.catalogo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
@Schema(description = "Nuevo estado de un producto en la tienda")
public class EstadoProductoRequestDTO {

    @Schema(description = "true = se muestra y se puede vender; false = queda oculto (borrado lógico)", example = "true")
    @NotNull(message = "Indica si el producto queda activo (true) o inactivo (false)")
    private Boolean activo;
}
