package com.srivenkateswarahostel.repository;

import com.srivenkateswarahostel.model.Expense;
import com.srivenkateswarahostel.model.ExpenseCategory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends MongoRepository<Expense, String> {

    List<Expense> findAllByOrderByExpenseDateDesc();

    List<Expense> findByExpenseDate(LocalDate date);

    @Query("{ 'expenseDate': { $gte: ?0, $lte: ?1 } }")
    List<Expense> findExpensesBetweenDates(LocalDate startDate, LocalDate endDate);

    List<Expense> findByCategory(ExpenseCategory category);

    @Query("{ 'expenseDate': { $gte: ?0, $lte: ?1 }, 'category': ?2 }")
    List<Expense> findExpensesBetweenDatesAndCategory(LocalDate startDate, LocalDate endDate, ExpenseCategory category);
}
