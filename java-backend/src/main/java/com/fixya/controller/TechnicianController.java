package com.fixya.controller;

import com.fixya.dto.ApiResponse;
import com.fixya.service.TechnicianService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador de Tecnicos - Capa Controller (patron MVC)
 * Endpoints publicos y protegidos para gestion de tecnicos
 */
@RestController
@RequestMapping("/api/java/technicians")
public class TechnicianController {

    private static final Logger log = LoggerFactory.getLogger(TechnicianController.class);
    private final TechnicianService technicianService;

    public TechnicianController(TechnicianService technicianService) {
        this.technicianService = technicianService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list(
            @RequestParam(required = false) String q) {
        log.debug("GET /api/java/technicians - q={}", q);
        var data = q != null ? technicianService.search(q) : technicianService.listApproved();
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getById(@PathVariable Integer id) {
        log.debug("GET /api/java/technicians/{}", id);
        return ResponseEntity.ok(ApiResponse.ok(technicianService.getById(id)));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Object>> approve(@PathVariable Integer id) {
        log.info("POST /api/java/technicians/{}/approve", id);
        technicianService.approve(id);
        return ResponseEntity.ok(ApiResponse.ok("Tecnico aprobado", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Object>> reject(@PathVariable Integer id) {
        log.info("POST /api/java/technicians/{}/reject", id);
        technicianService.reject(id);
        return ResponseEntity.ok(ApiResponse.ok("Tecnico rechazado", null));
    }
}
