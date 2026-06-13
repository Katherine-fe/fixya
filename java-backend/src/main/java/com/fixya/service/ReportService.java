package com.fixya.service;

import com.fixya.entity.Payment;
import com.fixya.entity.Technician;
import com.fixya.entity.User;
import com.fixya.repository.PaymentRepository;
import com.fixya.repository.ServiceRequestRepository;
import com.fixya.repository.TechnicianRepository;
import com.fixya.repository.UserRepository;
import com.google.common.base.Stopwatch;
import org.apache.commons.io.IOUtils;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Servicio de Reportes - Genera archivos Excel con Apache POI
 * SOLID: SRP - solo responsable de generar reportes
 * Usa: Apache POI (XSSFWorkbook), Apache Commons IO, Google Guava (Stopwatch), Logback
 */
@Service
public class ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportService.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
            .withZone(ZoneId.of("America/Lima"));

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final TechnicianRepository technicianRepository;
    private final ServiceRequestRepository requestRepository;

    public ReportService(PaymentRepository paymentRepository,
                         UserRepository userRepository,
                         TechnicianRepository technicianRepository,
                         ServiceRequestRepository requestRepository) {
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.technicianRepository = technicianRepository;
        this.requestRepository = requestRepository;
    }

    /**
     * Genera reporte de pagos en Excel (.xlsx) usando Apache POI
     * @return bytes del archivo Excel
     */
    public byte[] generatePaymentsReport() throws IOException {
        Stopwatch stopwatch = Stopwatch.createStarted(); // Guava Stopwatch
        log.info("Iniciando generacion de reporte de pagos");

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Pagos FixYa");

            // Estilos de celda
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle moneyStyle = createMoneyStyle(workbook);

            // Titulo
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("REPORTE DE PAGOS - FIXYA");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 6));

            // Subtitulo con fecha
            Row subRow = sheet.createRow(1);
            subRow.createCell(0).setCellValue("Generado: " + DATE_FMT.format(java.time.Instant.now()));
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 6));

            // Encabezados
            String[] headers = {"ID", "Fecha", "Cliente", "Metodo", "Monto (S/)", "Estado", "Referencia"};
            Row headerRow = sheet.createRow(3);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Datos
            List<Payment> payments = paymentRepository.findAll();
            int rowNum = 4;
            double totalMonto = 0;

            for (Payment p : payments) {
                Row row = sheet.createRow(rowNum++);
                User user = userRepository.findById(p.getUserId()).orElse(null);
                String clienteNombre = user != null ? user.getNombre() + " " + user.getApellido() : "N/A";

                row.createCell(0).setCellValue(p.getId());
                row.createCell(1).setCellValue(DATE_FMT.format(p.getCreatedAt()));
                row.createCell(2).setCellValue(clienteNombre);
                row.createCell(3).setCellValue(p.getMetodoPago().name().toUpperCase());

                Cell montoCell = row.createCell(4);
                montoCell.setCellValue(p.getMonto().doubleValue());
                montoCell.setCellStyle(moneyStyle);

                row.createCell(5).setCellValue(p.getStatus().name());
                row.createCell(6).setCellValue(p.getReferencia() != null ? p.getReferencia() : "");

                totalMonto += p.getMonto().doubleValue();
            }

            // Fila de totales
            Row totalRow = sheet.createRow(rowNum + 1);
            totalRow.createCell(3).setCellValue("TOTAL:");
            Cell totalCell = totalRow.createCell(4);
            totalCell.setCellValue(totalMonto);
            totalCell.setCellStyle(moneyStyle);

            // Autofit columnas
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            // Serializar a bytes con Apache Commons IO
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            byte[] result = baos.toByteArray();
            IOUtils.closeQuietly(baos);

            log.info("Reporte generado: {} pagos, {} bytes en {}ms",
                    payments.size(), result.length,
                    stopwatch.elapsed(TimeUnit.MILLISECONDS));
            return result;
        }
    }

    /**
     * Genera reporte de tecnicos en Excel
     */
    public byte[] generateTechniciansReport() throws IOException {
        Stopwatch stopwatch = Stopwatch.createStarted();
        log.info("Iniciando generacion de reporte de tecnicos");

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Tecnicos FixYa");
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle titleStyle = createTitleStyle(workbook);

            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("DIRECTORIO DE TECNICOS - FIXYA");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 7));

            String[] headers = {"ID", "Nombre", "Email", "Especialidad", "Estado", "Rating", "Experiencia", "Zona"};
            Row headerRow = sheet.createRow(2);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            List<Technician> tecnicos = technicianRepository.findAll();
            int rowNum = 3;
            for (Technician t : tecnicos) {
                Row row = sheet.createRow(rowNum++);
                User user = userRepository.findById(t.getUserId()).orElse(null);
                String nombre = user != null ? user.getNombre() + " " + user.getApellido() : "N/A";
                String email = user != null ? user.getEmail() : "N/A";

                row.createCell(0).setCellValue(t.getId());
                row.createCell(1).setCellValue(nombre);
                row.createCell(2).setCellValue(email);
                row.createCell(3).setCellValue(t.getEspecialidad());
                row.createCell(4).setCellValue(t.getStatus().name());
                row.createCell(5).setCellValue(t.getRatingPromedio() != null ? t.getRatingPromedio().doubleValue() : 0);
                row.createCell(6).setCellValue(t.getAniosExperiencia() != null ? t.getAniosExperiencia() : 0);
                row.createCell(7).setCellValue(t.getZonaCobertura() != null ? t.getZonaCobertura() : "");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            byte[] result = baos.toByteArray();
            IOUtils.closeQuietly(baos);

            log.info("Reporte tecnicos: {} registros en {}ms", tecnicos.size(), stopwatch.elapsed(TimeUnit.MILLISECONDS));
            return result;
        }
    }

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createMoneyStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        DataFormat format = wb.createDataFormat();
        style.setDataFormat(format.getFormat("S/ #,##0.00"));
        return style;
    }
}
