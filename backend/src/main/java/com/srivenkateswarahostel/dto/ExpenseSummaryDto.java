package com.srivenkateswarahostel.dto;

import com.srivenkateswarahostel.model.ExpenseCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseSummaryDto {

    private double totalExpensesMonth;
    private double expensesToday;
    private double totalExpensesYear;
    private int expenseCountMonth;
    private Map<ExpenseCategory, Double> expensesByCategory;
}
