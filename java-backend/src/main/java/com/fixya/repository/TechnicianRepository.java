package com.fixya.repository;

import com.fixya.entity.Technician;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * DAO - Patron de acceso a datos para Tecnico
 */
@Repository
public interface TechnicianRepository extends JpaRepository<Technician, Integer> {

    Optional<Technician> findByUserId(Integer userId);

    List<Technician> findByStatus(Technician.TechnicianStatus status);

    List<Technician> findByStatusAndDisponible(Technician.TechnicianStatus status, Boolean disponible);

    @Query("SELECT t FROM Technician t WHERE t.status = 'aprobado' AND " +
           "(LOWER(t.especialidad) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(t.zonaCobertura) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Technician> searchApproved(@Param("q") String query);

    long countByStatus(Technician.TechnicianStatus status);
}
