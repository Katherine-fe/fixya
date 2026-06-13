package com.fixya.repository;

import com.fixya.entity.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * DAO - Patron de acceso a datos para SolicitudServicio
 */
@Repository
public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Integer> {

    List<ServiceRequest> findByUserIdOrderByCreatedAtDesc(Integer userId);

    List<ServiceRequest> findByTechnicianIdOrderByCreatedAtDesc(Integer technicianId);

    List<ServiceRequest> findByStatus(ServiceRequest.RequestStatus status);

    long countByStatus(ServiceRequest.RequestStatus status);
}
