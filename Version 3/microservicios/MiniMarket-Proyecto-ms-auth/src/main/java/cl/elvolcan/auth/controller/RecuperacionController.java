package cl.elvolcan.auth.controller;

import cl.elvolcan.auth.dto.RecuperarRequestDTO;
import cl.elvolcan.auth.dto.RestablecerRequestDTO;
import cl.elvolcan.auth.service.RecuperacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Recuperación de contraseña (pública: está bajo /api/v1/auth/**). */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Recuperación de contraseña", description = "Enlace de un solo uso para restablecer la contraseña.")
public class RecuperacionController {

    /** Misma respuesta exista o no la cuenta: no revela qué usuarios están registrados. */
    static final String MENSAJE_SOLICITUD =
            "Si la cuenta existe, te enviamos un enlace para restablecer la contraseña. Vence en 15 minutos.";
    static final String MENSAJE_RESTABLECIDA = "Tu contraseña se restableció. Ya puedes iniciar sesión.";

    private final RecuperacionService recuperacionService;

    public RecuperacionController(RecuperacionService recuperacionService) {
        this.recuperacionService = recuperacionService;
    }

    @Operation(summary = "Solicitar enlace de recuperación",
            description = "Siempre responde 200 con el mismo mensaje, exista o no la cuenta. El enlace se envía por "
                    + "NotificacionService (en desarrollo, solo al log de ms-auth); nunca viene en esta respuesta.")
    @ApiResponse(responseCode = "200", description = "Solicitud recibida (mensaje genérico)")
    @ApiResponse(responseCode = "400", description = "Usuario vacío")
    @SecurityRequirements()
    @PostMapping("/recuperar")
    public ResponseEntity<Map<String, String>> recuperar(@Valid @RequestBody RecuperarRequestDTO request) {
        recuperacionService.solicitar(request.getUsuario());
        return ResponseEntity.ok(Map.of("mensaje", MENSAJE_SOLICITUD));
    }

    @Operation(summary = "Restablecer contraseña con el token del enlace",
            description = "Valida que el token exista, no esté usado ni vencido; guarda la nueva contraseña con BCrypt "
                    + "y deja el token inutilizable.")
    @ApiResponse(responseCode = "200", description = "Contraseña restablecida")
    @ApiResponse(responseCode = "400", description = "Token inválido, usado o vencido, o contraseña que no cumple la política")
    @SecurityRequirements()
    @PostMapping("/restablecer")
    public ResponseEntity<Map<String, String>> restablecer(@Valid @RequestBody RestablecerRequestDTO request) {
        recuperacionService.restablecer(request.getToken(), request.getContrasenaNueva());
        return ResponseEntity.ok(Map.of("mensaje", MENSAJE_RESTABLECIDA));
    }
}
