package com.fixya.security;

import com.fixya.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests TDD para JwtUtil
 * Verifica generacion, validacion y extraccion de claims JWT
 */
@DisplayName("JwtUtil - Tests de Tokens JWT")
class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", "fixya-test-secret-key-muy-larga-para-hmac-sha256-ok");
        ReflectionTestUtils.setField(jwtUtil, "expiration", 86400000L);
    }

    @Test
    @DisplayName("generateToken crea token JWT valido")
    void testGenerateToken() {
        // ARRANGE
        User user = User.builder()
                .id(1)
                .email("test@fixya.com")
                .role(User.UserRole.administrador)
                .build();

        // ACT
        String token = jwtUtil.generateToken(user);

        // ASSERT
        assertThat(token).isNotNull().isNotBlank();
        assertThat(token.split("\\.")).hasSize(3); // JWT: header.payload.signature
    }

    @Test
    @DisplayName("validateToken retorna true para token valido")
    void testValidateTokenValido() {
        User user = User.builder().id(1).email("test@fixya.com").role(User.UserRole.usuario).build();
        String token = jwtUtil.generateToken(user);
        assertThat(jwtUtil.validateToken(token)).isTrue();
    }

    @Test
    @DisplayName("validateToken retorna false para token invalido")
    void testValidateTokenInvalido() {
        assertThat(jwtUtil.validateToken("token.invalido.aqui")).isFalse();
        assertThat(jwtUtil.validateToken("")).isFalse();
    }

    @Test
    @DisplayName("getUserId extrae ID correcto del token")
    void testGetUserId() {
        User user = User.builder().id(42).email("test@fixya.com").role(User.UserRole.tecnico).build();
        String token = jwtUtil.generateToken(user);
        assertThat(jwtUtil.getUserId(token)).isEqualTo(42);
    }

    @Test
    @DisplayName("getRole extrae rol correcto del token")
    void testGetRole() {
        User user = User.builder().id(1).email("admin@fixya.com").role(User.UserRole.administrador).build();
        String token = jwtUtil.generateToken(user);
        assertThat(jwtUtil.getRole(token)).isEqualTo("administrador");
    }
}
