package com.srivenkateswarahostel.service;

import com.srivenkateswarahostel.dto.NoticePeriodRequest;
import com.srivenkateswarahostel.dto.StudentAdmissionRequest;
import com.srivenkateswarahostel.dto.StudentResponseDto;
import com.srivenkateswarahostel.dto.StudentUpdateRequest;
import com.srivenkateswarahostel.dto.VacateStudentRequest;
import com.srivenkateswarahostel.exception.BadRequestException;
import com.srivenkateswarahostel.exception.DuplicateResourceException;
import com.srivenkateswarahostel.exception.ResourceNotFoundException;
import com.srivenkateswarahostel.model.*;
import com.srivenkateswarahostel.repository.AllocationHistoryRepository;
import com.srivenkateswarahostel.repository.BedRepository;
import com.srivenkateswarahostel.repository.RoomRepository;
import com.srivenkateswarahostel.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
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
public class StudentService {

    private final StudentRepository studentRepository;
    private final BedRepository bedRepository;
    private final RoomRepository roomRepository;
    private final AllocationHistoryRepository allocationHistoryRepository;
    private final RoomService roomService;
    private final AuditService auditService;

    @Transactional
    public StudentResponseDto admitStudent(StudentAdmissionRequest request) {
        // 1. Verify Bed exists and is AVAILABLE
        Bed bed = bedRepository.findByBedId(request.getBedId())
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found with ID: " + request.getBedId()));

        if (bed.getStatus() != BedStatus.AVAILABLE) {
            throw new BadRequestException("Bed " + request.getBedId() + " is currently " + bed.getStatus() + ". Only AVAILABLE beds can be allocated.");
        }

        // 2. Generate unique Student ID
        String studentId = generateUniqueStudentId();

        // 3. Calculate initial next payment due date (1 month after joining date)
        LocalDate nextDueDate = request.getJoiningDate().plusMonths(1);
        if (request.getPaymentDueDay() > 0 && request.getPaymentDueDay() <= 28) {
            nextDueDate = nextDueDate.withDayOfMonth(request.getPaymentDueDay());
        }

        // 4. Create and persist Student
        Student student = Student.builder()
                .studentId(studentId)
                .fullName(request.getFullName().trim())
                .fatherName(request.getFatherName())
                .motherName(request.getMotherName())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .mobileNumber(request.getMobileNumber().trim())
                .alternateMobileNumber(request.getAlternateMobileNumber())
                .email(request.getEmail())
                .aadhaarNumber(request.getAadhaarNumber())
                .address(request.getAddress())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .joiningDate(request.getJoiningDate())
                .roomNumber(bed.getRoomNumber())
                .bedId(bed.getBedId())
                .bedNumber(bed.getBedNumber())
                .monthlyRent(request.getMonthlyRent())
                .securityDeposit(request.getSecurityDeposit() != null ? request.getSecurityDeposit() : 0.0)
                .paymentDueDay(request.getPaymentDueDay())
                .nextPaymentDueDate(nextDueDate)
                .lastPaymentDate(request.getJoiningDate())
                .admissionStatus("CONFIRMED")
                .status(StudentStatus.ACTIVE)
                .emergencyContact(request.getEmergencyContact())
                .documents(request.getDocuments())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Student savedStudent = studentRepository.save(student);

        // 5. Update Bed to OCCUPIED
        bed.setStatus(BedStatus.OCCUPIED);
        bed.setStudentId(savedStudent.getStudentId());
        bed.setStudentName(savedStudent.getFullName());
        bed.setAllocationDate(request.getJoiningDate());
        bed.setUpdatedAt(LocalDateTime.now());
        bedRepository.save(bed);

        // 6. Sync Room Occupancy
        roomService.syncRoomStats(bed.getRoomNumber());

        // 7. Record Allocation History
        String allocatedBy = getCurrentUsername();
        AllocationHistory allocationHistory = AllocationHistory.builder()
                .studentId(savedStudent.getStudentId())
                .studentName(savedStudent.getFullName())
                .toRoom(bed.getRoomNumber())
                .toBedId(bed.getBedId())
                .allocationDate(LocalDateTime.now())
                .type(AllocationType.INITIAL)
                .allocatedBy(allocatedBy)
                .remarks("Initial admission allocation")
                .createdAt(LocalDateTime.now())
                .build();
        allocationHistoryRepository.save(allocationHistory);

        auditService.log("ADMISSION", "STUDENT", savedStudent.getStudentId(),
                "Admitted student " + savedStudent.getFullName() + " to Bed " + bed.getBedId() + " (Room " + bed.getRoomNumber() + ")");

        return toStudentResponseDto(savedStudent);
    }

