package com.fixya.service;

import com.fixya.dto.AuthResponse;
import com.fixya.dto.LoginRequest;
import com.fixya.dto.RegisterRequest;
import com.fixya.entity.User;
import com.fixya.repository.UserRepository;
import com.fixya.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests TDD para AuthService
 * Principio TDD: Red -> Green -> Refactor
 * Cubre: login exitoso, login fallido, registro nuevo usuario, email duplicado
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService - Tests de Autenticacion")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1)
                .nombre("Carlos")
                .apellido("Lopez")
                .email("carlos@test.com")
                .password("$2a$10$hashedpassword")
                .role(User.UserRole.usuario)
                .build();
    }

    @Test
    @DisplayName("login exitoso con credenciales correctas")
    void testLoginExitoso() {
        // ARRANGE
        LoginRequest request = new LoginRequest();
        request.setEmail("carlos@test.com");
        request.setPassword("password123");

        when(userRepository.findByEmail("carlos@test.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", testUser.getPassword())).thenReturn(true);
        when(jwtUtil.generateToken(testUser)).thenReturn("jwt-token-123");

        // ACT
        AuthResponse response = authService.login(request);

        // ASSERT
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("jwt-token-123");
        assertThat(response.getUser().getEmail()).isEqualTo("carlos@test.com");
        assertThat(response.getUser().getRole()).isEqualTo(User.UserRole.usuario);
        verify(userRepository).findByEmail("carlos@test.com");
        verify(passwordEncoder).matches("password123", testUser.getPassword());
    }

    @Test
    @DisplayName("login falla con email inexistente")
    void testLoginEmailInexistente() {
        // ARRANGE
        LoginRequest request = new LoginRequest();
        request.setEmail("noexiste@test.com");
        request.setPassword("cualquiera");

        when(userRepository.findByEmail("noexiste@test.com")).thenReturn(Optional.empty());

        // ACT & ASSERT
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Credenciales invalidas");
    }

    @Test
    @DisplayName("login falla con password incorrecto")
    void testLoginPasswordIncorrecto() {
        // ARRANGE
        LoginRequest request = new LoginRequest();
        request.setEmail("carlos@test.com");
        request.setPassword("wrongpassword");

        when(userRepository.findByEmail("carlos@test.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongpassword", testUser.getPassword())).thenReturn(false);

        // ACT & ASSERT
        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Credenciales invalidas");
    }

    @Test
    @DisplayName("registro exitoso de nuevo usuario")
    void testRegistroExitoso() {
        // ARRANGE
        RegisterRequest request = new RegisterRequest();
        request.setNombre("Ana");
        request.setApellido("Garcia");
        request.setEmail("ana@test.com");
        request.setPassword("secure123");
        request.setRole(User.UserRole.usuario);

        User savedUser = User.builder()
                .id(2)
                .nombre("Ana")
                .apellido("Garcia")
                .email("ana@test.com")
                .password("$2a$hashedpass")
                .role(User.UserRole.usuario)
                .build();

        when(userRepository.existsByEmail("ana@test.com")).thenReturn(false);
        when(passwordEncoder.encode("secure123")).thenReturn("$2a$hashedpass");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtUtil.generateToken(savedUser)).thenReturn("token-new-user");

        // ACT
        AuthResponse response = authService.register(request);

        // ASSERT
        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("token-new-user");
        assertThat(response.getUser().getNombre()).isEqualTo("Ana");
        verify(userRepository).save(any(User.class));
        verify(passwordEncoder).encode("secure123");
    }

    @Test
    @DisplayName("registro falla cuando el email ya existe")
    void testRegistroEmailDuplicado() {
        // ARRANGE
        RegisterRequest request = new RegisterRequest();
        request.setNombre("Luis");
        request.setApellido("Ramirez");
        request.setEmail("carlos@test.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("carlos@test.com")).thenReturn(true);

        // ACT & ASSERT
        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ya esta registrado");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("registro falla con password muy corto")
    void testRegistroPasswordCorto() {
        // ARRANGE
        RegisterRequest request = new RegisterRequest();
        request.setNombre("Pedro");
        request.setApellido("Diaz");
        request.setEmail("pedro@test.com");
        request.setPassword("123");

        when(userRepository.existsByEmail("pedro@test.com")).thenReturn(false);

        // ACT & ASSERT
        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("6 caracteres");
    }
}
