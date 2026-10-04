package com.srivenkateswarahostel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "payment_reminders")
@CompoundIndex(name = "student_date_slot_idx", def = "{'studentId': 1, 'reminderDate': 1, 'reminderSlot': 1}")
public class PaymentReminderLog {

    @Id
    private String id;

    @Indexed
    private String studentId;

    private String studentName;

    private String mobileNumber;

    private String roomNumber;

    private String bedId;

    private Double amountDue;

    private LocalDate nextPaymentDueDate;

    private long daysUntilDue;

    private String billingMonth; // e.g. "October 2026"

    private String feeId;

    private String reminderType; // "DUE_DATE", "OVERDUE", "UPCOMING", "MANUAL"

    private String reminderSlot; // "MORNING", "EVENING", "NIGHT", "MANUAL"

    @Indexed
    private LocalDate reminderDate;

    @CreatedDate
    @Indexed
    private LocalDateTime sentAt;

    private LocalDateTime lastAttemptAt;

    private LocalDateTime deliveredAt;

    private LocalDateTime readAt;

    @Indexed
    private String whatsappMessageId; // Meta wamid

    private String lastError;

    private String apiResponse;

    @Builder.Default
    private int attemptCount = 0;

    private String channel; // "WHATSAPP_CLOUD_API", "WHATSAPP", "SMS", "EMAIL"

    private String message;

    @Builder.Default
    private String status = "PENDING"; // PENDING, PROCESSING, SENT, FAILED, SKIPPED, DELIVERED, READ

    private String replyText;

    private LocalDateTime replyReceivedAt;

    private String autoReplyText;

    private LocalDateTime autoReplySentAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
