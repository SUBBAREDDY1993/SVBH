package com.srivenkateswarahostel.service;

import com.srivenkateswarahostel.dto.BedTransferRequest;
import com.srivenkateswarahostel.dto.StudentResponseDto;
import com.srivenkateswarahostel.exception.BadRequestException;
import com.srivenkateswarahostel.exception.ResourceNotFoundException;
import com.srivenkateswarahostel.model.*;
import com.srivenkateswarahostel.repository.AllocationHistoryRepository;
import com.srivenkateswarahostel.repository.BedRepository;
import com.srivenkateswarahostel.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AllocationService {

    private final StudentRepository studentRepository;
    private final BedRepository bedRepository;
    private final AllocationHistoryRepository allocationHistoryRepository;
    private final RoomService roomService;
    private final StudentService studentService;
    private final AuditService auditService;

    @Transactional
    public StudentResponseDto transferBed(String studentId, BedTransferRequest request) {
        Student student = studentRepository.findByStudentId(studentId)
                .or(() -> studentRepository.findById(studentId))
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        if (student.getStatus() == StudentStatus.VACATED) {
            throw new BadRequestException("Cannot transfer bed for vacated student");
        }

        Bed targetBed = bedRepository.findByBedId(request.getTargetBedId())
                .orElseThrow(() -> new ResourceNotFoundException("Target bed not found: " + request.getTargetBedId()));

        if (targetBed.getStatus() != BedStatus.AVAILABLE) {
            throw new BadRequestException("Target bed " + request.getTargetBedId() + " is " + targetBed.getStatus() + ". Only AVAILABLE beds can be allocated.");
        }

        String oldRoom = student.getRoomNumber();
        String oldBedId = student.getBedId();

        // 1. Release old bed (OCCUPIED -> AVAILABLE)
        if (oldBedId != null) {
            bedRepository.findByBedId(oldBedId).ifPresent(oldBed -> {
                oldBed.setStatus(BedStatus.AVAILABLE);
                oldBed.setStudentId(null);
                oldBed.setStudentName(null);
                oldBed.setAllocationDate(null);
                oldBed.setUpdatedAt(LocalDateTime.now());
                bedRepository.save(oldBed);
                roomService.syncRoomStats(oldBed.getRoomNumber());
            });
        }

        // 2. Assign target bed (AVAILABLE -> OCCUPIED)
        targetBed.setStatus(BedStatus.OCCUPIED);
        targetBed.setStudentId(student.getStudentId());
        targetBed.setStudentName(student.getFullName());
        targetBed.setAllocationDate(LocalDateTime.now().toLocalDate());
        targetBed.setUpdatedAt(LocalDateTime.now());
        bedRepository.save(targetBed);
        roomService.syncRoomStats(targetBed.getRoomNumber());

        // 3. Update student record
        student.setRoomNumber(targetBed.getRoomNumber());
        student.setBedId(targetBed.getBedId());
        student.setBedNumber(targetBed.getBedNumber());
        student.setUpdatedAt(LocalDateTime.now());
        Student savedStudent = studentRepository.save(student);

        // 4. Record allocation history
        AllocationHistory history = AllocationHistory.builder()
                .studentId(savedStudent.getStudentId())
                .studentName(savedStudent.getFullName())
                .fromRoom(oldRoom)
                .fromBedId(oldBedId)
                .toRoom(targetBed.getRoomNumber())
                .toBedId(targetBed.getBedId())
                .allocationDate(LocalDateTime.now())
                .type(AllocationType.TRANSFER)
                .allocatedBy(getCurrentUsername())
                .remarks(request.getReason() != null ? request.getReason() : "Bed transfer")
                .createdAt(LocalDateTime.now())
                .build();
        allocationHistoryRepository.save(history);

        auditService.log("TRANSFER", "BED", targetBed.getBedId(),
                "Transferred student " + savedStudent.getFullName() + " from Bed " + oldBedId + " to " + targetBed.getBedId());

        return studentService.toStudentResponseDto(savedStudent);
    }

    public List<AllocationHistory> getAllocationHistory(String studentId) {
        if (studentId != null && !studentId.isBlank()) {
            return allocationHistoryRepository.findByStudentIdOrderByAllocationDateDesc(studentId);
        }
        return allocationHistoryRepository.findAllByOrderByAllocationDateDesc();
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
