package cl.elvolcan.catalogo.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth";
        
        return new OpenAPI()
                .info(new Info()
                        .title("API de Catálogo de Productos - Distribuidora de Gas El Volcán")
                        .version("1.0.0")
                        .description("Microservicio encargado de gestionar el catálogo de productos de gas (cilindros, accesorios). Las consultas GET son públicas. Las operaciones de creación, actualización y eliminación requieren token JWT con rol ADMIN.")
                        .contact(new Contact().name("Nico")))
                
                // Configuración global para inyectar el token en las peticiones
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                                .name(securitySchemeName)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }

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
