package com.srivenkateswarahostel.controller;

import com.srivenkateswarahostel.dto.ApiResponse;
import com.srivenkateswarahostel.dto.CollectionReportDto;
import com.srivenkateswarahostel.dto.OccupancyReportDto;
import com.srivenkateswarahostel.dto.RevenueReportDto;
import com.srivenkateswarahostel.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reports", description = "Occupancy, Revenue, and Export Reports")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/occupancy")
    @Operation(summary = "Get detailed bed and floor occupancy report")
    public ResponseEntity<ApiResponse<OccupancyReportDto>> getOccupancyReport() {
        log.debug("REST: Generating occupancy report");
        OccupancyReportDto report = reportService.getOccupancyReport();
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/collection")
    @Operation(summary = "Get payment collection metrics by date range and payment method")
    public ResponseEntity<ApiResponse<CollectionReportDto>> getCollectionReport() {
        log.debug("REST: Generating collection metrics report");
        CollectionReportDto report = reportService.getCollectionReport();
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/revenue")
    @Operation(summary = "Get month-by-month revenue report for a given year")
    public ResponseEntity<ApiResponse<RevenueReportDto>> getRevenueReport(
            @RequestParam(required = false) Integer year) {
        log.debug("REST: Generating revenue report for year: {}", year);
        RevenueReportDto report = reportService.getRevenueReport(year);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/export/students-csv")
    @Operation(summary = "Export all student records to CSV")
    public ResponseEntity<String> exportStudentsCsv() {
        log.info("REST: Exporting students dataset to CSV");
        String csv = reportService.generateStudentsCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=students_export.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/export/payments-csv")
    @Operation(summary = "Export all payment transaction records to CSV")
    public ResponseEntity<String> exportPaymentsCsv() {
        log.info("REST: Exporting payments dataset to CSV");
        String csv = reportService.generatePaymentsCsv();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payments_export.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
