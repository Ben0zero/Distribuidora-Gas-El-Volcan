package cl.elvolcan.ventas.security;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class FeignInterceptor implements RequestInterceptor {

    private static final Logger log = LoggerFactory.getLogger(FeignInterceptor.class);

    @Override
    public void apply(RequestTemplate template) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        
        if (attributes != null) {
            String authHeader = attributes.getRequest().getHeader("Authorization");
            if (authHeader != null) {
                // Reenvía el token del usuario al otro microservicio (nunca se escribe en el log, H-14)
                template.header("Authorization", authHeader);
            } else {
                log.warn("Llamada Feign a {} sin token: la petición llegó a ventas sin Authorization", template.path());
            }
        } else {
            log.debug("Llamada Feign a {} fuera de una petición HTTP", template.path());
        }
    }
}