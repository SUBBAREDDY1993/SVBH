package com.srivenkateswarahostel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeeReminderDto {
    private String studentId;
    private String studentName;
    private String roomNumber;
    private int bedNumber;
    private String bedId;
    private String mobileNumber;
    private Double feeAmount;
    private LocalDate dueDate;
    private String dueDateFormatted;
    private long daysRemaining;
    private String status;         // UPCOMING, REMINDER, URGENT, DUE_TODAY, OVERDUE
    private String statusLabel;    // "Due in 2 days", "Due today", "Overdue by 3 days"
    private String urgency;        // NORMAL, MEDIUM, URGENT, CRITICAL
    private String paymentStatus;  // PENDING, HALF_PAID, PAID
    private String message;        // e.g. "Fee payment is due in 2 days"
    private String reminderText;   // e.g. "Fee payment reminder: Ravi Kumar's hostel fee of ₹5,000 is due on 05-Oct-2026."
    private String whatsappUrl;    // Direct prefilled WhatsApp link
}
