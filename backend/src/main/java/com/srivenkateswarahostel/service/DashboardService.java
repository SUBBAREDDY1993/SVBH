package com.srivenkateswarahostel.service;

import com.srivenkateswarahostel.dto.DashboardStatsDto;
import com.srivenkateswarahostel.dto.PaymentDueDto;
import com.srivenkateswarahostel.dto.PaymentResponseDto;
import com.srivenkateswarahostel.dto.StudentResponseDto;
import com.srivenkateswarahostel.model.BedStatus;
import com.srivenkateswarahostel.model.Payment;
import com.srivenkateswarahostel.model.Student;
import com.srivenkateswarahostel.model.StudentStatus;
import com.srivenkateswarahostel.repository.BedRepository;
import com.srivenkateswarahostel.repository.PaymentRepository;
import com.srivenkateswarahostel.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final BedRepository bedRepository;
    private final StudentRepository studentRepository;
    private final PaymentRepository paymentRepository;
    private final StudentService studentService;
    private final PaymentService paymentService;

    public DashboardStatsDto getDashboardStats() {
        int totalBeds = (int) bedRepository.count();
        int occupiedBeds = (int) bedRepository.countByStatus(BedStatus.OCCUPIED);
        int availableBeds = (int) bedRepository.countByStatus(BedStatus.AVAILABLE);
        int reservedBeds = (int) bedRepository.countByStatus(BedStatus.RESERVED);
        int maintenanceBeds = (int) bedRepository.countByStatus(BedStatus.MAINTENANCE);

        long activeStudents = studentRepository.countByStatus(StudentStatus.ACTIVE);
        long noticeStudents = studentRepository.countByStatus(StudentStatus.NOTICE_PERIOD);
        long vacatedStudents = studentRepository.countByStatus(StudentStatus.VACATED);
        long totalCurrentStudents = activeStudents + noticeStudents;

        double occupancyPercentage = totalBeds > 0
                ? Math.round(((double) occupiedBeds / totalBeds) * 1000.0) / 10.0
                : 0.0;

        // Payment dues
        List<PaymentDueDto> overdueList = paymentService.getOverduePayments();
        List<PaymentDueDto> dueSoonList = paymentService.getDueSoonPayments();
        List<PaymentDueDto> dueTodayList = paymentService.getDueTodayPayments();

        double pendingTotal = overdueList.stream()
                .mapToDouble(d -> d.getMonthlyRent() != null ? d.getMonthlyRent() : 0.0)
                .sum();

        // Students leaving soon (within next 14 days)
        LocalDate today = LocalDate.now();
        List<Student> leavingSoon = studentRepository.findStudentsLeavingSoon(today, today.plusDays(14));

        // Recent admissions
        List<StudentResponseDto> recentAdmissions = studentRepository.findByStatusOrderByFullNameAsc(StudentStatus.ACTIVE)
                .stream()
                .limit(5)
                .map(studentService::toStudentResponseDto)
                .collect(Collectors.toList());

        // Recent payments
        List<PaymentResponseDto> recentPayments = paymentRepository.findAllByOrderByPaymentDateDesc()
                .stream()
                .limit(5)
                .map(paymentService::toPaymentResponseDto)
                .collect(Collectors.toList());

        // Upcoming dues combined
        List<PaymentDueDto> upcomingDues = new ArrayList<>();
        upcomingDues.addAll(dueTodayList);
        upcomingDues.addAll(dueSoonList);

        // Recently vacated students
        List<StudentResponseDto> recentlyVacated = studentRepository.findByStatusOrderByFullNameAsc(StudentStatus.VACATED)
                .stream()
                .limit(5)
                .map(studentService::toStudentResponseDto)
                .collect(Collectors.toList());

        // Build notifications / alerts
        List<String> alerts = new ArrayList<>();
        if (!overdueList.isEmpty()) {
            alerts.add(String.format("%d student(s) have overdue payments totaling ₹%.0f", overdueList.size(), pendingTotal));
        }
        if (!dueTodayList.isEmpty()) {
            alerts.add(String.format("%d payment(s) are due today", dueTodayList.size()));
        }
        if (!leavingSoon.isEmpty()) {
            alerts.add(String.format("%d student(s) are vacating within the next 14 days", leavingSoon.size()));
        }
        if (availableBeds <= 5) {
            alerts.add(String.format("High Occupancy Notice: Only %d bed(s) currently available!", availableBeds));
        }

        return DashboardStatsDto.builder()
                .totalBeds(totalBeds)
                .occupiedBeds(occupiedBeds)
                .availableBeds(availableBeds)
                .reservedBeds(reservedBeds)
                .maintenanceBeds(maintenanceBeds)
                .totalStudents(totalCurrentStudents)
                .activeStudents(activeStudents)
                .noticePeriodStudents(noticeStudents)
                .vacatedStudents(vacatedStudents)
                .totalPendingAmount(pendingTotal)
                .paymentsDueSoonCount(dueSoonList.size() + dueTodayList.size())
                .studentsLeavingSoonCount(leavingSoon.size())
                .overduePaymentsCount(overdueList.size())
                .occupancyPercentage(occupancyPercentage)
                .recentAdmissions(recentAdmissions)
                .recentPayments(recentPayments)
                .upcomingDues(upcomingDues)
                .recentlyVacated(recentlyVacated)
                .alerts(alerts)
                .build();
    }
}
