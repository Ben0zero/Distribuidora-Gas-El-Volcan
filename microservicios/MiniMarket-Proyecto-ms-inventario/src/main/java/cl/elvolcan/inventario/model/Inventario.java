package cl.elvolcan.inventario.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventarios")
public class Inventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El SKU es obligatorio")
    @Column(unique = true, nullable = false)
    private String sku;

    @NotNull(message = "El stock actual es obligatorio")
    @Min(value = 0, message = "El stock no puede ser negativo")
    private Double stockActual;

    @NotNull(message = "El nivel crítico es obligatorio")
    @Min(value = 1, message = "El nivel crítico debe ser mayor a 0")
    private Double nivelCritico;

    @NotNull(message = "El nivel máximo es obligatorio")
    private Double nivelMaximo;

    // Bloqueo optimista (H-03): Hibernate incrementa esta versión en cada UPDATE y rechaza
    // la escritura si otra transacción la cambió antes. Se declara con DEFAULT 0 NOT NULL para que
    // ddl-auto=update agregue la columna en Oracle rellenando con 0 las filas que ya existen.
    @Version
    @Column(name = "version", nullable = false, columnDefinition = "NUMBER(19,0) DEFAULT 0 NOT NULL")
    private Long version = 0L;

    @Column(name = "ultima_actualizacion")
    private LocalDateTime ultimaActualizacion;

    //  Se ejecuta automáticamente
    @PrePersist
    @PreUpdate
    public void actualizarFecha() {
        this.ultimaActualizacion = LocalDateTime.now();
    }

    // Getters y Setters

    public Long getId() { return id; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public Double getStockActual() { return stockActual; }
    public void setStockActual(Double stockActual) { this.stockActual = stockActual; }

    public Double getNivelCritico() { return nivelCritico; }
    public void setNivelCritico(Double nivelCritico) { this.nivelCritico = nivelCritico; }

    public Double getNivelMaximo() { return nivelMaximo; }
    public void setNivelMaximo(Double nivelMaximo) { this.nivelMaximo = nivelMaximo; }

    public LocalDateTime getUltimaActualizacion() { return ultimaActualizacion; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}