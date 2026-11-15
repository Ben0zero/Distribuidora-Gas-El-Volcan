package cl.elvolcan.catalogo.exception;

import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.ErrorResponse;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 1er Flujo: producto inexistente (por id o SKU): 404
    @ExceptionHandler(ProductoNoEncontradoException.class)
    public ResponseEntity<Map<String, String>> handleProductoNoEncontrado(ProductoNoEncontradoException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "No encontrado (404)");
        error.put("mensaje", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    // Reglas de negocio (SKU duplicado, SKU no modificable): 400 con el mensaje del servicio
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleReglaDeNegocio(IllegalArgumentException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Error de procesamiento (400)");
        error.put("mensaje", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // El producto tiene ventas registradas: no se puede eliminar (se puede desactivar): 409
    @ExceptionHandler(ProductoConVentasException.class)
    public ResponseEntity<Map<String, String>> handleProductoConVentas(ProductoConVentasException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Conflicto (409)");
        error.put("mensaje", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    // ms-inventario o ms-ventas no respondió o rechazó la operación: 502 sin exponer URLs internas
    @ExceptionHandler(FeignException.class)
    public ResponseEntity<Map<String, String>> handleFeign(FeignException ex, HttpServletRequest request) {
        log.error("Fallo al llamar a otro microservicio desde {} {}", request.getMethod(), request.getRequestURI(), ex);
        Map<String, String> error = new HashMap<>();
        error.put("error", "Servicio no disponible (502)");
        error.put("mensaje", "No se pudo completar la operación con otro servicio del sistema. Intenta nuevamente.");
        return new ResponseEntity<>(error, HttpStatus.BAD_GATEWAY);
    }

    // 2do Flujo: Usuarios logeados pero SIN permisos (Ej: Panadero intentando crear producto)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDeniedException(AccessDeniedException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Acceso denegado (403)");
        error.put("mensaje", "No tiene los privilegios suficientes para modificar el catálogo de productos.");

        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    // 3er Flujo: JSON mal formado, vacío, o con errores de sintaxis
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleMessageNotReadable(HttpMessageNotReadableException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Petición incorrecta (400)");
        error.put("mensaje", "El formato del JSON es incorrecto o faltan datos. Verifique la información enviada.");

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // 4to Flujo: Validaciones de campos (Falla el @Valid de tu ProductoRequestDTO)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Datos inválidos (400)");
        
        // Captura el mensaje específico del campo que falló en la validación
        String mensajeValidacion = ex.getBindingResult().getFieldErrors().get(0).getDefaultMessage();
        error.put("mensaje", "Validación fallida: " + mensajeValidacion);

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
