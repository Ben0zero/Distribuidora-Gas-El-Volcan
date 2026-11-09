package cl.elvolcan.catalogo.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Datos de respuesta del producto")
public class ProductoResponseDTO {
    @Schema(example = "1")
    private Long id;
    @Schema(example = "CL001")
    private String sku;
    @Schema(example = "Cilindro GLP 5 kg")
    private String nombre;
    @Schema(example = "Cilindro de gas licuado de petróleo 5 kg. Para uso residencial (cocina, calefacción pequeña).")
    private String descripcion;
    @Schema(example = "6500")
    private Integer precioResidencial;
    @Schema(example = "6000")
    private Integer precioComercial;
    @Schema(example = "6500")
    private Integer precio;
    @Schema(example = "Cilindros de Gas")
    private String categoria;
    @Schema(example = "/IMAGENES/cilindro de 5 K.png")
    private String imagen;
    @Schema(description = "Estado actual en vitrina", example = "true")
    private Boolean activo;
}