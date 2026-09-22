package com.srivenkateswarahostel.repository;

import com.srivenkateswarahostel.model.Payment;
import com.srivenkateswarahostel.model.PaymentStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends MongoRepository<Payment, String> {
    Optional<Payment> findByReceiptNumber(String receiptNumber);
    List<Payment> findByStudentIdOrderByPaymentDateDesc(String studentId);
    List<Payment> findAllByOrderByPaymentDateDesc();
    List<Payment> findByPaymentStatus(PaymentStatus status);
    List<Payment> findByPaymentDate(LocalDate date);

    @Query("{ 'paymentDate': { $gte: ?0, $lte: ?1 } }")
    List<Payment> findPaymentsBetweenDates(LocalDate startDate, LocalDate endDate);

    @Query("{ 'paymentDate': { $gte: ?0, $lte: ?1 }, 'paymentStatus': 'PAID' }")
    List<Payment> findPaidPaymentsBetweenDates(LocalDate startDate, LocalDate endDate);
}
