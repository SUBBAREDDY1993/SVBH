package com.srivenkateswarahostel.controller;

import com.srivenkateswarahostel.dto.*;
import com.srivenkateswarahostel.model.StudentStatus;
import com.srivenkateswarahostel.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@Tag(name = "Students", description = "Student Admission & Management APIs")
public class StudentController {

    private final StudentService studentService;

    @GetMapping
    @Operation(summary = "Get list of students with optional status and search filters")
    public ResponseEntity<ApiResponse<List<StudentResponseDto>>> getAllStudents(
            @RequestParam(required = false) StudentStatus status,
            @RequestParam(required = false) String search) {
        List<StudentResponseDto> students = studentService.getAllStudents(status, search);
        return ResponseEntity.ok(ApiResponse.success(students));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get student profile by ID or Student ID")
    public ResponseEntity<ApiResponse<StudentResponseDto>> getStudentById(@PathVariable String id) {
        StudentResponseDto student = studentService.getStudentById(id);
        return ResponseEntity.ok(ApiResponse.success(student));
    }

    @PostMapping
    @Operation(summary = "Admit new student and assign bed")
    public ResponseEntity<ApiResponse<StudentResponseDto>> admitStudent(
            @Valid @RequestBody StudentAdmissionRequest request) {
        StudentResponseDto admitted = studentService.admitStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(admitted, "Student admitted successfully. Bed allocated."));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update student details")
    public ResponseEntity<ApiResponse<StudentResponseDto>> updateStudent(
            @PathVariable String id,
            @Valid @RequestBody StudentUpdateRequest request) {
        StudentResponseDto updated = studentService.updateStudent(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Student updated successfully"));
    }

    @PostMapping("/{id}/notice")
    @Operation(summary = "Put student on notice period")
    public ResponseEntity<ApiResponse<StudentResponseDto>> markNoticePeriod(
            @PathVariable String id,
            @Valid @RequestBody NoticePeriodRequest request) {
        StudentResponseDto updated = studentService.markNoticePeriod(id, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Student placed on notice period"));
    }

    @PostMapping("/{id}/vacate")
    @Operation(summary = "Vacate student and automatically release allocated bed")
    public ResponseEntity<ApiResponse<StudentResponseDto>> vacateStudent(
            @PathVariable String id,
            @Valid @RequestBody VacateStudentRequest request) {
        StudentResponseDto vacated = studentService.vacateStudent(id, request);
        return ResponseEntity.ok(ApiResponse.success(vacated, "Student vacated successfully. Bed released to AVAILABLE."));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete vacated student record")
    public ResponseEntity<ApiResponse<Void>> deleteStudent(@PathVariable String id) {
        studentService.deleteStudent(id);
        return ResponseEntity.ok(ApiResponse.successMessage("Student deleted successfully"));
    }

    @RequestMapping(value = "/{id}/payment-status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @Operation(summary = "Update resident fee payment status (PAID, PENDING, HALF_PAID)")
    public ResponseEntity<ApiResponse<StudentResponseDto>> updatePaymentStatus(
            @PathVariable String id,
            @RequestParam String status) {
        StudentResponseDto updated = studentService.updatePaymentStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(updated, "Payment status updated successfully"));
    }
}
