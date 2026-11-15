package cl.elvolcan.auth.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {
    
    private final SecretKey SECRET_KEY;

    // Vigencia del token: 2 horas (H-09). Si se roba un token, sirve por menos tiempo;
    // el frontend ya revisa la expiración y pide iniciar sesión de nuevo.
    static final long EXPIRACION_MS = 1000L * 60 * 60 * 2;

    // La clave se lee de la propiedad jwt.secret (archivo externo de secretos), nunca del código.
    // Debe ser la misma en todos los microservicios para validar los tokens emitidos por ms-auth.
    public JwtUtil(@Value("${jwt.secret}") String secret) {
        this.SECRET_KEY = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String username, String rol){
        return generateToken(username, rol, null);
    }

    /**
     * Genera el token con el rol y, si existe, el tipo de cliente (Residencial/Comercial).
     * ms-ventas lee el claim "tipoCliente" para fijar el precio, así el cliente no puede elegirlo en el body.
     */
    public String generateToken(String username, String rol, String tipoCliente){
        Map<String, Object> claims = new HashMap<>();
        // forzar a que el token guarde el rol con el formato que Spring espera, ya que arrojaba errores al comunicarse antes
        if (!rol.startsWith("ROLE_")) {
            rol = "ROLE_" + rol;
        }
        claims.put("rol", rol);
        if (tipoCliente != null && !tipoCliente.isBlank()) {
            claims.put("tipoCliente", tipoCliente);
        }

        return Jwts.builder()       
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRACION_MS))
                .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder() // Cambiado aquí (parserBuilder)
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }
}
