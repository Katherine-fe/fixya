package com.fixya.repository;

import com.fixya.entity.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * DAO - Patron de acceso a datos para Servicio
 */
@Repository
public interface ServiceRepository extends JpaRepository<Service, Integer> {

    List<Service> findByCategoria(String categoria);
}
