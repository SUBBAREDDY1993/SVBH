package com.srivenkateswarahostel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private int totalBeds;
    private int occupiedBeds;
    private int availableBeds;
    private int reservedBeds;
    private int maintenanceBeds;

    private long totalStudents;
    private long activeStudents;
    private long noticePeriodStudents;
    private long vacatedStudents;

    private Double totalPendingAmount;
    private int paymentsDueSoonCount;
    private int studentsLeavingSoonCount;
    private int overduePaymentsCount;

    private double occupancyPercentage;

    private List<StudentResponseDto> recentAdmissions;
    private List<PaymentResponseDto> recentPayments;
    private List<PaymentDueDto> upcomingDues;
    private List<StudentResponseDto> recentlyVacated;
    private List<String> alerts;
}
