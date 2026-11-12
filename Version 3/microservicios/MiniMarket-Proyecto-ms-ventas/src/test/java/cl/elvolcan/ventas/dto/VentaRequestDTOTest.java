package cl.elvolcan.ventas.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class VentaRequestDTOTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private VentaRequestDTO ventaValida() {
        DetalleVentaRequestDTO detalle = new DetalleVentaRequestDTO();
        detalle.setProductoId(2L);
        detalle.setCantidad(1);
        VentaRequestDTO dto = new VentaRequestDTO();
        dto.setDetalles(List.of(detalle));
        dto.setDireccion("Calle Nueva 789");
        dto.setComuna("Chillán");
        dto.setMetodoPago("Tarjeta");
        return dto;
    }

    private Set<String> camposConError(VentaRequestDTO dto) {
        return validator.validate(dto).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(Collectors.toSet());
    }

    @Test
    @DisplayName("una venta con despacho y método de pago válidos no tiene errores")
    void ventaValida_sinErrores() {
        assertTrue(camposConError(ventaValida()).isEmpty());
    }

    @Test
    @DisplayName("dirección, comuna y método de pago son obligatorios")
    void datosDeDespachoObligatorios() {
        VentaRequestDTO dto = ventaValida();
        dto.setDireccion(" ");
        dto.setComuna(null);
        dto.setMetodoPago(null);

        assertEquals(Set.of("direccion", "comuna", "metodoPago"), camposConError(dto));
    }

    @Test
    @DisplayName("el método de pago solo acepta Efectivo o Tarjeta")
    void metodoPagoInvalido() {
        VentaRequestDTO dto = ventaValida();
        dto.setMetodoPago("Bitcoin");

        assertEquals(Set.of("metodoPago"), camposConError(dto));
    }
}
