package com.srivenkateswarahostel.service;

import com.srivenkateswarahostel.dto.PaymentDueDto;
import com.srivenkateswarahostel.dto.PaymentRequest;
import com.srivenkateswarahostel.dto.PaymentResponseDto;
import com.srivenkateswarahostel.exception.BadRequestException;
import com.srivenkateswarahostel.exception.ResourceNotFoundException;
import com.srivenkateswarahostel.model.Payment;
import com.srivenkateswarahostel.model.PaymentStatus;
import com.srivenkateswarahostel.model.PaymentType;
import com.srivenkateswarahostel.model.Student;
import com.srivenkateswarahostel.model.StudentStatus;
import com.srivenkateswarahostel.repository.PaymentRepository;
import com.srivenkateswarahostel.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final StudentRepository studentRepository;
    private final StudentService studentService;
    private final AuditService auditService;

    @Transactional
    public PaymentResponseDto recordPayment(PaymentRequest request) {
        log.info("Recording payment of ₹{} for student '{}' (paymentType: {}, method: {})",
                request.getAmount(), request.getStudentId(), request.getPaymentType(), request.getPaymentMethod());

        Student student = studentRepository.findByStudentId(request.getStudentId())
                .or(() -> studentRepository.findById(request.getStudentId()))
                .orElseThrow(() -> {
                    log.error("Payment failed: Student not found with ID '{}'", request.getStudentId());
                    return new ResourceNotFoundException("Student not found: " + request.getStudentId());
                });

        if (request.getAmount() <= 0) {
            log.warn("Payment failed: Invalid non-positive amount ₹{}", request.getAmount());
            throw new BadRequestException("Payment amount must be greater than zero");
        }

        LocalDate paymentDate = request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now();
        String receiptNumber = generateReceiptNumber();

        Payment payment = Payment.builder()
                .receiptNumber(receiptNumber)
                .studentId(student.getStudentId())
                .studentName(student.getFullName())
                .roomNumber(student.getRoomNumber())
                .bedNumber(student.getBedNumber())
                .amount(request.getAmount())
                .paymentDate(paymentDate)
                .paymentMethod(request.getPaymentMethod())
                .paymentType(request.getPaymentType())
                .paymentStatus(PaymentStatus.PAID)
                .transactionReference(request.getTransactionReference())
                .rentForMonth(request.getRentForMonth())
                .remarks(request.getRemarks())
                .recordedBy(getCurrentUsername())
                .previousBalance(0.0)
                .remainingBalance(0.0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Payment savedPayment = paymentRepository.save(payment);
        log.info("Payment saved with receipt '{}' for student '{}'", receiptNumber, student.getFullName());

        // Update student payment dates if it is a monthly rent payment
        if (request.getPaymentType() == PaymentType.MONTHLY_RENT) {
            student.setLastPaymentDate(paymentDate);
            LocalDate currentDue = student.getNextPaymentDueDate();
            LocalDate newDue;
            if (currentDue != null && currentDue.isAfter(paymentDate.minusDays(15))) {
                newDue = currentDue.plusMonths(1);
            } else {
                newDue = paymentDate.plusMonths(1);
            }

            if (student.getPaymentDueDay() > 0 && student.getPaymentDueDay() <= 28) {
                newDue = newDue.withDayOfMonth(student.getPaymentDueDay());
            }
            student.setNextPaymentDueDate(newDue);

            double rentAmount = student.getMonthlyRent() != null ? student.getMonthlyRent() : 0.0;
            if (savedPayment.getAmount() >= rentAmount) {
                student.setPaymentStatus("PAID");
            } else {
                student.setPaymentStatus("HALF_PAID");
            }

            student.setUpdatedAt(LocalDateTime.now());
            studentRepository.save(student);
            log.info("Updated student '{}' paymentStatus to '{}' and nextDueDate to {}",
                    student.getFullName(), student.getPaymentStatus(), newDue);
        }

        auditService.log("PAYMENT", "PAYMENT", savedPayment.getReceiptNumber(),
                "Recorded payment of ₹" + savedPayment.getAmount() + " for " + student.getFullName() + " (Receipt: " + receiptNumber + ")");

        return toPaymentResponseDto(savedPayment);
    }

    public PaymentResponseDto getPaymentByReceipt(String receiptNumber) {
        Payment payment = paymentRepository.findByReceiptNumber(receiptNumber)
                .or(() -> paymentRepository.findById(receiptNumber))
                .orElseThrow(() -> new ResourceNotFoundException("Payment receipt not found: " + receiptNumber));
        return toPaymentResponseDto(payment);
    }

    public List<PaymentResponseDto> getPayments(String studentId, PaymentStatus status) {
        List<Payment> payments;
        if (studentId != null && !studentId.isBlank()) {
            payments = paymentRepository.findByStudentIdOrderByPaymentDateDesc(studentId);
            if (status != null) {
                payments = payments.stream().filter(p -> p.getPaymentStatus() == status).collect(Collectors.toList());
            }
        } else if (status != null) {
            payments = paymentRepository.findByPaymentStatus(status);
        } else {
            payments = paymentRepository.findAllByOrderByPaymentDateDesc();
        }

        return payments.stream().map(this::toPaymentResponseDto).collect(Collectors.toList());
    }

    public List<PaymentDueDto> getOverduePayments() {
        try {
            studentService.syncLiveMonthlyDueDates();
        } catch (Exception ignored) {}

        LocalDate today = LocalDate.now();
        List<Student> overdueStudents = studentRepository.findOverdueStudents(today);
        if (overdueStudents == null || overdueStudents.isEmpty()) {
            overdueStudents = studentRepository.findAll().stream()
                    .filter(s -> s.getStatus() != StudentStatus.VACATED && s.getNextPaymentDueDate() != null && today.isAfter(s.getNextPaymentDueDate()))
                    .collect(Collectors.toList());
        }

        return overdueStudents.stream()
                .filter(s -> s.getStatus() != StudentStatus.VACATED && s.getNextPaymentDueDate() != null && today.isAfter(s.getNextPaymentDueDate()))
                .filter(s -> !"PAID".equalsIgnoreCase(s.getPaymentStatus()))
                .map(s -> {
                    double rent = s.getMonthlyRent() != null ? s.getMonthlyRent() : 0.0;
                    if ("HALF_PAID".equalsIgnoreCase(s.getPaymentStatus())) {
                        rent = rent / 2.0;
                    }
                    long overdueDays = ChronoUnit.DAYS.between(s.getNextPaymentDueDate(), today);
                    return PaymentDueDto.builder()
                            .studentId(s.getStudentId())
                            .studentName(s.getFullName())
                            .mobileNumber(s.getMobileNumber())
                            .roomNumber(s.getRoomNumber())
                            .bedId(s.getBedId())
                            .bedNumber(s.getBedNumber())
                            .monthlyRent(rent)
                            .nextPaymentDueDate(s.getNextPaymentDueDate())
                            .lastPaymentDate(s.getLastPaymentDate())
                            .overdue(true)
                            .daysOverdue(overdueDays)
                            .daysUntilDue(-overdueDays)
                            .dueCategory("OVERDUE")
                            .paymentStatus(s.getPaymentStatus() != null ? s.getPaymentStatus() : "PENDING")
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<PaymentDueDto> getDueSoonPayments() {
        try {
            studentService.syncLiveMonthlyDueDates();
        } catch (Exception ignored) {}

        LocalDate today = LocalDate.now();
        LocalDate sevenDaysAhead = today.plusDays(7);
        return studentRepository.findAll().stream()
                .filter(s -> s.getStatus() != StudentStatus.VACATED && s.getNextPaymentDueDate() != null)
                .filter(s -> !s.getNextPaymentDueDate().isBefore(today.plusDays(1)) && !s.getNextPaymentDueDate().isAfter(sevenDaysAhead))
                .filter(s -> !"PAID".equalsIgnoreCase(s.getPaymentStatus()))
                .map(s -> {
                    double rent = s.getMonthlyRent() != null ? s.getMonthlyRent() : 0.0;
                    if ("HALF_PAID".equalsIgnoreCase(s.getPaymentStatus())) {
                        rent = rent / 2.0;
                    }
                    long daysUntil = ChronoUnit.DAYS.between(today, s.getNextPaymentDueDate());
                    return PaymentDueDto.builder()
                            .studentId(s.getStudentId())
                            .studentName(s.getFullName())
                            .mobileNumber(s.getMobileNumber())
                            .roomNumber(s.getRoomNumber())
                            .bedId(s.getBedId())
                            .bedNumber(s.getBedNumber())
                            .monthlyRent(rent)
                            .nextPaymentDueDate(s.getNextPaymentDueDate())
                            .lastPaymentDate(s.getLastPaymentDate())
                            .overdue(false)
                            .daysOverdue(0)
                            .daysUntilDue(daysUntil)
                            .dueCategory("DUE_SOON")
                            .paymentStatus(s.getPaymentStatus())
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<PaymentDueDto> getDueTodayPayments() {
        try {
            studentService.syncLiveMonthlyDueDates();
        } catch (Exception ignored) {}

        LocalDate today = LocalDate.now();
        return studentRepository.findAll().stream()
                .filter(s -> s.getStatus() != StudentStatus.VACATED && s.getNextPaymentDueDate() != null)
                .filter(s -> s.getNextPaymentDueDate().isEqual(today))
                .filter(s -> !"PAID".equalsIgnoreCase(s.getPaymentStatus()))
                .map(s -> {
                    double rent = s.getMonthlyRent() != null ? s.getMonthlyRent() : 0.0;
                    if ("HALF_PAID".equalsIgnoreCase(s.getPaymentStatus())) {
                        rent = rent / 2.0;
                    }
                    return PaymentDueDto.builder()
                            .studentId(s.getStudentId())
                            .studentName(s.getFullName())
                            .mobileNumber(s.getMobileNumber())
                            .roomNumber(s.getRoomNumber())
                            .bedId(s.getBedId())
                            .bedNumber(s.getBedNumber())
                            .monthlyRent(rent)
                            .nextPaymentDueDate(s.getNextPaymentDueDate())
                            .lastPaymentDate(s.getLastPaymentDate())
                            .overdue(false)
                            .daysOverdue(0)
                            .daysUntilDue(0)
                            .dueCategory("DUE_TODAY")
                            .paymentStatus(s.getPaymentStatus())
                            .build();
                })
                .collect(Collectors.toList());
    }

    public PaymentResponseDto toPaymentResponseDto(Payment payment) {
        return PaymentResponseDto.builder()
                .id(payment.getId())
                .receiptNumber(payment.getReceiptNumber())
                .studentId(payment.getStudentId())
                .studentName(payment.getStudentName())
                .roomNumber(payment.getRoomNumber())
                .bedNumber(payment.getBedNumber())
                .amount(payment.getAmount())
                .paymentDate(payment.getPaymentDate())
                .paymentMethod(payment.getPaymentMethod())
                .paymentType(payment.getPaymentType())
                .paymentStatus(payment.getPaymentStatus())
                .transactionReference(payment.getTransactionReference())
                .previousBalance(payment.getPreviousBalance())
                .remainingBalance(payment.getRemainingBalance())
                .rentForMonth(payment.getRentForMonth())
                .remarks(payment.getRemarks())
                .recordedBy(payment.getRecordedBy())
                .createdAt(payment.getCreatedAt())
                .build();
    }

    private synchronized String generateReceiptNumber() {
        int year = LocalDate.now().getYear();
        long count = paymentRepository.count() + 1;
        String receipt = String.format("REC-%d-%04d", year, count);
        while (paymentRepository.findByReceiptNumber(receipt).isPresent()) {
            count++;
            receipt = String.format("REC-%d-%04d", year, count);
        }
        return receipt;
    }

    private String getCurrentUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                return auth.getName();
            }
        } catch (Exception ignored) {
        }
        return "ADMIN";
    }
}
