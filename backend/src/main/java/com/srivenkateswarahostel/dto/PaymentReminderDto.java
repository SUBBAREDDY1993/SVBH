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
    private String reminderSlot;
    private LocalDate reminderDate;
    private LocalDateTime sentAt;
    private String channel;
    private String message;
    private String status;
    private String whatsappUrl;
}
