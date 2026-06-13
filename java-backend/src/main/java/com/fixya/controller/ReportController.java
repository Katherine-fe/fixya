package com.fixya.controller;

import com.fixya.service.ReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDate;

/**
 * Controlador de Reportes - Descarga de archivos Excel generados con Apache POI
 * Solo accesible por administradores
 */
@RestController
@RequestMapping("/api/java/reports")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class ReportController {

    private static final Logger log = LoggerFactory.getLogger(ReportController.class);
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/payments")
    public ResponseEntity<byte[]> downloadPaymentsReport() throws IOException {
        log.info("Descargando reporte de pagos");
        byte[] data = reportService.generatePaymentsReport();
        String filename = "fixya-pagos-" + LocalDate.now() + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/technicians")
    public ResponseEntity<byte[]> downloadTechniciansReport() throws IOException {
        log.info("Descargando reporte de tecnicos");
        byte[] data = reportService.generateTechniciansReport();
        String filename = "fixya-tecnicos-" + LocalDate.now() + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }
}