    @Transactional
    public StudentResponseDto updateStudent(String id, StudentUpdateRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with ID: " + id));

        student.setFullName(request.getFullName().trim());
        student.setFatherName(request.getFatherName());
        student.setMotherName(request.getMotherName());
        student.setDateOfBirth(request.getDateOfBirth());
        student.setGender(request.getGender());
        student.setMobileNumber(request.getMobileNumber().trim());
        student.setAlternateMobileNumber(request.getAlternateMobileNumber());
        student.setEmail(request.getEmail());
        student.setAadhaarNumber(request.getAadhaarNumber());
        student.setAddress(request.getAddress());
        student.setCity(request.getCity());
        student.setState(request.getState());
        student.setPincode(request.getPincode());

        if (request.getMonthlyRent() != null && request.getMonthlyRent() > 0) {
            student.setMonthlyRent(request.getMonthlyRent());
        }
        if (request.getSecurityDeposit() != null) {
            student.setSecurityDeposit(request.getSecurityDeposit());
        }
        if (request.getPaymentDueDay() > 0) {
            student.setPaymentDueDay(request.getPaymentDueDay());
        }
        if (request.getEmergencyContact() != null) {
            student.setEmergencyContact(request.getEmergencyContact());
        }
        if (request.getDocuments() != null) {
            student.setDocuments(request.getDocuments());
        }
        student.setUpdatedAt(LocalDateTime.now());

        Student updated = studentRepository.save(student);

        // Also update bed studentName if changed
        if (student.getBedId() != null) {
            bedRepository.findByBedId(student.getBedId()).ifPresent(bed -> {
                bed.setStudentName(updated.getFullName());
                bedRepository.save(bed);
            });
        }

        auditService.log("UPDATE", "STUDENT", updated.getStudentId(), "Updated student details: " + updated.getFullName());
        return toStudentResponseDto(updated);
    }

