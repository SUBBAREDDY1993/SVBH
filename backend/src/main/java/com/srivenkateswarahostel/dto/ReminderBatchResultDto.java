package com.srivenkateswarahostel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderBatchResultDto {

    private String slot; // "MORNING", "EVENING", "MANUAL"
    private LocalDate date;
    private int totalEligibleStudents;
    private int remindersSent;
    private int alreadyRemindedCount;
    private String message;
    private List<PaymentReminderDto> reminders;
}
