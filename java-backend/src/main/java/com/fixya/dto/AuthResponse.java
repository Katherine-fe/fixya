package com.fixya.dto;

import com.fixya.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO de respuesta de autenticacion con token JWT
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserDto user;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserDto {
        private Integer id;
        private String nombre;
        private String apellido;
        private String email;
        private User.UserRole role;
        private String avatarUrl;
        private String telefono;
    }
}
