package cl.elvolcan.auth.controller;

import cl.elvolcan.auth.dto.LoginRequestDTO;
import cl.elvolcan.auth.dto.RegistroRequestDTO;
import cl.elvolcan.auth.dto.UsuarioResponseDTO;
import cl.elvolcan.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticación", description = "Endpoints para inicio de sesión, registro y generación de tokens JWT")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @Operation(summary = "Iniciar sesión",
            description = "Valida las credenciales y devuelve el token JWT junto con los datos del usuario "
                    + "(nombre, nombreRol, tipoCliente, dirección...), para que el frontend sepa su rol.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login correcto: token + datos del usuario"),
        @ApiResponse(responseCode = "401", description = "Usuario o contraseña incorrectos")
    })
    @SecurityRequirements() // Indica a Swagger que esta ruta es publica (sin candado)
    @PostMapping("/login")
    public ResponseEntity<UsuarioResponseDTO> login(@RequestBody LoginRequestDTO loginRequest) {
        // AuthService valida usuario y contraseña (BCrypt) y genera el token con el rol
        return ResponseEntity.ok(authService.login(loginRequest));
    }

    @Operation(summary = "Registrar nuevo usuario", description = "Registra un usuario CLIENTE para Distribuidora de Gas El Volcán.")
    @SecurityRequirements()
    @PostMapping("/register")
    public ResponseEntity<UsuarioResponseDTO> registrar(@Valid @RequestBody RegistroRequestDTO request) {
        UsuarioResponseDTO response = authService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
