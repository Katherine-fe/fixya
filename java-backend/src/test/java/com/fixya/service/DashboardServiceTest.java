package com.fixya.service;

import com.fixya.entity.ServiceRequest;
import com.fixya.entity.Technician;
import com.fixya.repository.PaymentRepository;
import com.fixya.repository.ServiceRequestRepository;
import com.fixya.repository.TechnicianRepository;
import com.fixya.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Tests TDD para DashboardService
 * Verifica calculo de estadisticas y comportamiento del cache Guava
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardService - Tests de Estadisticas Admin")
class DashboardServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private TechnicianRepository technicianRepository;
    @Mock private ServiceRequestRepository requestRepository;
    @Mock private PaymentRepository paymentRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    @DisplayName("getAdminStats retorna mapa con todas las metricas")
    void testGetAdminStats() {
        // ARRANGE
        when(userRepository.count()).thenReturn(50L);
        when(technicianRepository.count()).thenReturn(20L);
        when(technicianRepository.countByStatus(Technician.TechnicianStatus.pendiente)).thenReturn(3L);
        when(requestRepository.count()).thenReturn(100L);
        when(requestRepository.countByStatus(ServiceRequest.RequestStatus.completado)).thenReturn(75L);
        when(requestRepository.countByStatus(ServiceRequest.RequestStatus.pendiente)).thenReturn(10L);
        when(paymentRepository.sumTotalRevenue()).thenReturn(new BigDecimal("15000.00"));
        when(paymentRepository.count()).thenReturn(75L);

        // ACT
        Map<String, Object> stats = dashboardService.getAdminStats();

        // ASSERT
        assertThat(stats).isNotNull();
        assertThat(stats.get("totalUsuarios")).isEqualTo(50L);
        assertThat(stats.get("totalTecnicos")).isEqualTo(20L);
        assertThat(stats.get("tecnicosPendientes")).isEqualTo(3L);
        assertThat(stats.get("totalSolicitudes")).isEqualTo(100L);
        assertThat(stats.get("ingresoTotal")).isEqualTo(new BigDecimal("15000.00"));
    }

    @Test
    @DisplayName("getAdminStats usa cache en segunda llamada (Guava Cache)")
    void testGetAdminStatsCache() {
        // ARRANGE
        when(userRepository.count()).thenReturn(50L);
        when(technicianRepository.count()).thenReturn(20L);
        when(technicianRepository.countByStatus(any())).thenReturn(3L);
        when(requestRepository.count()).thenReturn(100L);
        when(requestRepository.countByStatus(any())).thenReturn(75L);
        when(paymentRepository.sumTotalRevenue()).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.count()).thenReturn(0L);

        // ACT - llamar dos veces
        dashboardService.getAdminStats();
        dashboardService.getAdminStats();

        // ASSERT - los repositorios solo se llaman una vez gracias al cache Guava
        verify(userRepository, times(1)).count();
        verify(technicianRepository, times(1)).count();
    }

    @Test
    @DisplayName("invalidateCache fuerza recalculo en siguiente llamada")
    void testInvalidateCache() {
        // ARRANGE
        when(userRepository.count()).thenReturn(50L, 51L);
        when(technicianRepository.count()).thenReturn(20L);
        when(technicianRepository.countByStatus(any())).thenReturn(0L);
        when(requestRepository.count()).thenReturn(100L);
        when(requestRepository.countByStatus(any())).thenReturn(0L);
        when(paymentRepository.sumTotalRevenue()).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.count()).thenReturn(0L);

        // ACT
        dashboardService.getAdminStats();
        dashboardService.invalidateCache();
        Map<String, Object> stats2 = dashboardService.getAdminStats();

        // ASSERT - tras invalidar, vuelve a consultar BD
        verify(userRepository, times(2)).count();
        assertThat(stats2.get("totalUsuarios")).isEqualTo(51L);
    }
}
