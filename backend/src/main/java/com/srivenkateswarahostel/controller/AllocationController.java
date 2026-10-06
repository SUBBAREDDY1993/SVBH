package com.srivenkateswarahostel.controller;

import com.srivenkateswarahostel.dto.ApiResponse;
import com.srivenkateswarahostel.dto.BedTransferRequest;
import com.srivenkateswarahostel.dto.StudentResponseDto;
import com.srivenkateswarahostel.exception.BadRequestException;
import com.srivenkateswarahostel.model.AllocationHistory;
import com.srivenkateswarahostel.model.AllocationType;
import com.srivenkateswarahostel.service.AllocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/allocations")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Bed Allocations", description = "Bed Allocation and Transfer APIs")
public class AllocationController {

    private final AllocationService allocationService;

    @PostMapping("/transfer/{studentId}")
    @Operation(summary = "Transfer student to a new room / bed (releases previous bed)")
    public ResponseEntity<ApiResponse<StudentResponseDto>> transferBed(
            @PathVariable String studentId,
            @Valid @RequestBody BedTransferRequest request) {
        log.info("REST: Transferring student '{}' to target bed '{}' (room: {})", studentId, request.getTargetBedId(), request.getTargetRoomNumber());
        StudentResponseDto updated = allocationService.transferBed(studentId, request);
        log.info("REST: Student '{}' transfer completed to room {}, bed {}",
                updated.getFullName(), updated.getRoomNumber(), updated.getBedNumber());
        return ResponseEntity.ok(ApiResponse.success(updated, "Student bed transfer completed successfully"));
    }

    @GetMapping
    @Operation(summary = "Get complete bed allocation audit history")
    public ResponseEntity<ApiResponse<List<AllocationHistory>>> getAllocations(
            @RequestParam(required = false) String studentId) {
        log.debug("REST: Fetching allocation history (studentId: '{}')", studentId);
        List<AllocationHistory> history = allocationService.getAllocationHistory(studentId);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @PatchMapping("/{id}/type")
    @Operation(summary = "Update allocation type (INITIAL, EXISTING, REJOIN, TRANSFER, VACATE)")
    public ResponseEntity<ApiResponse<AllocationHistory>> updateAllocationType(
            @PathVariable String id,
            @RequestParam(required = false) AllocationType type,
            @RequestBody(required = false) Map<String, String> body) {
        log.info("REST: Updating allocation history ID '{}' type", id);
        AllocationType newType = type;
        if (newType == null && body != null && body.containsKey("type")) {
            try {
                newType = AllocationType.valueOf(body.get("type").trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid allocation type provided: '{}'", body.get("type"));
                throw new BadRequestException("Invalid allocation type: " + body.get("type"));
            }
        }
        if (newType == null) {
            throw new BadRequestException("Allocation type is required");
        }
        AllocationHistory updated = allocationService.updateAllocationType(id, newType);
        log.info("REST: Allocation history ID '{}' updated to type '{}'", id, newType);
        return ResponseEntity.ok(ApiResponse.success(updated, "Allocation type updated to " + newType));
    }
}
