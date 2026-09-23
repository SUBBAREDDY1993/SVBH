package com.srivenkateswarahostel.dto;

import com.srivenkateswarahostel.model.ExpenseCategory;
import com.srivenkateswarahostel.model.PaymentMethod;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseDto {

    private String id;

    @NotBlank(message = "Expense title is required")
    private String title;

    @NotNull(message = "Expense category is required")
    private ExpenseCategory category;

    @NotNull(message = "Amount is required")
    @Min(value = 1, message = "Amount must be greater than 0")
    private Double amount;

    private LocalDate expenseDate;

    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    private String vendor;

    private String billNumber;

    private String notes;

    private String recordedBy;

    private LocalDateTime createdAt;
}
