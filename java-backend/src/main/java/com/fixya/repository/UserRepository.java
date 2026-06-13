package com.fixya.repository;

import com.fixya.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * DAO - Patron de acceso a datos para Usuario
 * Extiende JpaRepository para operaciones CRUD automaticas (SOLID: SRP)
 */
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
