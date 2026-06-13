package com.fixya.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Entidad SolicitudServicio - Pedidos de clientes a tecnicos
 */
@Entity
@Table(name = "service_requests")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "technician_id", nullable = false)
    private Integer technicianId;

    @Column(name = "service_id")
    private Integer serviceId;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    private String direccion;

    @Column(name = "fecha_preferida")
    private Instant fechaPreferida;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RequestStatus status = RequestStatus.pendiente;

    private String notas;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public enum RequestStatus { pendiente, confirmado, en_progreso, completado, cancelado }
}
