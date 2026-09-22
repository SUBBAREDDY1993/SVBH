package com.srivenkateswarahostel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VacateInfo {
    private LocalDate vacateDate;
    private String reason;
    private Double refundAmount;
    private Double finalPayment;
    private String remarks;
}
