package cl.elvolcan.inventario.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.ErrorResponse;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice // Intercepta las excepciones globales en los controladores
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // FLUJO 1: Excepciones Personalizadas de Negocio (Inventario) 

    // Error 404: Cuando el SKU buscado no existe en las tablas de inventario
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(ResourceNotFoundException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Recurso no encontrado (404)");
        error.put("mensaje", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    // Error 400: Cuando intentan sacar más stock del que hay disponible
    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<Map<String, String>> handleInsufficient(InsufficientStockException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Stock insuficiente (400)");
        error.put("mensaje", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // Error 409: Conflicto cuando se intenta superar el nivel máximo permitido
    @ExceptionHandler(OverstockException.class)
    public ResponseEntity<Map<String, String>> handleOverstock(OverstockException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Conflicto de sobre-stock (409)");
        error.put("mensaje", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }


    // FLUJO 2: Seguridad y Sintaxis General (Estandarizado con Login/Catálogo) 

    // Error 403: Usuarios autenticados (con token legítimo) pero que NO tienen el rol permitido
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDeniedException(AccessDeniedException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Acceso denegado (403)");
        error.put("mensaje", "No tiene los privilegios suficientes para modificar los registros de inventario. Operación restringida.");
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    // Error 400: Peticiones con JSON vacío o mal estructurado en Postman
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleMessageNotReadable(HttpMessageNotReadableException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Petición incorrecta (400)");
        error.put("mensaje", "El formato del JSON es incorrecto o faltan datos esenciales. Verifique la información enviada.");
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // Error 409: bloqueo optimista (@Version), dos ajustes del mismo SKU al mismo tiempo
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, String>> handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Conflicto (409)");
        error.put("mensaje", "La operación entró en conflicto con otra que se hizo al mismo tiempo. Vuelve a intentarlo.");
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    // Error 400: cantidad de ajuste inválida (negativa, cero o sobre el tope)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Petición incorrecta (400)");
        error.put("mensaje", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // Error 400: falla de @Valid en el body (ej. stockActual negativo o sobre 500)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleBodyInvalido(MethodArgumentNotValidException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Petición incorrecta (400)");
        error.put("mensaje", ex.getBindingResult().getFieldErrors().stream()
                .map(f -> f.getField() + ": " + f.getDefaultMessage())
                .collect(Collectors.joining("; ")));
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // Error 400: falla de validación en parámetros de la ruta (ej. /sumar-stock/{sku}/-999)
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<Map<String, String>> handleParametroInvalido(HandlerMethodValidationException ex) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Petición incorrecta (400)");
        error.put("mensaje", ex.getAllErrors().stream()
                .map(MessageSourceResolvable::getDefaultMessage)
                .collect(Collectors.joining("; ")));
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
