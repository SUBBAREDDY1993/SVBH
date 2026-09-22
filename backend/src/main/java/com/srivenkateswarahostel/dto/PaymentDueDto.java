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
public class PaymentDueDto {
    private String studentId;
    private String studentName;
    private String mobileNumber;
    private String roomNumber;
    private String bedId;
    private int bedNumber;
    private Double monthlyRent;
    private LocalDate nextPaymentDueDate;
    private LocalDate lastPaymentDate;
    private boolean overdue;
    private long daysOverdue;
    private String dueCategory; // DUE_TODAY, DUE_SOON, OVERDUE
}
