package cl.elvolcan.auth.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.web.util.matcher.IpAddressMatcher;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Proxies de los que ms-auth acepta X-Forwarded-For para el límite de intentos de login (H-07).
 * Se configura con app.seguridad.proxies-confiables: IPs o rangos CIDR separados por coma.
 * Por defecto solo la misma máquina (127.0.0.1 y ::1: el proxy de Vite en desarrollo).
 * En Docker se agrega la red interna (ej. 172.28.0.0/16), porque ahí la petición llega desde
 * el contenedor de Nginx; sin eso todos los usuarios compartirían la IP de Nginx.
 */
@Component
public class ProxiesConfiables {

    private final List<IpAddressMatcher> proxies;

    public ProxiesConfiables(@Value("${app.seguridad.proxies-confiables:127.0.0.1,::1}") String[] proxies) {
        this.proxies = Arrays.stream(proxies == null ? new String[0] : proxies)
                .map(String::trim)
                .filter(p -> !p.isEmpty())
                .map(IpAddressMatcher::new)
                .toList();
    }

    /** true si la IP remota es uno de los proxies configurados (o está dentro de uno de sus rangos). */
    public boolean esConfiable(String ip) {
        if (ip == null || ip.isBlank()) {
            return false;
        }
        for (IpAddressMatcher proxy : proxies) {
            try {
                if (proxy.matches(ip.trim())) {
                    return true;
                }
            } catch (IllegalArgumentException e) {
                return false; // no es una IP válida
            }
        }
        return false;
    }
}
