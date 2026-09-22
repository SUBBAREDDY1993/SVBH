package com.srivenkateswarahostel.controller;

import com.srivenkateswarahostel.dto.ApiResponse;
import com.srivenkateswarahostel.dto.PaymentDueDto;
import com.srivenkateswarahostel.dto.PaymentRequest;
import com.srivenkateswarahostel.dto.PaymentResponseDto;
import com.srivenkateswarahostel.model.PaymentStatus;
import com.srivenkateswarahostel.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Fee Collection, Receipts, and Due Date Management APIs")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    @Operation(summary = "Get payment transaction history with optional filters")
    public ResponseEntity<ApiResponse<List<PaymentResponseDto>>> getPayments(
            @RequestParam(required = false) String studentId,
            @RequestParam(required = false) PaymentStatus status) {
        List<PaymentResponseDto> payments = paymentService.getPayments(studentId, status);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @GetMapping("/{receiptNumber}")
    @Operation(summary = "Get specific payment receipt details")
    public ResponseEntity<ApiResponse<PaymentResponseDto>> getPaymentByReceipt(
            @PathVariable String receiptNumber) {
        PaymentResponseDto payment = paymentService.getPaymentByReceipt(receiptNumber);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }

    @PostMapping
    @Operation(summary = "Record fee payment and advance student next due date")
    public ResponseEntity<ApiResponse<PaymentResponseDto>> recordPayment(
            @Valid @RequestBody PaymentRequest request) {
        PaymentResponseDto payment = paymentService.recordPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(payment, "Payment recorded successfully. Receipt generated."));
    }

    @GetMapping("/overdue")
    @Operation(summary = "Get all students with overdue payments")
    public ResponseEntity<ApiResponse<List<PaymentDueDto>>> getOverduePayments() {
        List<PaymentDueDto> dues = paymentService.getOverduePayments();
        return ResponseEntity.ok(ApiResponse.success(dues));
    }

    @GetMapping("/due-soon")
    @Operation(summary = "Get students whose rent is due within next 7 days")
    public ResponseEntity<ApiResponse<List<PaymentDueDto>>> getDueSoonPayments() {
        List<PaymentDueDto> dues = paymentService.getDueSoonPayments();
        return ResponseEntity.ok(ApiResponse.success(dues));
    }

    @GetMapping("/due-today")
    @Operation(summary = "Get students whose rent is due today")
    public ResponseEntity<ApiResponse<List<PaymentDueDto>>> getDueTodayPayments() {
        List<PaymentDueDto> dues = paymentService.getDueTodayPayments();
        return ResponseEntity.ok(ApiResponse.success(dues));
    }
}
