package com.fixya.repository;

import com.fixya.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * DAO - Patron de acceso a datos para Resena
 */
@Repository
public interface ReviewRepository extends JpaRepository<Review, Integer> {

    List<Review> findByTechnicianIdOrderByCreatedAtDesc(Integer technicianId);

    Optional<Review> findByRequestId(Integer requestId);

    @Query("SELECT AVG(r.calificacion) FROM Review r WHERE r.technicianId = :techId")
    Double avgCalificacionByTechnicianId(@Param("techId") Integer techId);
}
