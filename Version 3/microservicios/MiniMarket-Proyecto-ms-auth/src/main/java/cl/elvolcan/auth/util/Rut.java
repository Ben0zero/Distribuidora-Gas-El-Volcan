package cl.elvolcan.auth.util;

import java.util.Locale;

/**
 * RUT chileno. Se guarda normalizado: dígitos del cuerpo + dígito verificador (0-9 o K),
 * sin puntos ni guion. Ej.: "12.345.678-5" se guarda como "123456785".
 */
public final class Rut {

    private Rut() {
    }

    /** Quita puntos, guion y espacios, y deja la K en mayúscula. null queda como "". */
    public static String normalizar(String rut) {
        return rut == null ? "" : rut.replaceAll("[.\\s-]", "").toUpperCase(Locale.ROOT);
    }

    /** Cuerpo de 6 a 8 dígitos + dígito verificador (no revisa que el DV sea el correcto). */
    public static boolean tieneFormato(String rut) {
        return normalizar(rut).matches("\\d{6,8}[\\dK]");
    }

    /** Dígito verificador por módulo 11: factores 2..7 desde la derecha; 11 -> 0, 10 -> K. */
    public static char digitoVerificador(String cuerpo) {
        int suma = 0;
        int factor = 2;
        for (int i = cuerpo.length() - 1; i >= 0; i--) {
            suma += Character.getNumericValue(cuerpo.charAt(i)) * factor;
            factor = factor == 7 ? 2 : factor + 1;
        }
        int resto = 11 - (suma % 11);
        return resto == 11 ? '0' : resto == 10 ? 'K' : Character.forDigit(resto, 10);
    }

    /** Formato correcto y dígito verificador válido. Se exige solo al crear usuarios. */
    public static boolean esValido(String rut) {
        String n = normalizar(rut);
        return tieneFormato(n) && digitoVerificador(n.substring(0, n.length() - 1)) == n.charAt(n.length() - 1);
    }
}
