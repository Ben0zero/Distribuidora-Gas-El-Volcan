package cl.elvolcan.auth.controller;

import cl.elvolcan.auth.dto.CambioContrasenaRequestDTO;
import cl.elvolcan.auth.service.CuentaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Cuenta del usuario con sesión iniciada (cualquier rol). Está fuera de /api/v1/auth/**,
 * que es público, para que SecurityConfig exija el token (anyRequest().authenticated()).
 */
@RestController
@RequestMapping("/api/v1/cuenta")
@Tag(name = "Mi cuenta", description = "Operaciones del propio usuario. Requieren token JWT.")
public class CuentaController {

    private final CuentaService cuentaService;

    public CuentaController(CuentaService cuentaService) {
        this.cuentaService = cuentaService;
    }

    @Operation(summary = "Cambiar mi contraseña",
            description = "Pide la contraseña actual y la nueva (8 a 72 caracteres, con letra y número). "
                    + "Solo cambia la contraseña del usuario del token.")
    @ApiResponse(responseCode = "204", description = "Contraseña cambiada")
    @ApiResponse(responseCode = "400", description = "Contraseña actual incorrecta o nueva inválida")
    @ApiResponse(responseCode = "401", description = "Sin token o token inválido")
    @PutMapping("/contrasena")
    public ResponseEntity<Void> cambiarContrasena(@Valid @RequestBody CambioContrasenaRequestDTO request,
                                                  Authentication authentication) {
        // El usuario sale del token, nunca del body: no se puede cambiar la contraseña de otra cuenta
        cuentaService.cambiarContrasena(authentication.getName(), request);
        return ResponseEntity.noContent().build();
    }
}
