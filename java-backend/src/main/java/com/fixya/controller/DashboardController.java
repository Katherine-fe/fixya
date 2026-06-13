package com.fixya.controller;

import com.fixya.dto.ApiResponse;
import com.fixya.service.DashboardService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controlador de Dashboard - estadisticas para el administrador
 */
@RestController
@RequestMapping("/api/java/dashboard")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class DashboardController {

    private static final Logger log = LoggerFactory.getLogger(DashboardController.class);
    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> adminStats() {
        log.debug("GET /api/java/dashboard/admin/stats");
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getAdminStats()));
    }
}
