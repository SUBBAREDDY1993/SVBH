package com.srivenkateswarahostel.controller;

import com.srivenkateswarahostel.dto.ApiResponse;
import com.srivenkateswarahostel.dto.ExpenseDto;
import com.srivenkateswarahostel.dto.ExpenseSummaryDto;
import com.srivenkateswarahostel.dto.ProfitLossReportDto;
import com.srivenkateswarahostel.service.ExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
@Tag(name = "Daily Expenses & Profit", description = "Hostel operational expense logging and profit tracking")
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get list of expenses (optionally filtered by date range)")
    public ResponseEntity<ApiResponse<List<ExpenseDto>>> getExpenses(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<ExpenseDto> list;
        if (startDate != null && endDate != null) {
            list = expenseService.getExpensesByDateRange(startDate, endDate);
        } else {
            list = expenseService.getAllExpenses();
        }
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get expense summary metrics (today, month, year, by category)")
    public ResponseEntity<ApiResponse<ExpenseSummaryDto>> getExpenseSummary() {
        ExpenseSummaryDto summary = expenseService.getExpenseSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/profit-loss")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get monthly Profit & Loss report (Collections vs Expenses vs Net Profit)")
    public ResponseEntity<ApiResponse<ProfitLossReportDto>> getProfitLossReport(
            @RequestParam(required = false) Integer year) {
        ProfitLossReportDto report = expenseService.getProfitLossReport(year);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Record a daily operational expense")
    public ResponseEntity<ApiResponse<ExpenseDto>> createExpense(@Valid @RequestBody ExpenseDto dto) {
        ExpenseDto created = expenseService.createExpense(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Expense recorded successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Update an expense record")
    public ResponseEntity<ApiResponse<ExpenseDto>> updateExpense(
            @PathVariable String id,
            @Valid @RequestBody ExpenseDto dto) {
        ExpenseDto updated = expenseService.updateExpense(id, dto);
        return ResponseEntity.ok(ApiResponse.success(updated, "Expense updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete an expense record")
    public ResponseEntity<ApiResponse<Void>> deleteExpense(@PathVariable String id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Expense deleted successfully"));
    }
}
