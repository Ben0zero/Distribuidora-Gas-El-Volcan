package cl.elvolcan.ventas.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "API de Ventas - Distribuidora de Gas El Volcán (ms-ventas)",
                version = "1.0.0",
                description = "Microservicio de ventas de productos de gas, integrado con catálogo e inventario vía Feign. "
                        + "Disponible en dos versiones: /api/v1 (REST) y /api/v2 (HATEOAS)."
        ),
        security = @SecurityRequirement(name = "bearerAuth")
)
@SecurityScheme(
        name = "bearerAuth",
        description = "Ingresa tu token JWT aquí. Nota: NO es necesario escribir 'Bearer ' antes del token, solo pega el código.",
        scheme = "bearer",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER
)
public class SwaggerConfig {

    // --- Versionado de la API: Swagger UI muestra un selector con ambos grupos ---
    @Bean
    public GroupedOpenApi apiV1() {
        return GroupedOpenApi.builder()
                .group("v1")
                .displayName("API v1 (REST)")
                .pathsToMatch("/api/v1/**")
                .build();
    }

    @Bean
    public GroupedOpenApi apiV2() {
        return GroupedOpenApi.builder()
                .group("v2")
                .displayName("API v2 (HATEOAS)")
                .pathsToMatch("/api/v2/**")
                .build();
    }
}
