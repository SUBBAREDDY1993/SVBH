package com.srivenkateswarahostel.controller;

import com.srivenkateswarahostel.dto.ApiResponse;
import com.srivenkateswarahostel.dto.BedTransferRequest;
import com.srivenkateswarahostel.dto.StudentResponseDto;
import com.srivenkateswarahostel.model.AllocationHistory;
import com.srivenkateswarahostel.service.AllocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/allocations")
@RequiredArgsConstructor
@Tag(name = "Bed Allocations", description = "Bed Allocation and Transfer APIs")
public class AllocationController {

    private final AllocationService allocationService;

    @PostMapping("/transfer/{studentId}")
    @Operation(summary = "Transfer student to a new room / bed (releases previous bed)")
    public ResponseEntity<ApiResponse<StudentResponseDto>> transferBed(
            @PathVariable String studentId,
            @Valid @RequestBody BedTransferRequest request) {
        StudentResponseDto updated = allocationService.transferBed(studentId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Student bed transfer completed successfully"));
    }

    @GetMapping
    @Operation(summary = "Get complete bed allocation audit history")
    public ResponseEntity<ApiResponse<List<AllocationHistory>>> getAllocations(
            @RequestParam(required = false) String studentId) {
        List<AllocationHistory> history = allocationService.getAllocationHistory(studentId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
