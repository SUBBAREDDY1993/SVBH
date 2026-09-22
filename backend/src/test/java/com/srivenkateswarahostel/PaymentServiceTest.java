package com.srivenkateswarahostel;

import com.srivenkateswarahostel.dto.PaymentDueDto;
import com.srivenkateswarahostel.dto.PaymentRequest;
import com.srivenkateswarahostel.dto.PaymentResponseDto;
import com.srivenkateswarahostel.exception.BadRequestException;
import com.srivenkateswarahostel.model.*;
import com.srivenkateswarahostel.repository.PaymentRepository;
import com.srivenkateswarahostel.repository.StudentRepository;
import com.srivenkateswarahostel.service.AuditService;
import com.srivenkateswarahostel.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private PaymentService paymentService;

    private Student student;

    @BeforeEach
    void setUp() {
        student = Student.builder()
                .id("stud-1")
                .studentId("SVBH-2026-001")
                .fullName("Ravi Kumar")
                .roomNumber("203")
                .bedId("B203-1")
                .bedNumber(1)
                .monthlyRent(5000.0)
                .paymentDueDay(5)
                .nextPaymentDueDate(LocalDate.now().minusDays(5)) // overdue
                .status(StudentStatus.ACTIVE)
                .build();
    }

    @Test
    void testRecordPayment_CalculatesNextDueDate() {
        PaymentRequest request = PaymentRequest.builder()
                .studentId("SVBH-2026-001")
                .amount(5000.0)
                .paymentDate(LocalDate.now())
                .paymentMethod(PaymentMethod.UPI)
                .paymentType(PaymentType.MONTHLY_RENT)
                .transactionReference("UPI-123456")
                .rentForMonth("October 2026")
                .build();

        when(studentRepository.findByStudentId("SVBH-2026-001")).thenReturn(Optional.of(student));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            p.setId("pay-1");
            return p;
        });

        PaymentResponseDto response = paymentService.recordPayment(request);

        assertNotNull(response);
        assertEquals(5000.0, response.getAmount());
        assertEquals("SVBH-2026-001", response.getStudentId());

        // Verify student due date advanced
        verify(studentRepository).save(student);
        assertTrue(student.getNextPaymentDueDate().isAfter(LocalDate.now()));
    }

    @Test
    void testRecordPayment_ZeroOrNegativeAmountFails() {
        PaymentRequest request = PaymentRequest.builder()
                .studentId("SVBH-2026-001")
                .amount(0.0)
                .build();

        when(studentRepository.findByStudentId("SVBH-2026-001")).thenReturn(Optional.of(student));

        assertThrows(BadRequestException.class, () -> paymentService.recordPayment(request));
    }

    @Test
    void testGetOverduePayments_DetectsOverdue() {
        LocalDate today = LocalDate.now();
        when(studentRepository.findOverdueStudents(today)).thenReturn(List.of(student));

        List<PaymentDueDto> overdues = paymentService.getOverduePayments();

        assertFalse(overdues.isEmpty());
        assertEquals(1, overdues.size());
        assertEquals("SVBH-2026-001", overdues.get(0).getStudentId());
        assertTrue(overdues.get(0).isOverdue());
        assertEquals(5, overdues.get(0).getDaysOverdue());
    }
}
