package com.srivenkateswarahostel.controller;

import com.srivenkateswarahostel.dto.ApiResponse;
import com.srivenkateswarahostel.dto.BedDto;
import com.srivenkateswarahostel.model.BedStatus;
import com.srivenkateswarahostel.service.BedService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/beds")
@RequiredArgsConstructor
@Tag(name = "Beds", description = "Bed Availability & Status APIs")
public class BedController {

    private final BedService bedService;

    @GetMapping
    @Operation(summary = "Get list of beds, optionally filtered by status or room")
    public ResponseEntity<ApiResponse<List<BedDto>>> getAllBeds(
            @RequestParam(required = false) BedStatus status,
            @RequestParam(required = false) String roomNumber) {
        List<BedDto> beds = bedService.getAllBeds(status, roomNumber);
        return ResponseEntity.ok(ApiResponse.success(beds));
    }

    @GetMapping("/{bedId}")
    @Operation(summary = "Get bed details by bed ID")
    public ResponseEntity<ApiResponse<BedDto>> getBedById(@PathVariable String bedId) {
        BedDto bed = bedService.getBedById(bedId);
        return ResponseEntity.ok(ApiResponse.success(bed));
    }

    @PutMapping("/{bedId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update bed status (e.g. MAINTENANCE, RESERVED)")
    public ResponseEntity<ApiResponse<BedDto>> updateBedStatus(
            @PathVariable String bedId,
            @RequestParam BedStatus status,
            @RequestParam(required = false) String notes) {
        BedDto updated = bedService.updateBedStatus(bedId, status, notes);
        return ResponseEntity.ok(ApiResponse.success(updated, "Bed status updated successfully"));
    }

    @PostMapping("/room/{roomNumber}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Dynamically add an additional bed to a room")
    public ResponseEntity<ApiResponse<BedDto>> addBedToRoom(@PathVariable String roomNumber) {
        BedDto newBed = bedService.addBedToRoom(roomNumber);
        return ResponseEntity.ok(ApiResponse.success(newBed, "Bed added to room successfully"));
    }
}
