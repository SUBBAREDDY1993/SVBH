package com.srivenkateswarahostel.dto;

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
public class VacateStudentRequest {

    @NotNull(message = "Vacating date is required")
    private LocalDate vacateDate;

    private String reason;
    private Double refundAmount;
    private Double finalPayment;
    private String remarks;
}
