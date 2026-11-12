package cl.elvolcan.auth.controller;

import cl.elvolcan.auth.assemblers.UsuarioModelAssembler;
import cl.elvolcan.auth.dto.UsuarioAdminRequestDTO;
import cl.elvolcan.auth.dto.UsuarioResponseDTO;
import cl.elvolcan.auth.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.hateoas.CollectionModel;
import org.springframework.hateoas.EntityModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

@RestController
@RequestMapping("/api/v2/usuarios")
@Tag(name = "Gestión de Usuarios V2 (HATEOAS)", description = "CRUD de usuarios con hipermedia. Requiere rol ADMIN.")
@PreAuthorize("hasAnyAuthority('ADMIN', 'ROLE_ADMIN')")
public class UsuarioControllerV2 {

    private final UsuarioService usuarioService;
    private final UsuarioModelAssembler assembler;

    public UsuarioControllerV2(UsuarioService usuarioService, UsuarioModelAssembler assembler) {
        this.usuarioService = usuarioService;
        this.assembler = assembler;
    }

    @Operation(summary = "Obtener todos los usuarios (V2)")
    @GetMapping
    public ResponseEntity<CollectionModel<EntityModel<UsuarioResponseDTO>>> listarUsuarios() {
        List<EntityModel<UsuarioResponseDTO>> usuarios = usuarioService.listar().stream()
                .map(assembler::toModel)
                .toList();
        return ResponseEntity.ok(CollectionModel.of(usuarios,
                linkTo(methodOn(UsuarioControllerV2.class).listarUsuarios()).withSelfRel()));
    }

    @Operation(summary = "Obtener un usuario (V2)")
    @GetMapping("/{id}")
    public ResponseEntity<EntityModel<UsuarioResponseDTO>> obtenerUsuario(@PathVariable Long id) {
        return ResponseEntity.ok(assembler.toModel(usuarioService.obtener(id)));
    }

    @Operation(summary = "Crear un nuevo usuario (V2)")
    @PostMapping
    public ResponseEntity<EntityModel<UsuarioResponseDTO>> crearUsuario(@Valid @RequestBody UsuarioAdminRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assembler.toModel(usuarioService.crear(request)));
    }

    @Operation(summary = "Actualizar usuario (V2)")
    @PutMapping("/{id}")
    public ResponseEntity<EntityModel<UsuarioResponseDTO>> actualizarUsuario(@PathVariable Long id, @Valid @RequestBody UsuarioAdminRequestDTO request) {
        return ResponseEntity.ok(assembler.toModel(usuarioService.actualizar(id, request)));
    }

    @Operation(summary = "Eliminar usuario (V2)", description = "Borra al usuario por su ID. Un ADMIN no puede eliminar su propia cuenta.")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id, Authentication authentication) {
        usuarioService.eliminar(id, authentication != null ? authentication.getName() : null);
        return ResponseEntity.noContent().build();
    }
}
