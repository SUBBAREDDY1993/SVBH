package com.srivenkateswarahostel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderCountsDto {
    private long upcomingFees;
    private long dueToday;
    private long overdue;
    private long paid;
    private long totalActive;
    private boolean whatsAppConfigured;
    private String whatsAppProvider;
}

