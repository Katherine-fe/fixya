package com.fixya.service;

import com.fixya.dto.AuthResponse;
import com.fixya.dto.LoginRequest;
import com.fixya.dto.RegisterRequest;
import com.fixya.entity.User;
import com.fixya.repository.UserRepository;
import com.fixya.security.JwtUtil;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.google.common.base.Preconditions;

/**
 * Servicio de Autenticacion - Capa de Negocio (patron MVC)
 * SOLID: SRP - solo maneja autenticacion y registro
 * Usa: Apache Commons Lang3 (StringUtils), Google Guava (Preconditions), Logback
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Autentica usuario con email y password
     * @throws IllegalArgumentException si credenciales invalidas
     */
    public AuthResponse login(LoginRequest request) {
        // Guava Preconditions para validacion rapida
        Preconditions.checkArgument(StringUtils.isNotBlank(request.getEmail()), "Email requerido");
        Preconditions.checkArgument(StringUtils.isNotBlank(request.getPassword()), "Password requerido");

        String emailNorm = StringUtils.trimToEmpty(request.getEmail()).toLowerCase();
        log.info("Intento de login para: {}", emailNorm);

        User user = userRepository.findByEmail(emailNorm)
                .orElseThrow(() -> new IllegalArgumentException("Credenciales invalidas"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Password incorrecto para usuario: {}", emailNorm);
            throw new IllegalArgumentException("Credenciales invalidas");
        }

        String token = jwtUtil.generateToken(user);
        log.info("Login exitoso para usuario {} con rol {}", user.getId(), user.getRole());

        return buildAuthResponse(token, user);
    }

    /**
     * Registra un nuevo usuario en el sistema
     * @throws IllegalStateException si el email ya existe
     */
    public AuthResponse register(RegisterRequest request) {
        Preconditions.checkArgument(StringUtils.isNotBlank(request.getEmail()), "Email requerido");
        Preconditions.checkArgument(StringUtils.isNotBlank(request.getPassword()), "Password requerido");
        Preconditions.checkArgument(request.getPassword().length() >= 6, "Password debe tener al menos 6 caracteres");

        String emailNorm = StringUtils.trimToEmpty(request.getEmail()).toLowerCase();

        if (userRepository.existsByEmail(emailNorm)) {
            throw new IllegalStateException("El email ya esta registrado");
        }

        User user = User.builder()
                .nombre(StringUtils.capitalize(StringUtils.trimToEmpty(request.getNombre())))
                .apellido(StringUtils.capitalize(StringUtils.trimToEmpty(request.getApellido())))
                .email(emailNorm)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole() : User.UserRole.usuario)
                .telefono(request.getTelefono())
                .build();

        user = userRepository.save(user);
        log.info("Usuario registrado: {} ({})", user.getEmail(), user.getRole());

        String token = jwtUtil.generateToken(user);
        return buildAuthResponse(token, user);
    }

    private AuthResponse buildAuthResponse(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId())
                        .nombre(user.getNombre())
                        .apellido(user.getApellido())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .avatarUrl(user.getAvatarUrl())
                        .telefono(user.getTelefono())
                        .build())
                .build();
    }
}
