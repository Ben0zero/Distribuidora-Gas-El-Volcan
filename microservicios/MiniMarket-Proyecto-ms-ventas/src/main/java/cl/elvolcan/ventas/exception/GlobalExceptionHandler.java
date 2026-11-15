package cl.elvolcan.ventas.exception;

import feign.FeignException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 1. Manejo de errores de validación de los DTO (@Valid, @NotEmpty, @Min)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> erroresDetallados = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            erroresDetallados.put(error.getField(), error.getDefaultMessage())
        );

        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setStatus(HttpStatus.BAD_REQUEST.value()); // 400
        errorResponse.setError(HttpStatus.BAD_REQUEST.getReasonPhrase());
        errorResponse.setMessage("Error en la validación de los datos del pedido");
        errorResponse.setValidationErrors(erroresDetallados);
        errorResponse.setPath(request.getRequestURI());

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // 2. Manejo de recurso no encontrado (Ej: productoId no existe en el catálogo)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setStatus(HttpStatus.NOT_FOUND.value()); // 404
        errorResponse.setError(HttpStatus.NOT_FOUND.getReasonPhrase());
        errorResponse.setMessage(ex.getMessage());
        errorResponse.setPath(request.getRequestURI());

        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    // 2c. Bloqueo optimista (@Version): dos peticiones modificaron la misma venta a la vez
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(ObjectOptimisticLockingFailureException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setStatus(HttpStatus.CONFLICT.value()); // 409
        errorResponse.setError(HttpStatus.CONFLICT.getReasonPhrase());
        errorResponse.setMessage("La operación entró en conflicto con otra que se hizo al mismo tiempo. Vuelve a intentarlo.");
        errorResponse.setPath(request.getRequestURI());

        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    // 2b. Datos de la venta inválidos para el negocio (producto inactivo, cantidad sobre el tope, ítem sin datos)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setStatus(HttpStatus.BAD_REQUEST.value()); // 400
        errorResponse.setError(HttpStatus.BAD_REQUEST.getReasonPhrase());
        errorResponse.setMessage(ex.getMessage());
        errorResponse.setPath(request.getRequestURI());

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // 3. Manejo de reglas de negocio: Stock Insuficiente o Estado Ilegal (Ej: pagar algo ya pagado)
    @ExceptionHandler({InsufficientStockException.class, IllegalStateException.class})
    public ResponseEntity<ErrorResponse> handleBusinessLogicRules(RuntimeException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setStatus(HttpStatus.CONFLICT.value()); // 409 Conflict es ideal para reglas de negocio
        errorResponse.setError(HttpStatus.CONFLICT.getReasonPhrase());
        errorResponse.setMessage(ex.getMessage());
        errorResponse.setPath(request.getRequestURI());

        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    // 3b. Acceso denegado: el usuario está autenticado pero no puede operar sobre el recurso (Ej: venta ajena)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setStatus(HttpStatus.FORBIDDEN.value()); // 403
        errorResponse.setError(HttpStatus.FORBIDDEN.getReasonPhrase());
        errorResponse.setMessage(ex.getMessage());
        errorResponse.setPath(request.getRequestURI());

        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    // 4. Errores de FEIGN (otro microservicio rechazó la operación o no respondió).
    // Un 4xx trae una regla de negocio del otro servicio (ej. "Stock insuficiente"): se reenvía solo ese mensaje.
    // Un 5xx o una caída se registra en el log y el cliente recibe un mensaje neutro (sin URLs internas).
    @ExceptionHandler(FeignException.class)
    public ResponseEntity<ErrorResponse> handleFeignStatusException(FeignException ex, HttpServletRequest request) {
        boolean errorDeNegocio = ex.status() >= 400 && ex.status() < 500;
        HttpStatus status = errorDeNegocio ? HttpStatus.valueOf(ex.status()) : HttpStatus.BAD_GATEWAY;
        String mensaje = errorDeNegocio ? mensajeDeNegocio(ex.contentUTF8()) : null;
        if (!errorDeNegocio) {
            log.error("Fallo al llamar a otro microservicio desde {} {}", request.getMethod(), request.getRequestURI(), ex);
        }
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setStatus(status.value());
        errorResponse.setError("Error de Comunicación entre Microservicios");
        errorResponse.setMessage(mensaje != null ? mensaje
                : "No se pudo completar la operación con otro servicio. Intenta nuevamente.");
        errorResponse.setPath(request.getRequestURI());

        return new ResponseEntity<>(errorResponse, status);
    }

    // Extrae el campo "mensaje" (o "message") del JSON de error del otro microservicio
    static String mensajeDeNegocio(String cuerpo) {
        if (cuerpo == null) return null;
        Matcher m = MENSAJE_JSON.matcher(cuerpo);
        return m.find() ? m.group(1) : null;
    }

    private static final Pattern MENSAJE_JSON = Pattern.compile("\"(?:mensaje|message)\"\\s*:\\s*\"([^\"]{1,200})\"");

    public static final String MENSAJE_INTERNO = "Ocurrió un error interno. Intenta nuevamente o contacta al administrador.";

    // Parámetro con formato inválido (ej. /api/v1/ventas/abc): 400
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTipoInvalido(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setStatus(HttpStatus.BAD_REQUEST.value());
        errorResponse.setError(HttpStatus.BAD_REQUEST.getReasonPhrase());
        errorResponse.setMessage("El parámetro '" + ex.getName() + "' tiene un formato inválido");
        errorResponse.setPath(request.getRequestURI());
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    // 5. Catch-all (H-10): un error HTTP estándar de Spring (404 de ruta, 405...) conserva su código;
    // cualquier otro es un fallo interno: se registra en el log y el cliente recibe un 500 sin detalles técnicos.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(Exception ex, HttpServletRequest request) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setPath(request.getRequestURI());
        if (ex instanceof org.springframework.web.ErrorResponse errorHttp) {
            HttpStatusCode status = errorHttp.getStatusCode();
            String detalle = errorHttp.getBody().getDetail();
            errorResponse.setStatus(status.value());
            errorResponse.setError("Error HTTP");
            errorResponse.setMessage(detalle != null ? detalle : "Petición no válida");
            return new ResponseEntity<>(errorResponse, status);
        }
        log.error("Error no controlado en {} {}", request.getMethod(), request.getRequestURI(), ex);
        errorResponse.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value()); // 500
        errorResponse.setError(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase());
        errorResponse.setMessage(MENSAJE_INTERNO);
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
