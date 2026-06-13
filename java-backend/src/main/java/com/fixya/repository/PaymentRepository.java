package com.fixya.repository;

import com.fixya.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * DAO - Patron de acceso a datos para Pago
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    Optional<Payment> findByRequestId(Integer requestId);

    List<Payment> findByUserIdOrderByCreatedAtDesc(Integer userId);

    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Payment p WHERE p.userId = :userId AND p.status = 'completado'")
    BigDecimal sumMontoByUserId(@Param("userId") Integer userId);

    @Query("SELECT COALESCE(SUM(p.monto), 0) FROM Payment p WHERE p.status = 'completado'")
    BigDecimal sumTotalRevenue();

    long countByStatus(Payment.PaymentStatus status);
}
