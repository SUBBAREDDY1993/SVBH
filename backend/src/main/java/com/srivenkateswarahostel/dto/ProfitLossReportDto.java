package com.srivenkateswarahostel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfitLossReportDto {

    private int year;
    private double totalAnnualRevenue;
    private double totalAnnualExpenses;
    private double netAnnualProfit;
    private double annualProfitMarginPercentage;
    private List<MonthlyProfitLoss> monthlyBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyProfitLoss {
        private String month;
        private int monthNumber;
        private int year;
        private double totalRevenue;
        private double totalExpenses;
        private double netProfit;
        private double profitMarginPercentage;
        private boolean profitable;
    }
}
