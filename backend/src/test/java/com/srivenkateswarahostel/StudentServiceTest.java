package com.srivenkateswarahostel;

import com.srivenkateswarahostel.dto.BedTransferRequest;
import com.srivenkateswarahostel.dto.StudentAdmissionRequest;
import com.srivenkateswarahostel.dto.StudentResponseDto;
import com.srivenkateswarahostel.dto.VacateStudentRequest;
import com.srivenkateswarahostel.exception.BadRequestException;
import com.srivenkateswarahostel.model.*;
import com.srivenkateswarahostel.repository.AllocationHistoryRepository;
import com.srivenkateswarahostel.repository.BedRepository;
import com.srivenkateswarahostel.repository.RoomRepository;
import com.srivenkateswarahostel.repository.StudentRepository;
import com.srivenkateswarahostel.service.AllocationService;
import com.srivenkateswarahostel.service.AuditService;
import com.srivenkateswarahostel.service.RoomService;
import com.srivenkateswarahostel.service.StudentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private BedRepository bedRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private AllocationHistoryRepository allocationHistoryRepository;

    @Mock
    private RoomService roomService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private StudentService studentService;

    @InjectMocks
    private AllocationService allocationService;

    private Bed availableBed;
    private Bed occupiedBed;
    private Student sampleStudent;

    @BeforeEach
    void setUp() {
        availableBed = Bed.builder()
                .id("bed-1")
                .bedId("B101-1")
                .roomNumber("101")
                .bedNumber(1)
                .status(BedStatus.AVAILABLE)
                .build();

        occupiedBed = Bed.builder()
                .id("bed-2")
                .bedId("B101-2")
                .roomNumber("101")
                .bedNumber(2)
                .status(BedStatus.OCCUPIED)
                .studentId("SVBH-2026-001")
                .studentName("Existing Student")
                .build();

        sampleStudent = Student.builder()
                .id("student-1")
                .studentId("SVBH-2026-001")
                .fullName("Ravi Kumar")
                .mobileNumber("9876543210")
                .roomNumber("101")
                .bedId("B101-1")
                .bedNumber(1)
                .monthlyRent(5000.0)
                .status(StudentStatus.ACTIVE)
                .build();
    }

    @Test
    void testAdmitStudent_Success() {
        StudentAdmissionRequest request = StudentAdmissionRequest.builder()
                .fullName("Ravi Kumar")
                .mobileNumber("9876543210")
                .joiningDate(LocalDate.now())
                .roomNumber("101")
                .bedId("B101-1")
                .monthlyRent(5000.0)
                .securityDeposit(5000.0)
                .paymentDueDay(5)
                .build();

        when(bedRepository.findByBedId("B101-1")).thenReturn(Optional.of(availableBed));
        when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> {
            Student s = invocation.getArgument(0);
            s.setId("new-student-id");
            return s;
        });

        StudentResponseDto response = studentService.admitStudent(request);

        assertNotNull(response);
        assertEquals("Ravi Kumar", response.getFullName());
        assertEquals("B101-1", response.getBedId());
        assertEquals(BedStatus.OCCUPIED, availableBed.getStatus());
        verify(bedRepository).save(availableBed);
        verify(roomService).syncRoomStats("101");
    }

    @Test
    void testAdmitStudent_DuplicateBedAllocationPrevention() {
        StudentAdmissionRequest request = StudentAdmissionRequest.builder()
                .fullName("New Student")
                .mobileNumber("9876543211")
                .joiningDate(LocalDate.now())
                .roomNumber("101")
                .bedId("B101-2")
                .monthlyRent(5000.0)
                .build();

        when(bedRepository.findByBedId("B101-2")).thenReturn(Optional.of(occupiedBed));

        assertThrows(BadRequestException.class, () -> studentService.admitStudent(request));
        verify(studentRepository, never()).save(any(Student.class));
    }

    @Test
    void testVacateStudent_ReleasesBed() {
        when(studentRepository.findById("student-1")).thenReturn(Optional.of(sampleStudent));
        when(bedRepository.findByBedId("B101-1")).thenReturn(Optional.of(occupiedBed));
        when(studentRepository.save(any(Student.class))).thenReturn(sampleStudent);

        VacateStudentRequest request = VacateStudentRequest.builder()
                .vacateDate(LocalDate.now())
                .reason("Completed graduation")
                .refundAmount(5000.0)
                .finalPayment(0.0)
                .build();

        StudentResponseDto response = studentService.vacateStudent("student-1", request);

        assertEquals(StudentStatus.VACATED, sampleStudent.getStatus());
        assertEquals(BedStatus.AVAILABLE, occupiedBed.getStatus());
        assertNull(occupiedBed.getStudentId());
        verify(bedRepository).save(occupiedBed);
        verify(roomService).syncRoomStats(occupiedBed.getRoomNumber());
    }
}
