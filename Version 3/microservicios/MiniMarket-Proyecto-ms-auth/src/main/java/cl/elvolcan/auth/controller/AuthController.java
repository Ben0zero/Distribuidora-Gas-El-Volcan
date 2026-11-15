package cl.elvolcan.auth.controller;

import cl.elvolcan.auth.dto.LoginRequestDTO;
import cl.elvolcan.auth.dto.RegistroRequestDTO;
import cl.elvolcan.auth.dto.UsuarioResponseDTO;
import cl.elvolcan.auth.security.ProxiesConfiables;
import cl.elvolcan.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Autenticación", description = "Endpoints para inicio de sesión, registro y generación de tokens JWT")
public class AuthController {

    private final AuthService authService;
    private final ProxiesConfiables proxiesConfiables;

    public AuthController(AuthService authService, ProxiesConfiables proxiesConfiables) {
        this.authService = authService;
        this.proxiesConfiables = proxiesConfiables;
    }

    @Operation(summary = "Iniciar sesión",
            description = "Valida las credenciales y devuelve el token JWT junto con los datos del usuario "
                    + "(nombre, nombreRol, tipoCliente, dirección...), para que el frontend sepa su rol.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Login correcto: token + datos del usuario"),
        @ApiResponse(responseCode = "400", description = "Usuario o contraseña vacíos"),
        @ApiResponse(responseCode = "401", description = "Usuario o contraseña incorrectos"),
        @ApiResponse(responseCode = "429", description = "Demasiados intentos fallidos: 5 por usuario + IP o 20 por IP "
                + "en 15 minutos bloquean por 15 minutos (mensaje genérico)")
    })
    @SecurityRequirements() // Indica a Swagger que esta ruta es publica (sin candado)
    @PostMapping("/login")
    public ResponseEntity<UsuarioResponseDTO> login(@Valid @RequestBody LoginRequestDTO loginRequest,
                                                    HttpServletRequest peticion) {
        // AuthService revisa el límite de intentos, valida usuario y contraseña (BCrypt) y genera el token con el rol
        return ResponseEntity.ok(authService.login(loginRequest, ipCliente(peticion)));
    }

    /**
     * IP del cliente para el límite de intentos. Solo se confía en X-Forwarded-For si la petición
     * llega desde un proxy confiable (app.seguridad.proxies-confiables: por defecto la misma máquina,
     * es decir el proxy de Vite; en Docker, la red interna donde está Nginx). Se toma la ÚLTIMA
     * entrada, que es la que agrega el proxy; las anteriores las puede inventar el cliente.
     */
    String ipCliente(HttpServletRequest peticion) {
        String remota = peticion.getRemoteAddr();
        String reenviada = peticion.getHeader("X-Forwarded-For");
        if (reenviada != null && !reenviada.isBlank() && proxiesConfiables.esConfiable(remota)) {
            String[] partes = reenviada.split(",");
            String ultima = partes[partes.length - 1].trim();
            if (!ultima.isEmpty()) {
                return ultima;
            }
        }
        return remota;
    }

    @Operation(summary = "Registrar nuevo usuario", description = "Registra un usuario CLIENTE para Distribuidora de Gas El Volcán.")
    @SecurityRequirements()
    @PostMapping("/register")
    public ResponseEntity<UsuarioResponseDTO> registrar(@Valid @RequestBody RegistroRequestDTO request) {
        UsuarioResponseDTO response = authService.registrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
