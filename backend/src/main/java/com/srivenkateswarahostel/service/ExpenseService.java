package com.srivenkateswarahostel.service;

import com.srivenkateswarahostel.dto.ExpenseDto;
import com.srivenkateswarahostel.dto.ExpenseSummaryDto;
import com.srivenkateswarahostel.dto.ProfitLossReportDto;
import com.srivenkateswarahostel.exception.ResourceNotFoundException;
import com.srivenkateswarahostel.model.Expense;
import com.srivenkateswarahostel.model.ExpenseCategory;
import com.srivenkateswarahostel.model.Payment;
import com.srivenkateswarahostel.repository.ExpenseRepository;
import com.srivenkateswarahostel.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final PaymentRepository paymentRepository;
    private final AuditService auditService;

    @Transactional
    public ExpenseDto createExpense(ExpenseDto dto) {
        LocalDate expenseDate = dto.getExpenseDate() != null ? dto.getExpenseDate() : LocalDate.now();
        String username = getCurrentUsername();

        Expense expense = Expense.builder()
                .title(dto.getTitle())
                .category(dto.getCategory())
                .amount(dto.getAmount())
                .expenseDate(expenseDate)
                .paymentMethod(dto.getPaymentMethod())
                .vendor(dto.getVendor())
                .billNumber(dto.getBillNumber())
                .notes(dto.getNotes())
                .recordedBy(username)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Expense saved = expenseRepository.save(expense);
        auditService.log("CREATE", "EXPENSE", saved.getId(),
                String.format("Recorded expense ₹%.2f for %s (%s)", saved.getAmount(), saved.getTitle(), saved.getCategory()));

        return toDto(saved);
    }

    @Transactional
    public ExpenseDto updateExpense(String id, ExpenseDto dto) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with ID: " + id));

        expense.setTitle(dto.getTitle());
        expense.setCategory(dto.getCategory());
        expense.setAmount(dto.getAmount());
        if (dto.getExpenseDate() != null) {
            expense.setExpenseDate(dto.getExpenseDate());
        }
        if (dto.getPaymentMethod() != null) {
            expense.setPaymentMethod(dto.getPaymentMethod());
        }
        expense.setVendor(dto.getVendor());
        expense.setBillNumber(dto.getBillNumber());
        expense.setNotes(dto.getNotes());
        expense.setUpdatedAt(LocalDateTime.now());

        Expense updated = expenseRepository.save(expense);
        auditService.log("UPDATE", "EXPENSE", updated.getId(),
                String.format("Updated expense ₹%.2f for %s", updated.getAmount(), updated.getTitle()));

        return toDto(updated);
    }

    @Transactional
    public void deleteExpense(String id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with ID: " + id));

        expenseRepository.delete(expense);
        auditService.log("DELETE", "EXPENSE", id,
                String.format("Deleted expense ₹%.2f (%s)", expense.getAmount(), expense.getTitle()));
    }

    public List<ExpenseDto> getAllExpenses() {
        return expenseRepository.findAllByOrderByExpenseDateDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<ExpenseDto> getExpensesByDateRange(LocalDate start, LocalDate end) {
        return expenseRepository.findExpensesBetweenDates(start, end).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public ExpenseSummaryDto getExpenseSummary() {
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());
        LocalDate startOfYear = LocalDate.of(today.getYear(), 1, 1);
        LocalDate endOfYear = LocalDate.of(today.getYear(), 12, 31);

        List<Expense> monthExpenses = expenseRepository.findExpensesBetweenDates(startOfMonth, endOfMonth);
        List<Expense> yearExpenses = expenseRepository.findExpensesBetweenDates(startOfYear, endOfYear);
        List<Expense> todayExpenses = expenseRepository.findByExpenseDate(today);

        double totalMonth = monthExpenses.stream().mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0).sum();
        double totalToday = todayExpenses.stream().mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0).sum();
        double totalYear = yearExpenses.stream().mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0).sum();

        Map<ExpenseCategory, Double> byCategory = monthExpenses.stream()
                .collect(Collectors.groupingBy(
                        Expense::getCategory,
                        Collectors.summingDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0)
                ));

        return ExpenseSummaryDto.builder()
                .totalExpensesMonth(totalMonth)
                .expensesToday(totalToday)
                .totalExpensesYear(totalYear)
                .expenseCountMonth(monthExpenses.size())
                .expensesByCategory(byCategory)
                .build();
    }

    public ProfitLossReportDto getProfitLossReport(Integer year) {
        int targetYear = (year != null && year > 2000) ? year : LocalDate.now().getYear();
        LocalDate startOfYear = LocalDate.of(targetYear, 1, 1);
        LocalDate endOfYear = LocalDate.of(targetYear, 12, 31);

        // Fetch paid fee payments
        List<Payment> yearPayments = paymentRepository.findPaidPaymentsBetweenDates(startOfYear, endOfYear);
        Map<Month, List<Payment>> paymentsByMonth = yearPayments.stream()
                .filter(p -> p.getPaymentDate() != null)
                .collect(Collectors.groupingBy(p -> p.getPaymentDate().getMonth()));

        // Fetch operational expenses
        List<Expense> yearExpenses = expenseRepository.findExpensesBetweenDates(startOfYear, endOfYear);
        Map<Month, List<Expense>> expensesByMonth = yearExpenses.stream()
                .filter(e -> e.getExpenseDate() != null)
                .collect(Collectors.groupingBy(e -> e.getExpenseDate().getMonth()));

        List<ProfitLossReportDto.MonthlyProfitLoss> monthlyBreakdown = new ArrayList<>();
        double totalAnnualRevenue = 0.0;
        double totalAnnualExpenses = 0.0;

        for (Month month : Month.values()) {
            List<Payment> mPayments = paymentsByMonth.getOrDefault(month, Collections.emptyList());
            List<Expense> mExpenses = expensesByMonth.getOrDefault(month, Collections.emptyList());

            double monthRevenue = mPayments.stream().mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0).sum();
            double monthExpense = mExpenses.stream().mapToDouble(e -> e.getAmount() != null ? e.getAmount() : 0.0).sum();
            double netProfit = monthRevenue - monthExpense;

            double marginPct = monthRevenue > 0
                    ? Math.round((netProfit / monthRevenue) * 1000.0) / 10.0
                    : (monthExpense > 0 ? -100.0 : 0.0);

            totalAnnualRevenue += monthRevenue;
            totalAnnualExpenses += monthExpense;

            monthlyBreakdown.add(ProfitLossReportDto.MonthlyProfitLoss.builder()
                    .month(month.getDisplayName(TextStyle.FULL, Locale.ENGLISH))
                    .monthNumber(month.getValue())
                    .year(targetYear)
                    .totalRevenue(monthRevenue)
                    .totalExpenses(monthExpense)
                    .netProfit(netProfit)
                    .profitMarginPercentage(marginPct)
                    .profitable(netProfit >= 0)
                    .build());
        }

        double netAnnualProfit = totalAnnualRevenue - totalAnnualExpenses;
        double annualMargin = totalAnnualRevenue > 0
                ? Math.round((netAnnualProfit / totalAnnualRevenue) * 1000.0) / 10.0
                : 0.0;

        return ProfitLossReportDto.builder()
                .year(targetYear)
                .totalAnnualRevenue(totalAnnualRevenue)
                .totalAnnualExpenses(totalAnnualExpenses)
                .netAnnualProfit(netAnnualProfit)
                .annualProfitMarginPercentage(annualMargin)
                .monthlyBreakdown(monthlyBreakdown)
                .build();
    }

    public ExpenseDto toDto(Expense entity) {
        return ExpenseDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .category(entity.getCategory())
                .amount(entity.getAmount())
                .expenseDate(entity.getExpenseDate())
                .paymentMethod(entity.getPaymentMethod())
                .vendor(entity.getVendor())
                .billNumber(entity.getBillNumber())
                .notes(entity.getNotes())
                .recordedBy(entity.getRecordedBy())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private String getCurrentUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                return auth.getName();
            }
        } catch (Exception ignored) {
        }
        return "ADMIN";
    }
}
