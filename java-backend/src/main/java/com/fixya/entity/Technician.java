package com.fixya.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entidad Tecnico - Capa Modelo (patron MVC)
 * Perfil profesional del tecnico con especialidad y tarifas
 */
@Entity
@Table(name = "technicians")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Technician {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "service_id")
    private Integer serviceId;

    @Column(nullable = false)
    private String especialidad;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(name = "precio_base", precision = 10, scale = 2)
    private BigDecimal precioBase;

    @Column(name = "precio_hora", precision = 10, scale = 2)
    private BigDecimal precioHora;

    @Column(name = "anios_experiencia")
    private Integer aniosExperiencia;

    @Column(name = "zona_cobertura")
    private String zonaCobertura;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TechnicianStatus status = TechnicianStatus.pendiente;

    @Column(name = "rating_promedio", precision = 3, scale = 2)
    private BigDecimal ratingPromedio;

    @Column(name = "total_reviews")
    @Builder.Default
    private Integer totalReviews = 0;

    @Column(name = "disponible")
    @Builder.Default
    private Boolean disponible = true;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public enum TechnicianStatus { pendiente, aprobado, rechazado, suspendido }
}
