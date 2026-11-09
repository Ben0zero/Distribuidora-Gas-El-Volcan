package cl.elvolcan.ventas.controller;

import cl.elvolcan.ventas.dto.VentaRequestDTO;
import cl.elvolcan.ventas.dto.VentaResponseDTO;
import cl.elvolcan.ventas.service.VentaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.hateoas.CollectionModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

/**
 * Versión 2 de la API de ventas: mismas operaciones que la V1, pero las colecciones
 * se devuelven como CollectionModel (HATEOAS) con enlaces de navegación.
 */
@RestController
@RequestMapping("/api/v2/ventas")
@RequiredArgsConstructor
@Tag(name = "Ventas V2 (HATEOAS)", description = "Registro y confirmación de ventas con hipermedia HATEOAS")
public class VentaControllerV2 {

    private final VentaService ventaService;

    @Operation(summary = "Listar todas las ventas (V2)", description = "Solo ADMIN y VENDEDOR")
    @GetMapping
    public ResponseEntity<CollectionModel<VentaResponseDTO>> listarTodas() {
        List<VentaResponseDTO> ventas = ventaService.listarTodas();
        return ResponseEntity.ok(CollectionModel.of(ventas,
                linkTo(methodOn(VentaControllerV2.class).listarTodas()).withSelfRel(),
                linkTo(methodOn(VentaControllerV2.class).misCompras()).withRel("mis-compras")));
    }

    @Operation(summary = "Mis compras (V2)", description = "Historial de compras del usuario autenticado")
    @GetMapping("/mis-compras")
    public ResponseEntity<CollectionModel<VentaResponseDTO>> misCompras() {
        List<VentaResponseDTO> compras = ventaService.listarMisCompras();
        return ResponseEntity.ok(CollectionModel.of(compras,
                linkTo(methodOn(VentaControllerV2.class).misCompras()).withSelfRel()));
    }

    @Operation(summary = "Registrar un nuevo pedido (V2)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Venta creada exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "404", description = "Producto no encontrado"),
        @ApiResponse(responseCode = "409", description = "Stock insuficiente")
    })
    @PostMapping
    public ResponseEntity<VentaResponseDTO> registrarPedido(@Valid @RequestBody VentaRequestDTO ventaRequestDTO) {
        VentaResponseDTO nuevoPedido = ventaService.crearPedido(ventaRequestDTO);
        nuevoPedido.add(linkTo(methodOn(VentaControllerV2.class).misCompras()).withRel("mis-compras-v2"));
        return new ResponseEntity<>(nuevoPedido, HttpStatus.CREATED);
    }

    @Operation(summary = "Confirmar pago de venta (V2)", description = "Solo el dueño de la venta o un ADMIN")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Pago confirmado exitosamente"),
        @ApiResponse(responseCode = "403", description = "La venta no pertenece al usuario"),
        @ApiResponse(responseCode = "404", description = "Venta no encontrada")
    })
    @PutMapping("/{id}/confirmar")
    public ResponseEntity<VentaResponseDTO> confirmarPago(
            @Parameter(description = "ID numérico de la venta a confirmar", example = "1")
            @PathVariable("id") Long id) {
        VentaResponseDTO ventaPagada = ventaService.confirmarPago(id);
        ventaPagada.add(linkTo(methodOn(VentaControllerV2.class).misCompras()).withRel("mis-compras-v2"));
        return ResponseEntity.ok(ventaPagada);
    }
}
