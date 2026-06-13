package com.fixya.util;

import com.google.common.base.Strings;
import com.google.common.collect.ImmutableMap;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.RandomStringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

/**
 * Utilidades de Strings para FixYa
 * Combina Google Guava y Apache Commons Lang3 (rubrica)
 * SOLID: SRP - solo transformaciones de texto
 */
public final class AppStringUtils {

    private static final Logger log = LoggerFactory.getLogger(AppStringUtils.class);

    // Mapa inmutable Guava con abreviaciones de metodos de pago
    public static final ImmutableMap<String, String> METODO_LABELS = ImmutableMap.of(
            "yape", "Yape",
            "plin", "Plin",
            "tarjeta", "Tarjeta",
            "efectivo", "Efectivo"
    );

    private AppStringUtils() {}

    /**
     * Capitaliza nombre completo (nombre + apellido)
     * Usa Apache Commons StringUtils
     */
    public static String formatNombreCompleto(String nombre, String apellido) {
        String n = StringUtils.capitalize(StringUtils.trimToEmpty(nombre).toLowerCase());
        String a = StringUtils.capitalize(StringUtils.trimToEmpty(apellido).toLowerCase());
        return StringUtils.joinWith(" ", n, a);
    }

    /**
     * Genera referencia de pago aleatoria (Commons + Guava)
     * Formato: FX-XXXXXXXX
     */
    public static String generarReferenciaPago() {
        String random = RandomStringUtils.randomAlphanumeric(8).toUpperCase();
        String ref = "FX-" + random;
        log.debug("Referencia de pago generada: {}", ref);
        return ref;
    }

    /**
     * Trunca descripcion para previsualizacion
     * Usa Guava Strings.isNullOrEmpty + Commons abbreviate
     */
    public static String truncarDescripcion(String descripcion, int maxLen) {
        if (Strings.isNullOrEmpty(descripcion)) return "";
        return StringUtils.abbreviate(descripcion, maxLen);
    }

    /**
     * Normaliza email para comparaciones
     */
    public static String normalizarEmail(String email) {
        return StringUtils.trimToEmpty(email).toLowerCase();
    }

    /**
     * Valida que un string no sea vacio (usa ambas librerias)
     */
    public static boolean isValido(String value) {
        return StringUtils.isNotBlank(value) && !Strings.isNullOrEmpty(value);
    }

    /**
     * Formatea monto en soles peruanos
     */
    public static String formatSoles(double monto) {
        return String.format("S/ %.2f", monto);
    }

    /**
     * Obtiene label amigable para metodo de pago
     */
    public static String getLabelMetodoPago(String metodo) {
        return METODO_LABELS.getOrDefault(
                StringUtils.lowerCase(metodo),
                StringUtils.capitalize(metodo)
        );
    }
}
