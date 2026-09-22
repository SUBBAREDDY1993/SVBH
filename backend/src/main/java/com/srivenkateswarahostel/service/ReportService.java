package com.srivenkateswarahostel.service;

import com.srivenkateswarahostel.dto.CollectionReportDto;
import com.srivenkateswarahostel.dto.OccupancyReportDto;
import com.srivenkateswarahostel.dto.RevenueReportDto;
import com.srivenkateswarahostel.dto.RoomDto;
import com.srivenkateswarahostel.model.*;
import com.srivenkateswarahostel.repository.BedRepository;
import com.srivenkateswarahostel.repository.PaymentRepository;
import com.srivenkateswarahostel.repository.RoomRepository;
import com.srivenkateswarahostel.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final BedRepository bedRepository;
    private final RoomRepository roomRepository;
    private final StudentRepository studentRepository;
    private final PaymentRepository paymentRepository;
    private final RoomService roomService;
    private final PaymentService paymentService;

    public OccupancyReportDto getOccupancyReport() {
        int totalBeds = (int) bedRepository.count();
        int occupied = (int) bedRepository.countByStatus(BedStatus.OCCUPIED);
        int available = (int) bedRepository.countByStatus(BedStatus.AVAILABLE);
        int reserved = (int) bedRepository.countByStatus(BedStatus.RESERVED);
        int maintenance = (int) bedRepository.countByStatus(BedStatus.MAINTENANCE);

        double occupancyPercentage = totalBeds > 0
                ? Math.round(((double) occupied / totalBeds) * 1000.0) / 10.0
                : 0.0;

        List<RoomDto> rooms = roomService.getAllRooms(true);

        // Group by floor
        Map<Integer, List<RoomDto>> byFloor = rooms.stream().collect(Collectors.groupingBy(RoomDto::getFloor));
        List<OccupancyReportDto.FloorOccupancy> floorOccupancies = new ArrayList<>();

        for (Map.Entry<Integer, List<RoomDto>> entry : byFloor.entrySet()) {
            int floor = entry.getKey();
            List<RoomDto> floorRooms = entry.getValue();
            int fTotal = floorRooms.stream().mapToInt(RoomDto::getTotalBeds).sum();
            int fOccupied = floorRooms.stream().mapToInt(RoomDto::getOccupiedBeds).sum();
            int fAvailable = floorRooms.stream().mapToInt(RoomDto::getAvailableBeds).sum();
            double fPct = fTotal > 0 ? Math.round(((double) fOccupied / fTotal) * 1000.0) / 10.0 : 0.0;

            floorOccupancies.add(OccupancyReportDto.FloorOccupancy.builder()
                    .floor(floor)
                    .totalBeds(fTotal)
                    .occupiedBeds(fOccupied)
                    .availableBeds(fAvailable)
                    .occupancyPercentage(fPct)
                    .build());
        }

        floorOccupancies.sort(Comparator.comparingInt(OccupancyReportDto.FloorOccupancy::getFloor));

        return OccupancyReportDto.builder()
                .totalBeds(totalBeds)
                .occupiedBeds(occupied)
                .availableBeds(available)
                .reservedBeds(reserved)
                .maintenanceBeds(maintenance)
                .occupancyPercentage(occupancyPercentage)
                .floorBreakdown(floorOccupancies)
                .roomBreakdown(rooms)
                .build();
    }

    public CollectionReportDto getCollectionReport() {
        List<Payment> allPayments = paymentRepository.findAll();
        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.withDayOfMonth(1);
        LocalDate endOfMonth = today.withDayOfMonth(today.lengthOfMonth());

        double totalCollection = allPayments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.PAID)
                .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0)
                .sum();

        double collectionToday = allPayments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.PAID && today.equals(p.getPaymentDate()))
                .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0)
                .sum();

        double collectionThisMonth = allPayments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.PAID &&
                        p.getPaymentDate() != null &&
                        !p.getPaymentDate().isBefore(startOfMonth) &&
                        !p.getPaymentDate().isAfter(endOfMonth))
                .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0.0)
                .sum();

        var overdueList = paymentService.getOverduePayments();
        double totalOverdue = overdueList.stream()
                .mapToDouble(d -> d.getMonthlyRent() != null ? d.getMonthlyRent() : 0.0)
                .sum();

        Map<PaymentMethod, Double> byMethod = allPayments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentStatus.PAID)
                .collect(Collectors.groupingBy(
                        Payment::getPaymentMethod,
                        Collectors.summingDouble(Payment::getAmount)
                ));

        return CollectionReportDto.builder()
                .totalCollection(totalCollection)
                .totalPending(totalOverdue)
                .totalOverdue(totalOverdue)
                .collectionToday(collectionToday)
                .collectionThisMonth(collectionThisMonth)
                .collectionByMethod(byMethod)
                .build();
    }

    public RevenueReportDto getRevenueReport(Integer year) {
        int targetYear = (year != null && year > 2000) ? year : LocalDate.now().getYear();
        LocalDate startOfYear = LocalDate.of(targetYear, 1, 1);
        LocalDate endOfYear = LocalDate.of(targetYear, 12, 31);

        List<Payment> yearPayments = paymentRepository.findPaidPaymentsBetweenDates(startOfYear, endOfYear);

        Map<Month, List<Payment>> byMonth = yearPayments.stream()
                .filter(p -> p.getPaymentDate() != null)
                .collect(Collectors.groupingBy(p -> p.getPaymentDate().getMonth()));

        List<RevenueReportDto.MonthlyRevenue> monthlyRevenues = new ArrayList<>();
        double totalYearRevenue = 0.0;

        for (Month month : Month.values()) {
            List<Payment> monthList = byMonth.getOrDefault(month, Collections.emptyList());
            double monthSum = monthList.stream().mapToDouble(Payment::getAmount).sum();
            totalYearRevenue += monthSum;

            monthlyRevenues.add(RevenueReportDto.MonthlyRevenue.builder()
                    .month(month.getDisplayName(TextStyle.FULL, Locale.ENGLISH))
                    .year(targetYear)
                    .amount(monthSum)
                    .transactionCount(monthList.size())
                    .build());
        }

        return RevenueReportDto.builder()
                .totalRevenueYear(totalYearRevenue)
                .monthlyRevenues(monthlyRevenues)
                .build();
    }

    public String generateStudentsCsv() {
        List<Student> students = studentRepository.findAll();
        StringBuilder csv = new StringBuilder();
        csv.append("Student ID,Full Name,Mobile,Email,Room,Bed,Rent,Joining Date,Status\n");
        for (Student s : students) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%.2f,\"%s\",\"%s\"\n",
                    s.getStudentId(),
                    s.getFullName(),
                    s.getMobileNumber() != null ? s.getMobileNumber() : "",
                    s.getEmail() != null ? s.getEmail() : "",
                    s.getRoomNumber() != null ? s.getRoomNumber() : "",
                    s.getBedId() != null ? s.getBedId() : "",
                    s.getMonthlyRent() != null ? s.getMonthlyRent() : 0.0,
                    s.getJoiningDate() != null ? s.getJoiningDate().toString() : "",
                    s.getStatus() != null ? s.getStatus().name() : ""
            ));
        }
        return csv.toString();
    }

    public String generatePaymentsCsv() {
        List<Payment> payments = paymentRepository.findAllByOrderByPaymentDateDesc();
        StringBuilder csv = new StringBuilder();
        csv.append("Receipt No,Student ID,Student Name,Room,Amount,Date,Method,Type,Status\n");
        for (Payment p : payments) {
            csv.append(String.format("\"%s\",\"%s\",\"%s\",\"%s\",%.2f,\"%s\",\"%s\",\"%s\",\"%s\"\n",
                    p.getReceiptNumber(),
                    p.getStudentId(),
                    p.getStudentName(),
                    p.getRoomNumber() != null ? p.getRoomNumber() : "",
                    p.getAmount(),
                    p.getPaymentDate() != null ? p.getPaymentDate().toString() : "",
                    p.getPaymentMethod(),
                    p.getPaymentType(),
                    p.getPaymentStatus()
            ));
        }
        return csv.toString();
    }
}
