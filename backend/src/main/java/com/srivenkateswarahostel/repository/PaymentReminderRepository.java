package com.srivenkateswarahostel.repository;

import com.srivenkateswarahostel.model.PaymentReminderLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PaymentReminderRepository extends MongoRepository<PaymentReminderLog, String> {

    boolean existsByStudentIdAndReminderDateAndReminderSlot(String studentId, LocalDate reminderDate, String reminderSlot);

    List<PaymentReminderLog> findByReminderDateOrderBySentAtDesc(LocalDate reminderDate);

    List<PaymentReminderLog> findByStudentIdOrderBySentAtDesc(String studentId);

    List<PaymentReminderLog> findTop50ByOrderBySentAtDesc();
}
