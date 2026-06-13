package com.fixya.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests TDD para AppStringUtils
 * Verifica uso correcto de Guava y Apache Commons
 */
@DisplayName("AppStringUtils - Tests de Utilidades de Texto")
class AppStringUtilsTest {

    @Test
    @DisplayName("formatNombreCompleto capitaliza correctamente")
    void testFormatNombreCompleto() {
        assertThat(AppStringUtils.formatNombreCompleto("juan", "PEREZ"))
                .isEqualTo("Juan Perez");
    }

    @Test
    @DisplayName("formatNombreCompleto maneja espacios extra")
    void testFormatNombreCompletoEspacios() {
        assertThat(AppStringUtils.formatNombreCompleto("  maria  ", "  garcia  "))
                .isEqualTo("Maria Garcia");
    }

    @Test
    @DisplayName("generarReferenciaPago tiene formato FX-XXXXXXXX")
    void testGenerarReferenciaPago() {
        String ref = AppStringUtils.generarReferenciaPago();
        assertThat(ref).startsWith("FX-");
        assertThat(ref).hasSize(11);
    }

    @Test
    @DisplayName("truncarDescripcion acorta textos largos")
    void testTruncarDescripcion() {
        String larga = "Esta es una descripcion muy larga que deberia ser truncada para la previsualizacion";
        String truncada = AppStringUtils.truncarDescripcion(larga, 30);
        assertThat(truncada.length()).isLessThanOrEqualTo(30);
    }

    @Test
    @DisplayName("truncarDescripcion maneja null y vacio")
    void testTruncarDescripcionNull() {
        assertThat(AppStringUtils.truncarDescripcion(null, 50)).isEmpty();
        assertThat(AppStringUtils.truncarDescripcion("", 50)).isEmpty();
    }

    @Test
    @DisplayName("normalizarEmail convierte a minusculas y elimina espacios")
    void testNormalizarEmail() {
        assertThat(AppStringUtils.normalizarEmail("  ADMIN@FIXYA.COM  "))
                .isEqualTo("admin@fixya.com");
    }

    @Test
    @DisplayName("isValido retorna false para null, vacio y espacios")
    void testIsValido() {
        assertThat(AppStringUtils.isValido(null)).isFalse();
        assertThat(AppStringUtils.isValido("")).isFalse();
        assertThat(AppStringUtils.isValido("   ")).isFalse();
        assertThat(AppStringUtils.isValido("hola")).isTrue();
    }

    @Test
    @DisplayName("formatSoles formatea correctamente en soles peruanos")
    void testFormatSoles() {
        assertThat(AppStringUtils.formatSoles(150.5)).isEqualTo("S/ 150.50");
        assertThat(AppStringUtils.formatSoles(0)).isEqualTo("S/ 0.00");
    }

    @Test
    @DisplayName("getLabelMetodoPago retorna label amigable")
    void testGetLabelMetodoPago() {
        assertThat(AppStringUtils.getLabelMetodoPago("yape")).isEqualTo("Yape");
        assertThat(AppStringUtils.getLabelMetodoPago("PLIN")).isEqualTo("Plin");
        assertThat(AppStringUtils.getLabelMetodoPago("tarjeta")).isEqualTo("Tarjeta");
    }
}
