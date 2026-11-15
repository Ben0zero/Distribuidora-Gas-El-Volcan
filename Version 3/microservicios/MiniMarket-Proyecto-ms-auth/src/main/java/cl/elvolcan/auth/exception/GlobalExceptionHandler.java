package cl.elvolcan.auth.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.ErrorResponse;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice  //intercepta las excepciones que ocurran en cualquier RestController
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    //2do flujo: usuarios logeados pero NO tienen permisos
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDeniedException(AccessDeniedException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Acceso denegado (403)");
        error.put("mensaje", "No tiene los privilegios suficientes para realizar esta acción. Contacte al administrador del sistema.");

        // Devuelve un 403 + msje para Postman
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }


    // 3er Flujo: para errores de Login (Usuario no existe o mala contraseña) ---
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Credenciales inválidas (401)");
        error.put("mensaje", "Usuario o contraseña incorrectos."); // mensaje generico por ciberseguridad

        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    // Registro duplicado (RUT o usuario ya existe): 409 Conflict
    // Spring elige este handler antes que el de RuntimeException por ser más específico
    // Usuario inexistente: 404
    @ExceptionHandler(UsuarioNoEncontradoException.class)
    public ResponseEntity<Map<String, String>> handleUsuarioNoEncontrado(UsuarioNoEncontradoException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "No encontrado (404)");
        error.put("mensaje", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    // Datos de negocio inválidos (ej. rol inexistente o usuario nuevo sin contraseña): 400
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleDatosInvalidos(IllegalArgumentException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Datos inválidos (400)");
        error.put("mensaje", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(RegistroDuplicadoException.class)
    public ResponseEntity<Map<String, String>> handleRegistroDuplicado(RegistroDuplicadoException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Conflicto (409)");
        error.put("mensaje", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    // Datos del formulario inválidos (@Valid): 400 con el primer mensaje y el detalle por campo
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidacion(MethodArgumentNotValidException ex) {
        Map<String, String> campos = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> campos.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
        Map<String, Object> error = new HashMap<>();
        error.put("error", "Datos inválidos (400)");
        error.put("mensaje", campos.isEmpty() ? "Datos inválidos" : campos.values().iterator().next());
        error.put("validationErrors", campos);
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // 4to Flujo: para peticiones sin Body o JSON mal formado
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleMessageNotReadable(HttpMessageNotReadableException ex) {
        Map<String, String> error = new HashMap<>();
        
        // Usamos BAD_REQUEST (400) porque el error es de sintaxis del cliente, no de credenciales.
        error.put("error", "Petición incorrecta (400)"); 
        error.put("mensaje", "Faltan datos en la petición o el formato es incorrecto. Verifique la información enviada.");

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }


    // --- Errores internos (H-10): el cliente recibe un mensaje neutro y el detalle queda en el log ---
    public static final String MENSAJE_INTERNO = "Ocurrió un error interno. Intenta nuevamente o contacta al administrador.";

    // Parámetro con formato inválido (ej. /id/abc): 400
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleTipoInvalido(MethodArgumentTypeMismatchException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Petición incorrecta (400)");
        error.put("mensaje", "El parámetro '" + ex.getName() + "' tiene un formato inválido");
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // Cualquier otro error: si es un error HTTP estándar de Spring (ruta inexistente, método no permitido...)
    // se respeta su código; si no, es un fallo interno (BD, red, bug) y se responde 500 sin detalles técnicos.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleErrorInterno(Exception ex, HttpServletRequest request) {
        Map<String, String> error = new HashMap<>();
        if (ex instanceof ErrorResponse errorHttp) {
            HttpStatusCode status = errorHttp.getStatusCode();
            error.put("error", "Error HTTP (" + status.value() + ")");
            String detalle = errorHttp.getBody().getDetail();
            error.put("mensaje", detalle != null ? detalle : "Petición no válida");
            return new ResponseEntity<>(error, status);
        }
        log.error("Error no controlado en {} {}", request.getMethod(), request.getRequestURI(), ex);
        error.put("error", "Error interno (500)");
        error.put("mensaje", MENSAJE_INTERNO);
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
