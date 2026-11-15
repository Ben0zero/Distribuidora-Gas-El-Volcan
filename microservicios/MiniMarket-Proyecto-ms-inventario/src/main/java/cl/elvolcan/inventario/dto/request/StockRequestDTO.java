package cl.elvolcan.inventario.dto.request;

import jakarta.validation.constraints.*;

public class StockRequestDTO {

    @NotBlank(message = "El SKU es obligatorio")
    private String sku;

    // En /crear es el stock inicial (puede ser 0); en /aumentar y /disminuir es la cantidad a mover,
    // que además debe ser mayor que 0 (lo valida InventarioServiceImpl). Nunca negativa ni sobre 500.
    @NotNull(message = "El stock actual es obligatorio")
    @PositiveOrZero(message = "La cantidad no puede ser negativa")
    @Max(value = 500, message = "La cantidad no puede superar 500 unidades")
    private Double stockActual;

    // se quita los @NotNull de aqui abajo para que no estorben al hacer PUT
    private Double nivelCritico;
    private Double nivelMaximo;

    // Getters y Setters
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public Double getStockActual() { return stockActual; }
    public void setStockActual(Double stockActual) { this.stockActual = stockActual; }

    public Double getNivelCritico() { return nivelCritico; }
    public void setNivelCritico(Double nivelCritico) { this.nivelCritico = nivelCritico; }

    public Double getNivelMaximo() { return nivelMaximo; }
    public void setNivelMaximo(Double nivelMaximo) { this.nivelMaximo = nivelMaximo; }
}
