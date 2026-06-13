package com.fixya.service;

import com.fixya.entity.Technician;
import com.fixya.entity.User;
import com.fixya.repository.ReviewRepository;
import com.fixya.repository.TechnicianRepository;
import com.fixya.repository.UserRepository;
import com.google.common.collect.ImmutableList;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Servicio de Tecnicos - Capa de Negocio (patron MVC)
 * SOLID: SRP - solo gestiona tecnicos
 * Usa: Google Guava (ImmutableList), Apache Commons Lang3, Logback
 */
@Service
public class TechnicianService {

    private static final Logger log = LoggerFactory.getLogger(TechnicianService.class);

    private final TechnicianRepository technicianRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;

    public TechnicianService(TechnicianRepository technicianRepository,
                              UserRepository userRepository,
                              ReviewRepository reviewRepository) {
        this.technicianRepository = technicianRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
    }

    /**
     * Lista todos los tecnicos aprobados
     * Retorna ImmutableList de Guava para garantizar inmutabilidad
     */
    public ImmutableList<Map<String, Object>> listApproved() {
        List<Technician> tecnicos = technicianRepository.findByStatus(Technician.TechnicianStatus.aprobado);
        log.debug("Listando {} tecnicos aprobados", tecnicos.size());

        return ImmutableList.copyOf(
                tecnicos.stream()
                        .map(this::toDetailMap)
                        .toList()
        );
    }

    /**
     * Busca tecnicos por especialidad o zona (usa Commons Lang3 para normalizar query)
     */
    public List<Map<String, Object>> search(String query) {
        String normalizedQuery = StringUtils.trimToEmpty(query);
        if (StringUtils.isBlank(normalizedQuery)) {
            return listApproved();
        }
        log.debug("Buscando tecnicos con query: '{}'", normalizedQuery);
        return technicianRepository.searchApproved(normalizedQuery)
                .stream()
                .map(this::toDetailMap)
                .toList();
    }

    /**
     * Obtiene perfil completo de un tecnico por ID
     */
    public Map<String, Object> getById(Integer id) {
        Technician tech = technicianRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Tecnico no encontrado: " + id));
        return toDetailMap(tech);
    }

    /**
     * Aprueba un tecnico (solo admin)
     */
    public Technician approve(Integer id) {
        Technician tech = technicianRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Tecnico no encontrado: " + id));
        tech.setStatus(Technician.TechnicianStatus.aprobado);
        Technician saved = technicianRepository.save(tech);
        log.info("Tecnico {} aprobado", id);
        return saved;
    }

    /**
     * Rechaza un tecnico (solo admin)
     */
    public Technician reject(Integer id) {
        Technician tech = technicianRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Tecnico no encontrado: " + id));
        tech.setStatus(Technician.TechnicianStatus.rechazado);
        Technician saved = technicianRepository.save(tech);
        log.info("Tecnico {} rechazado", id);
        return saved;
    }

    private Map<String, Object> toDetailMap(Technician tech) {
        User user = userRepository.findById(tech.getUserId()).orElse(null);
        String nombre = user != null ? user.getNombre() + " " + user.getApellido() : "Desconocido";
        String email = user != null ? user.getEmail() : "";
        String avatarUrl = user != null ? user.getAvatarUrl() : null;

        return Map.of(
                "id", tech.getId(),
                "userId", tech.getUserId(),
                "nombre", nombre,
                "email", email,
                "avatarUrl", avatarUrl != null ? avatarUrl : "",
                "especialidad", StringUtils.defaultString(tech.getEspecialidad()),
                "descripcion", StringUtils.defaultString(tech.getDescripcion()),
                "precioBase", tech.getPrecioBase(),
                "precioHora", tech.getPrecioHora(),
                "status", tech.getStatus().name()
        );
    }
}
