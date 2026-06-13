package com.fixya.service;

import com.fixya.entity.ServiceRequest;
import com.fixya.entity.Technician;
import com.fixya.repository.PaymentRepository;
import com.fixya.repository.ServiceRequestRepository;
import com.fixya.repository.TechnicianRepository;
import com.fixya.repository.UserRepository;
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Servicio de Dashboard - estadisticas para el administrador
 * SOLID: SRP - solo computa metricas del dashboard
 * Usa: Google Guava (Cache con TTL), Logback
 */
@Service
public class DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);

    // Cache Guava para evitar recalculos en rafagas de requests (TTL 2 min)
    private final Cache<String, Map<String, Object>> statsCache = CacheBuilder.newBuilder()
            .maximumSize(10)
            .expireAfterWrite(2, TimeUnit.MINUTES)
            .build();

    private final UserRepository userRepository;
    private final TechnicianRepository technicianRepository;
    private final ServiceRequestRepository requestRepository;
    private final PaymentRepository paymentRepository;

    public DashboardService(UserRepository userRepository,
                             TechnicianRepository technicianRepository,
                             ServiceRequestRepository requestRepository,
                             PaymentRepository paymentRepository) {
        this.userRepository = userRepository;
        this.technicianRepository = technicianRepository;
        this.requestRepository = requestRepository;
        this.paymentRepository = paymentRepository;
    }

    /**
     * Estadisticas globales para el administrador (con cache Guava)
     */
    public Map<String, Object> getAdminStats() {
        Map<String, Object> cached = statsCache.getIfPresent("admin_stats");
        if (cached != null) {
            log.debug("Retornando stats desde cache Guava");
            return cached;
        }

        log.info("Calculando estadisticas del dashboard admin");

        long totalUsuarios = userRepository.count();
        long totalTecnicos = technicianRepository.count();
        long tecnicosPendientes = technicianRepository.countByStatus(Technician.TechnicianStatus.pendiente);
        long totalSolicitudes = requestRepository.count();
        long solicitudesCompletadas = requestRepository.countByStatus(ServiceRequest.RequestStatus.completado);
        long solicitudesPendientes = requestRepository.countByStatus(ServiceRequest.RequestStatus.pendiente);
        BigDecimal ingresoTotal = paymentRepository.sumTotalRevenue();
        long totalPagos = paymentRepository.count();

        Map<String, Object> stats = Map.of(
                "totalUsuarios", totalUsuarios,
                "totalTecnicos", totalTecnicos,
                "tecnicosPendientes", tecnicosPendientes,
                "totalSolicitudes", totalSolicitudes,
                "solicitudesCompletadas", solicitudesCompletadas,
                "solicitudesPendientes", solicitudesPendientes,
                "ingresoTotal", ingresoTotal,
                "totalPagos", totalPagos
        );

        statsCache.put("admin_stats", stats);
        return stats;
    }

    /**
     * Invalida el cache cuando hay cambios de estado
     */
    public void invalidateCache() {
        statsCache.invalidateAll();
        log.debug("Cache de stats invalidado");
    }
}