    public StudentResponseDto getStudentById(String id) {
        Student student = studentRepository.findById(id)
                .or(() -> studentRepository.findByStudentId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));
        return toStudentResponseDto(student);
    }

    public List<StudentResponseDto> getAllStudents(StudentStatus status, String search) {
        List<Student> students;
        if (search != null && !search.isBlank()) {
            students = studentRepository.searchStudents(search.trim());
            if (status != null) {
                students = students.stream().filter(s -> s.getStatus() == status).collect(Collectors.toList());
            }
        } else if (status != null) {
            students = studentRepository.findByStatusOrderByFullNameAsc(status);
        } else {
            students = studentRepository.findAll();
        }

        return students.stream().map(this::toStudentResponseDto).collect(Collectors.toList());
    }

    @Transactional
    public StudentResponseDto markNoticePeriod(String id, NoticePeriodRequest request) {
        Student student = studentRepository.findById(id)
                .or(() -> studentRepository.findByStudentId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));

        if (student.getStatus() == StudentStatus.VACATED) {
            throw new BadRequestException("Student has already vacated");
        }

        student.setStatus(StudentStatus.NOTICE_PERIOD);
        student.setNoticeInfo(NoticeInfo.builder()
                .noticeDate(request.getNoticeDate())
                .expectedVacateDate(request.getExpectedVacateDate())
                .reason(request.getReason())
                .remarks(request.getRemarks())
                .build());
        student.setUpdatedAt(LocalDateTime.now());

        Student saved = studentRepository.save(student);
        auditService.log("NOTICE_PERIOD", "STUDENT", saved.getStudentId(),
                "Marked student " + saved.getFullName() + " in notice period until " + request.getExpectedVacateDate());

        return toStudentResponseDto(saved);
    }

    @Transactional
    public StudentResponseDto vacateStudent(String id, VacateStudentRequest request) {
        Student student = studentRepository.findById(id)
                .or(() -> studentRepository.findByStudentId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));

        if (student.getStatus() == StudentStatus.VACATED) {
            throw new BadRequestException("Student is already vacated");
        }

        String bedId = student.getBedId();
        String roomNumber = student.getRoomNumber();

        // Release the bed: OCCUPIED -> AVAILABLE
        if (bedId != null) {
            bedRepository.findByBedId(bedId).ifPresent(bed -> {
                bed.setStatus(BedStatus.AVAILABLE);
                bed.setStudentId(null);
                bed.setStudentName(null);
                bed.setAllocationDate(null);
                bed.setUpdatedAt(LocalDateTime.now());
                bedRepository.save(bed);
                roomService.syncRoomStats(bed.getRoomNumber());
            });
        }

        // Update Student status
        student.setStatus(StudentStatus.VACATED);
        student.setVacateInfo(VacateInfo.builder()
                .vacateDate(request.getVacateDate())
                .reason(request.getReason())
                .refundAmount(request.getRefundAmount() != null ? request.getRefundAmount() : 0.0)
                .finalPayment(request.getFinalPayment() != null ? request.getFinalPayment() : 0.0)
                .remarks(request.getRemarks())
                .build());
        student.setUpdatedAt(LocalDateTime.now());

        Student saved = studentRepository.save(student);

        // Record Allocation History
        AllocationHistory allocationHistory = AllocationHistory.builder()
                .studentId(saved.getStudentId())
                .studentName(saved.getFullName())
                .fromRoom(roomNumber)
                .fromBedId(bedId)
                .vacatedDate(LocalDateTime.now())
                .type(AllocationType.VACATE)
                .allocatedBy(getCurrentUsername())
                .remarks("Student vacated. Bed released to AVAILABLE.")
                .createdAt(LocalDateTime.now())
                .build();
        allocationHistoryRepository.save(allocationHistory);

        auditService.log("VACATE", "STUDENT", saved.getStudentId(),
                "Student " + saved.getFullName() + " vacated from Bed " + bedId + ". Bed is now AVAILABLE.");

        return toStudentResponseDto(saved);
    }

    @Transactional
    public void deleteStudent(String id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));

        if (student.getStatus() != StudentStatus.VACATED) {
            throw new BadRequestException("Cannot delete active student. Vacate student first.");
        }

        studentRepository.delete(student);
        auditService.log("DELETE", "STUDENT", id, "Permanently deleted vacated student: " + student.getFullName());
    }

    public StudentResponseDto toStudentResponseDto(Student student) {
        LocalDate today = LocalDate.now();
        boolean overdue = false;
        long daysOverdue = 0;

        if (student.getStatus() != StudentStatus.VACATED && student.getNextPaymentDueDate() != null) {
            if (today.isAfter(student.getNextPaymentDueDate())) {
                overdue = true;
                daysOverdue = ChronoUnit.DAYS.between(student.getNextPaymentDueDate(), today);
            }
        }

        return StudentResponseDto.builder()
                .id(student.getId())
                .studentId(student.getStudentId())
                .fullName(student.getFullName())
                .fatherName(student.getFatherName())
                .motherName(student.getMotherName())
                .dateOfBirth(student.getDateOfBirth())
                .gender(student.getGender())
                .mobileNumber(student.getMobileNumber())
                .alternateMobileNumber(student.getAlternateMobileNumber())
                .email(student.getEmail())
                .aadhaarNumber(student.getAadhaarNumber())
                .address(student.getAddress())
                .city(student.getCity())
                .state(student.getState())
                .pincode(student.getPincode())
                .joiningDate(student.getJoiningDate())
                .roomNumber(student.getRoomNumber())
                .bedId(student.getBedId())
                .bedNumber(student.getBedNumber())
                .monthlyRent(student.getMonthlyRent())
                .securityDeposit(student.getSecurityDeposit())
                .paymentDueDay(student.getPaymentDueDay())
                .nextPaymentDueDate(student.getNextPaymentDueDate())
                .lastPaymentDate(student.getLastPaymentDate())
                .admissionStatus(student.getAdmissionStatus())
                .status(student.getStatus())
                .emergencyContact(student.getEmergencyContact())
                .documents(student.getDocuments())
                .noticeInfo(student.getNoticeInfo())
                .vacateInfo(student.getVacateInfo())
                .isOverdue(overdue)
                .daysOverdue(daysOverdue)
                .createdAt(student.getCreatedAt())
                .updatedAt(student.getUpdatedAt())
                .build();
    }

    private synchronized String generateUniqueStudentId() {
        int year = LocalDate.now().getYear();
        long count = studentRepository.count() + 1;
        String studentId = String.format("SVBH-%d-%03d", year, count);
        while (studentRepository.existsByStudentId(studentId)) {
            count++;
            studentId = String.format("SVBH-%d-%03d", year, count);
        }
        return studentId;
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
