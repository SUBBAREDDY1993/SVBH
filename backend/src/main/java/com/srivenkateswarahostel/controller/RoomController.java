package com.srivenkateswarahostel.controller;

import com.srivenkateswarahostel.dto.ApiResponse;
import com.srivenkateswarahostel.dto.RoomDto;
import com.srivenkateswarahostel.dto.RoomUpdateRequest;
import com.srivenkateswarahostel.service.RoomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Rooms", description = "Room Management APIs")
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    @Operation(summary = "Get list of all rooms with bed occupancy details")
    public ResponseEntity<ApiResponse<List<RoomDto>>> getAllRooms(
            @RequestParam(required = false, defaultValue = "true") boolean includeBeds) {
        log.debug("REST: Fetching all rooms (includeBeds: {})", includeBeds);
        List<RoomDto> rooms = roomService.getAllRooms(includeBeds);
        return ResponseEntity.ok(ApiResponse.success(rooms));
    }

    @GetMapping("/{roomNumber}")
    @Operation(summary = "Get specific room by room number")
    public ResponseEntity<ApiResponse<RoomDto>> getRoomByNumber(@PathVariable String roomNumber) {
        log.debug("REST: Fetching room details for '{}'", roomNumber);
        RoomDto room = roomService.getRoomByNumber(roomNumber);
        return ResponseEntity.ok(ApiResponse.success(room));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new room (automatically generates beds)")
    public ResponseEntity<ApiResponse<RoomDto>> createRoom(@Valid @RequestBody RoomDto roomDto) {
        log.info("REST: Creating new room '{}' with total beds {}", roomDto.getRoomNumber(), roomDto.getTotalBeds());
        RoomDto created = roomService.createRoom(roomDto);
        log.info("REST: Room '{}' created successfully", created.getRoomNumber());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Room created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update room details")
    public ResponseEntity<ApiResponse<RoomDto>> updateRoom(
            @PathVariable String id,
            @Valid @RequestBody RoomUpdateRequest request) {
        log.info("REST: Updating room ID '{}'", id);
        RoomDto updated = roomService.updateRoom(id, request);
        log.info("REST: Room ID '{}' updated successfully", id);
        return ResponseEntity.ok(ApiResponse.success(updated, "Room updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete room (only if empty)")
    public ResponseEntity<ApiResponse<Void>> deleteRoom(@PathVariable String id) {
        log.warn("REST: Admin deleting room ID '{}'", id);
        roomService.deleteRoom(id);
        log.info("REST: Room ID '{}' deleted successfully", id);
        return ResponseEntity.ok(ApiResponse.successMessage("Room deleted successfully"));
    }
}
