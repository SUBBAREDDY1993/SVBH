package com.srivenkateswarahostel.repository;

import com.srivenkateswarahostel.model.PaymentReminderLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentReminderRepository extends MongoRepository<PaymentReminderLog, String> {

    boolean existsByStudentIdAndReminderDateAndReminderSlot(String studentId, LocalDate reminderDate, String reminderSlot);

    List<PaymentReminderLog> findByReminderDateOrderBySentAtDesc(LocalDate reminderDate);

    List<PaymentReminderLog> findByReminderDateAndReminderSlotOrderBySentAtDesc(LocalDate reminderDate, String reminderSlot);

    void deleteByReminderDateAndReminderSlot(LocalDate reminderDate, String reminderSlot);

    void deleteByReminderDate(LocalDate reminderDate);

    List<PaymentReminderLog> findByStudentIdOrderBySentAtDesc(String studentId);

    Optional<PaymentReminderLog> findTopByStudentIdOrderBySentAtDesc(String studentId);

    Optional<PaymentReminderLog> findByWhatsappMessageId(String whatsappMessageId);

    List<PaymentReminderLog> findByStudentIdAndReminderDate(String studentId, LocalDate reminderDate);

    List<PaymentReminderLog> findByStatus(String status);

    List<PaymentReminderLog> findTop50ByOrderBySentAtDesc();

    List<PaymentReminderLog> findByReplyTextIsNotNullOrderByReplyReceivedAtDesc();
}
