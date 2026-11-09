package cl.elvolcan.ventas.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ventas")
@Data 
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario")
    private String usuario;

    @Column(nullable = false)
    private Double total;

    // Usaremos un Enum para evitar errores de tipeo en los estados
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoVenta estado;

    @Column(name = "fecha_venta")
    private LocalDateTime fechaVenta;

    // Datos de despacho y pago ingresados en el checkout del frontend
    @Column(name = "direccion", length = 200)
    private String direccion;

    @Column(name = "comuna", length = 80)
    private String comuna;

    @Column(name = "metodo_pago", length = 20)
    private String metodoPago;

    // Relación 1 a Muchos: Una venta tiene muchos detalles (productos)
    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleVenta> detalles = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.fechaVenta = LocalDateTime.now();
        if (this.estado == null) {
            this.estado = EstadoVenta.PENDIENTE_PAGO; // Estado por defecto
        }
    }

    public enum EstadoVenta {
        PENDIENTE_PAGO,
        PAGADA,
        CANCELADA
    }
}