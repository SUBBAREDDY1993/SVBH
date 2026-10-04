package com.srivenkateswarahostel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentReminderDto {

    private String id;
    private String studentId;
    private String studentName;
    private String mobileNumber;
    private String roomNumber;
    private String bedId;
    private Double amountDue;
    private LocalDate nextPaymentDueDate;
    private long daysUntilDue;
    private String billingMonth;
    private String reminderSlot;
    private LocalDate reminderDate;
    private LocalDateTime sentAt;
    private LocalDateTime lastAttemptAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime readAt;
    private String whatsappMessageId;
    private String lastError;
    private String apiResponse;
    private int attemptCount;
    private String channel;
    private String message;
    private String status; // PENDING, PROCESSING, SENT, FAILED, SKIPPED, DELIVERED, READ
    private String whatsappUrl;
    private String replyText;
    private LocalDateTime replyReceivedAt;
    private String autoReplyText;
    private LocalDateTime autoReplySentAt;
}
