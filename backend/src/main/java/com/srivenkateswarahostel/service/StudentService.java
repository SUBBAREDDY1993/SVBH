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
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentService {

    private final StudentRepository studentRepository;
    private final BedRepository bedRepository;
    private final RoomRepository roomRepository;
    private final AllocationHistoryRepository allocationHistoryRepository;
    private final RoomService roomService;
    private final AuditService auditService;

    @Transactional
    public StudentResponseDto admitStudent(StudentAdmissionRequest request) {
        log.info("Admitting new student '{}', bed '{}'", request.getFullName(), request.getBedId());

        // 1. Verify Bed exists and is AVAILABLE
        Bed bed = bedRepository.findByBedId(request.getBedId())
                .orElseThrow(() -> {
                    log.error("Admission failed: Bed not found with ID '{}'", request.getBedId());
                    return new ResourceNotFoundException("Bed not found with ID: " + request.getBedId());
                });

        if (bed.getStatus() != BedStatus.AVAILABLE) {
            log.warn("Admission failed: Bed '{}' is currently {}", request.getBedId(), bed.getStatus());
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
        log.info("Student record saved: studentId='{}', name='{}', room={}, bed={}",
                savedStudent.getStudentId(), savedStudent.getFullName(), bed.getRoomNumber(), bed.getBedNumber());

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
        AllocationType allocType = request.getAllocationType() != null ? request.getAllocationType() : AllocationType.INITIAL;
        String remarks = allocType == AllocationType.EXISTING
                ? "Existing resident record allocation"
                : allocType == AllocationType.REJOIN
                ? "Rejoining resident allocation"
                : "Initial admission allocation";

        AllocationHistory allocationHistory = AllocationHistory.builder()
                .studentId(savedStudent.getStudentId())
                .studentName(savedStudent.getFullName())
                .toRoom(bed.getRoomNumber())
                .toBedId(bed.getBedId())
                .allocationDate(LocalDateTime.now())
                .type(allocType)
                .allocatedBy(allocatedBy)
                .remarks(remarks)
                .createdAt(LocalDateTime.now())
                .build();
        allocationHistoryRepository.save(allocationHistory);

        auditService.log("ADMISSION", "STUDENT", savedStudent.getStudentId(),
                "Admitted student " + savedStudent.getFullName() + " to Bed " + bed.getBedId() + " (Room " + bed.getRoomNumber() + ")");

        return toStudentResponseDto(savedStudent);
    }

    @Transactional
    public StudentResponseDto updateStudent(String id, StudentUpdateRequest request) {
        log.info("Updating student details for ID '{}'", id);
        Student student = studentRepository.findById(id)
                .or(() -> studentRepository.findByStudentId(id))
                .orElseThrow(() -> {
                    log.error("Update failed: Student not found with ID '{}'", id);
                    return new ResourceNotFoundException("Student not found with ID: " + id);
                });

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

        if (request.getJoiningDate() != null) {
            student.setJoiningDate(request.getJoiningDate());
        }
        if (request.getNextPaymentDueDate() != null) {
            student.setNextPaymentDueDate(request.getNextPaymentDueDate());
        }
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
        log.info("Student details updated successfully for '{}' (ID: {})", updated.getFullName(), updated.getStudentId());
        return toStudentResponseDto(updated);
    }

    public StudentResponseDto getStudentById(String id) {
        Student student = studentRepository.findById(id)
                .or(() -> studentRepository.findByStudentId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));
        return toStudentResponseDto(student);
    }

    public List<StudentResponseDto> getAllStudents(StudentStatus status, String search) {
        try {
            syncLiveMonthlyDueDates();
        } catch (Exception e) {
            log.warn("Could not sync live monthly dues during student fetch: {}", e.getMessage());
        }
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
        log.info("Marking notice period for student ID '{}', expected vacate date: {}", id, request.getExpectedVacateDate());
        Student student = studentRepository.findById(id)
                .or(() -> studentRepository.findByStudentId(id))
                .orElseThrow(() -> {
                    log.error("Notice period failed: Student not found with ID '{}'", id);
                    return new ResourceNotFoundException("Student not found with ID: " + id);
                });

        if (student.getStatus() == StudentStatus.VACATED) {
            log.warn("Notice period failed: Student '{}' has already vacated", student.getFullName());
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
        log.info("Student '{}' (ID: {}) status updated to NOTICE_PERIOD", saved.getFullName(), saved.getStudentId());

        return toStudentResponseDto(saved);
    }

    @Transactional
    public StudentResponseDto vacateStudent(String id, VacateStudentRequest request) {
        log.info("Processing vacate request for student ID '{}'", id);
        Student student = studentRepository.findById(id)
                .or(() -> studentRepository.findByStudentId(id))
                .orElseThrow(() -> {
                    log.error("Vacate failed: Student not found with ID '{}'", id);
                    return new ResourceNotFoundException("Student not found with ID: " + id);
                });

        if (student.getStatus() == StudentStatus.VACATED) {
            log.warn("Vacate failed: Student '{}' is already vacated", student.getFullName());
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
                log.info("Released bed '{}' (room: {}) back to AVAILABLE", bedId, bed.getRoomNumber());
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
        log.info("Student '{}' (ID: {}) successfully vacated", saved.getFullName(), saved.getStudentId());

        return toStudentResponseDto(saved);
    }

    @Transactional
    public void deleteStudent(String id) {
        log.warn("Deleting resident record for ID '{}'", id);
        Student student = studentRepository.findById(id)
                .or(() -> studentRepository.findByStudentId(id))
                .orElseThrow(() -> {
                    log.error("Delete failed: Student not found with ID '{}'", id);
                    return new ResourceNotFoundException("Student not found: " + id);
                });

        // If student currently occupies a bed, release the bed back to AVAILABLE
        if (student.getBedId() != null && student.getStatus() != StudentStatus.VACATED) {
            String bedId = student.getBedId();
            bedRepository.findByBedId(bedId).ifPresent(bed -> {
                bed.setStatus(BedStatus.AVAILABLE);
                bed.setStudentId(null);
                bed.setStudentName(null);
                bed.setAllocationDate(null);
                bed.setUpdatedAt(LocalDateTime.now());
                bedRepository.save(bed);
                roomService.syncRoomStats(bed.getRoomNumber());
                log.info("Auto-released bed '{}' to AVAILABLE prior to student deletion", bedId);
            });
        }

        studentRepository.delete(student);
        auditService.log("DELETE", "STUDENT", student.getStudentId(), "Permanently deleted resident: " + student.getFullName());
        log.info("Resident '{}' (ID: {}) permanently deleted from database", student.getFullName(), student.getStudentId());
    }

    /**
     * Synchronize recurring monthly fee due dates for all active students based on joining date
     * and paymentDueDay.
     * Ensures that as calendar months elapse, active residents' dues roll over live to the current
     * month (e.g. October 2026) instead of remaining frozen in past admission months.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Scheduled(cron = "0 5 0 * * *")
    @Transactional
    public int syncLiveMonthlyDueDates() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        int currentYear = today.getYear();
        int currentMonth = today.getMonthValue();

        List<Student> students = studentRepository.findAll();
        int updatedCount = 0;

        for (Student student : students) {
            if (student.getStatus() == StudentStatus.VACATED) {
                continue;
            }

            int dueDay = student.getPaymentDueDay();
            if (dueDay <= 0 || dueDay > 28) {
                if (student.getJoiningDate() != null) {
                    dueDay = Math.min(student.getJoiningDate().getDayOfMonth(), 28);
                } else {
                    dueDay = 5;
                }
                student.setPaymentDueDay(dueDay);
            }

            LocalDate joinDate = student.getJoiningDate() != null ? student.getJoiningDate() : today;
            boolean joinedThisMonth = (joinDate.getYear() == currentYear && joinDate.getMonthValue() == currentMonth);

            boolean isPaid = "PAID".equalsIgnoreCase(student.getPaymentStatus());
            LocalDate lastPay = student.getLastPaymentDate();
            boolean paidForCurrentMonth = isPaid && lastPay != null &&
                    (lastPay.getYear() == currentYear && lastPay.getMonthValue() == currentMonth);

            LocalDate targetDueDate;

            if (paidForCurrentMonth) {
                // Already paid for current month, next due in following month
                targetDueDate = LocalDate.of(currentYear, currentMonth, 1).plusMonths(1).withDayOfMonth(dueDay);
            } else if (joinedThisMonth) {
                // Joined this month, initial admission fee covers this month, next due next month
                targetDueDate = LocalDate.of(currentYear, currentMonth, 1).plusMonths(1).withDayOfMonth(dueDay);
            } else {
                // Unpaid for current month, due date is in the CURRENT active month!
                targetDueDate = LocalDate.of(currentYear, currentMonth, dueDay);

                // If previously marked PAID in an old month, reset to PENDING for the new month
                if (isPaid && !paidForCurrentMonth) {
                    student.setPaymentStatus("PENDING");
                }
            }

            if (student.getNextPaymentDueDate() == null || !student.getNextPaymentDueDate().isEqual(targetDueDate)) {
                student.setNextPaymentDueDate(targetDueDate);
                student.setUpdatedAt(LocalDateTime.now());
                studentRepository.save(student);
                updatedCount++;
            }
        }

        if (updatedCount > 0) {
            log.info("Synchronized live monthly fee due dates for {} student(s) to current month ({}-{})",
                    updatedCount, currentYear, currentMonth);
        }
        return updatedCount;
    }

    @Transactional
    public StudentResponseDto updatePaymentStatus(String id, String status) {
        log.info("Updating fee payment status for resident ID '{}' to '{}'", id, status);
        Student student = studentRepository.findById(id)
                .or(() -> studentRepository.findByStudentId(id))
                .orElseThrow(() -> {
                    log.error("Payment status update failed: Student not found with ID '{}'", id);
                    return new ResourceNotFoundException("Student not found: " + id);
                });

        String normalizedStatus = status != null ? status.trim().toUpperCase() : "PENDING";
        if (!List.of("PAID", "PENDING", "HALF_PAID").contains(normalizedStatus)) {
            log.warn("Invalid payment status requested: '{}'", status);
            throw new IllegalArgumentException("Invalid payment status: " + status + ". Allowed values: PAID, PENDING, HALF_PAID");
        }

        String previousStatus = student.getPaymentStatus();
        student.setPaymentStatus(normalizedStatus);
        if ("PAID".equalsIgnoreCase(normalizedStatus)) {
            student.setLastPaymentDate(LocalDate.now());
            if (student.getNextPaymentDueDate() == null || !student.getNextPaymentDueDate().isAfter(LocalDate.now())) {
                student.setNextPaymentDueDate(LocalDate.now().plusMonths(1));
            }
        }
        student.setUpdatedAt(LocalDateTime.now());
        Student saved = studentRepository.save(student);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String actor = auth != null && auth.getName() != null ? auth.getName() : "ADMIN";
        log.info("Fee status updated for resident '{}' from '{}' to '{}' by '{}'",
                saved.getFullName(), previousStatus, normalizedStatus, actor);
        auditService.log("PAYMENT_STATUS_UPDATE", "STUDENT", saved.getStudentId(),
                String.format("Security: Fee status changed from '%s' to '%s' by user '%s'",
                        previousStatus != null ? previousStatus : "AUTO_CALCULATED", normalizedStatus, actor));
        return toStudentResponseDto(saved);
    }

    public StudentResponseDto toStudentResponseDto(Student student) {
        LocalDate today = LocalDate.now();
        boolean overdue = false;
        long daysOverdue = 0;
        String paymentStatus = student.getPaymentStatus();

        if (paymentStatus == null || paymentStatus.isBlank()) {
            paymentStatus = "PAID";
            if (student.getStatus() != StudentStatus.VACATED) {
                if (student.getNextPaymentDueDate() == null) {
                    paymentStatus = "PENDING";
                } else if (!today.isBefore(student.getNextPaymentDueDate())) {
                    if (today.isAfter(student.getNextPaymentDueDate())) {
                        overdue = true;
                        daysOverdue = ChronoUnit.DAYS.between(student.getNextPaymentDueDate(), today);
                    }
                    paymentStatus = "PENDING";
                }
            }
        } else {
            paymentStatus = paymentStatus.toUpperCase();
            if ("PENDING".equalsIgnoreCase(paymentStatus) || "HALF_PAID".equalsIgnoreCase(paymentStatus)) {
                if (student.getNextPaymentDueDate() != null && today.isAfter(student.getNextPaymentDueDate())) {
                    overdue = true;
                    daysOverdue = ChronoUnit.DAYS.between(student.getNextPaymentDueDate(), today);
                }
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
                .paymentStatus(paymentStatus)
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
