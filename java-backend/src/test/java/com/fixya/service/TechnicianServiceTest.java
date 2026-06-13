package com.fixya.service;

import com.fixya.entity.Technician;
import com.fixya.entity.User;
import com.fixya.repository.ReviewRepository;
import com.fixya.repository.TechnicianRepository;
import com.fixya.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests TDD para TechnicianService
 * Verifica listado, busqueda y aprobacion de tecnicos
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TechnicianService - Tests de Gestion de Tecnicos")
class TechnicianServiceTest {

    @Mock private TechnicianRepository technicianRepository;
    @Mock private UserRepository userRepository;
    @Mock private ReviewRepository reviewRepository;

    @InjectMocks
    private TechnicianService technicianService;

    private Technician techAprobado;
    private User userTecnico;

    @BeforeEach
    void setUp() {
        userTecnico = User.builder()
                .id(10)
                .nombre("Mario")
                .apellido("Quispe")
                .email("mario@fixya.com")
                .role(User.UserRole.tecnico)
                .build();

        techAprobado = Technician.builder()
                .id(1)
                .userId(10)
                .especialidad("Electricidad")
                .descripcion("Electricista certificado con 5 anos de experiencia")
                .precioBase(new BigDecimal("80.00"))
                .precioHora(new BigDecimal("45.00"))
                .aniosExperiencia(5)
                .zonaCobertura("Lima Norte")
                .status(Technician.TechnicianStatus.aprobado)
                .disponible(true)
                .build();
    }

    @Test
    @DisplayName("listApproved retorna lista inmutable de tecnicos aprobados")
    void testListApproved() {
        // ARRANGE
        when(technicianRepository.findByStatus(Technician.TechnicianStatus.aprobado))
                .thenReturn(List.of(techAprobado));
        when(userRepository.findById(10)).thenReturn(Optional.of(userTecnico));

        // ACT
        var result = technicianService.listApproved();

        // ASSERT
        assertThat(result).isNotNull().hasSize(1);
        assertThat(result.get(0)).containsKey("especialidad");
        assertThat(result.get(0).get("especialidad")).isEqualTo("Electricidad");
        verify(technicianRepository).findByStatus(Technician.TechnicianStatus.aprobado);
    }

    @Test
    @DisplayName("search con query vacia retorna todos los aprobados")
    void testSearchQueryVacia() {
        // ARRANGE
        when(technicianRepository.findByStatus(Technician.TechnicianStatus.aprobado))
                .thenReturn(List.of(techAprobado));
        when(userRepository.findById(10)).thenReturn(Optional.of(userTecnico));

        // ACT
        var result = technicianService.search("  ");

        // ASSERT
        assertThat(result).hasSize(1);
        verify(technicianRepository).findByStatus(Technician.TechnicianStatus.aprobado);
        verify(technicianRepository, never()).searchApproved(any());
    }

    @Test
    @DisplayName("search con query busca por especialidad")
    void testSearchConQuery() {
        // ARRANGE
        when(technicianRepository.searchApproved("electri")).thenReturn(List.of(techAprobado));
        when(userRepository.findById(10)).thenReturn(Optional.of(userTecnico));

        // ACT
        var result = technicianService.search("electri");

        // ASSERT
        assertThat(result).hasSize(1);
        verify(technicianRepository).searchApproved("electri");
    }

    @Test
    @DisplayName("getById lanza excepcion si tecnico no existe")
    void testGetByIdNoExiste() {
        // ARRANGE
        when(technicianRepository.findById(999)).thenReturn(Optional.empty());

        // ACT & ASSERT
        assertThatThrownBy(() -> technicianService.getById(999))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining("999");
    }

    @Test
    @DisplayName("approve cambia status a aprobado")
    void testApprove() {
        // ARRANGE
        Technician techPendiente = Technician.builder()
                .id(2)
                .userId(10)
                .especialidad("Plomeria")
                .status(Technician.TechnicianStatus.pendiente)
                .build();

        when(technicianRepository.findById(2)).thenReturn(Optional.of(techPendiente));
        when(technicianRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // ACT
        Technician result = technicianService.approve(2);

        // ASSERT
        assertThat(result.getStatus()).isEqualTo(Technician.TechnicianStatus.aprobado);
        verify(technicianRepository).save(techPendiente);
    }

    @Test
    @DisplayName("reject cambia status a rechazado")
    void testReject() {
        // ARRANGE
        Technician techPendiente = Technician.builder()
                .id(3)
                .userId(10)
                .especialidad("Carpinteria")
                .status(Technician.TechnicianStatus.pendiente)
                .build();

        when(technicianRepository.findById(3)).thenReturn(Optional.of(techPendiente));
        when(technicianRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // ACT
        Technician result = technicianService.reject(3);

        // ASSERT
        assertThat(result.getStatus()).isEqualTo(Technician.TechnicianStatus.rechazado);
    }
}
