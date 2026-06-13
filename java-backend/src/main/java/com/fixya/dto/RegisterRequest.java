package com.fixya.dto;

import com.fixya.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO para registro de nuevo usuario
 */
@Data
public class RegisterRequest {
    @NotBlank private String nombre;
    @NotBlank private String apellido;
    @Email @NotBlank private String email;
    @NotBlank private String password;
    private User.UserRole role = User.UserRole.usuario;
    private String telefono;
}
