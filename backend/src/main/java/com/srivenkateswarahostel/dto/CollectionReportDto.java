package com.srivenkateswarahostel.dto;

import com.srivenkateswarahostel.model.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollectionReportDto {
    private Double totalCollection;
    private Double totalPending;
    private Double totalOverdue;
    private Double collectionToday;
    private Double collectionThisMonth;
    private Map<PaymentMethod, Double> collectionByMethod;
}
