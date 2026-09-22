package com.srivenkateswarahostel.dto;

import com.srivenkateswarahostel.model.PaymentMethod;
import com.srivenkateswarahostel.model.PaymentType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {

    @NotBlank(message = "Student ID is required")
    private String studentId;

    @NotNull(message = "Payment amount is required")
    @Min(value = 1, message = "Payment amount must be greater than 0")
    private Double amount;

    @Builder.Default
    private LocalDate paymentDate = LocalDate.now();

    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @Builder.Default
    private PaymentType paymentType = PaymentType.MONTHLY_RENT;

    private String transactionReference;
    private String rentForMonth; // e.g. "October 2026"
    private String remarks;
}
