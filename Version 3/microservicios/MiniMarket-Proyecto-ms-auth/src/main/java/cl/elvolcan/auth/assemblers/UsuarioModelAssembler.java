package cl.elvolcan.auth.assemblers;

import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.*;
import cl.elvolcan.auth.controller.UsuarioControllerV2;
import cl.elvolcan.auth.dto.UsuarioResponseDTO;
import org.springframework.hateoas.EntityModel;
import org.springframework.hateoas.server.RepresentationModelAssembler;
import org.springframework.stereotype.Component;

// Envuelve el DTO (nunca la entidad) con los enlaces HATEOAS de la V2
@Component
public class UsuarioModelAssembler implements RepresentationModelAssembler<UsuarioResponseDTO, EntityModel<UsuarioResponseDTO>> {

    @Override
    public EntityModel<UsuarioResponseDTO> toModel(UsuarioResponseDTO usuario) {
        return EntityModel.of(usuario,
            linkTo(methodOn(UsuarioControllerV2.class).obtenerUsuario(usuario.getId())).withSelfRel(),
            linkTo(methodOn(UsuarioControllerV2.class).listarUsuarios()).withRel("usuarios"),
            linkTo(methodOn(UsuarioControllerV2.class).actualizarUsuario(usuario.getId(), null)).withRel("actualizar"),
            linkTo(methodOn(UsuarioControllerV2.class).eliminarUsuario(usuario.getId())).withRel("eliminar")
        );
    }
}
