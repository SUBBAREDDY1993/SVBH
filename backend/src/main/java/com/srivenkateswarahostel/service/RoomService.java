package com.srivenkateswarahostel.service;

import com.srivenkateswarahostel.dto.BedDto;
import com.srivenkateswarahostel.dto.RoomDto;
import com.srivenkateswarahostel.exception.BadRequestException;
import com.srivenkateswarahostel.exception.DuplicateResourceException;
import com.srivenkateswarahostel.exception.ResourceNotFoundException;
import com.srivenkateswarahostel.model.Bed;
import com.srivenkateswarahostel.model.BedStatus;
import com.srivenkateswarahostel.model.Room;
import com.srivenkateswarahostel.model.RoomStatus;
import com.srivenkateswarahostel.repository.BedRepository;
import com.srivenkateswarahostel.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final AuditService auditService;

    public List<RoomDto> getAllRooms(boolean includeBeds) {
        List<Room> rooms = roomRepository.findAllByOrderByRoomNumberAsc();
        return rooms.stream()
                .map(room -> toRoomDto(room, includeBeds))
                .collect(Collectors.toList());
    }

    public RoomDto getRoomByNumber(String roomNumber) {
        Room room = roomRepository.findByRoomNumber(roomNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found: " + roomNumber));
        return toRoomDto(room, true);
    }

    @Transactional
    public RoomDto createRoom(RoomDto roomDto) {
        if (roomRepository.existsByRoomNumber(roomDto.getRoomNumber())) {
            throw new DuplicateResourceException("Room already exists with number: " + roomDto.getRoomNumber());
        }

        Room room = Room.builder()
                .roomNumber(roomDto.getRoomNumber().trim().toUpperCase())
                .floor(roomDto.getFloor())
                .totalBeds(roomDto.getTotalBeds())
                .occupiedBeds(0)
                .availableBeds(roomDto.getTotalBeds())
                .status(RoomStatus.AVAILABLE)
                .roomType(roomDto.getRoomType() != null ? roomDto.getRoomType() : com.srivenkateswarahostel.model.RoomType.NON_AC)
                .defaultRent(roomDto.getDefaultRent() != null ? roomDto.getDefaultRent() : 5000.0)
                .notes(roomDto.getNotes())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Room savedRoom = roomRepository.save(room);

        // Automatically create beds for this room
        List<Bed> beds = new ArrayList<>();
        for (int i = 1; i <= room.getTotalBeds(); i++) {
            Bed bed = Bed.builder()
                    .bedId("B" + room.getRoomNumber() + "-" + i)
                    .roomNumber(room.getRoomNumber())
                    .bedNumber(i)
                    .status(BedStatus.AVAILABLE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            beds.add(bed);
        }
        bedRepository.saveAll(beds);

        auditService.log("CREATE", "ROOM", savedRoom.getId(),
                "Created Room " + savedRoom.getRoomNumber() + " with " + savedRoom.getTotalBeds() + " beds");

        return toRoomDto(savedRoom, true);
    }

    @Transactional
    public RoomDto updateRoom(String id, RoomDto roomDto) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + id));

        room.setFloor(roomDto.getFloor());
        if (roomDto.getRoomType() != null) {
            room.setRoomType(roomDto.getRoomType());
        }
        if (roomDto.getDefaultRent() != null) {
            room.setDefaultRent(roomDto.getDefaultRent());
        }
        room.setNotes(roomDto.getNotes());
        room.setUpdatedAt(LocalDateTime.now());

        Room updated = roomRepository.save(room);
        syncRoomStats(updated.getRoomNumber());

        auditService.log("UPDATE", "ROOM", updated.getId(), "Updated Room " + updated.getRoomNumber());
        return toRoomDto(updated, true);
    }

    @Transactional
    public void deleteRoom(String id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + id));

        List<Bed> beds = bedRepository.findByRoomNumberOrderByBedNumberAsc(room.getRoomNumber());
        boolean hasOccupiedBeds = beds.stream()
                .anyMatch(bed -> bed.getStatus() == BedStatus.OCCUPIED || bed.getStatus() == BedStatus.RESERVED);

        if (hasOccupiedBeds) {
            throw new BadRequestException("Cannot delete Room " + room.getRoomNumber() + " because it contains occupied or reserved beds");
        }

        bedRepository.deleteByRoomNumber(room.getRoomNumber());
        roomRepository.delete(room);

        auditService.log("DELETE", "ROOM", id, "Deleted Room " + room.getRoomNumber() + " and its beds");
    }

    public void syncRoomStats(String roomNumber) {
        roomRepository.findByRoomNumber(roomNumber).ifPresent(room -> {
            List<Bed> beds = bedRepository.findByRoomNumberOrderByBedNumberAsc(roomNumber);
            int total = beds.size();
            int occupied = (int) beds.stream().filter(b -> b.getStatus() == BedStatus.OCCUPIED).count();
            int reserved = (int) beds.stream().filter(b -> b.getStatus() == BedStatus.RESERVED).count();
            int available = (int) beds.stream().filter(b -> b.getStatus() == BedStatus.AVAILABLE).count();

            room.setTotalBeds(total);
            room.setOccupiedBeds(occupied);
            room.setAvailableBeds(available);

            if (occupied + reserved >= total && total > 0) {
                room.setStatus(RoomStatus.FULLY_OCCUPIED);
            } else if (occupied > 0 || reserved > 0) {
                room.setStatus(RoomStatus.PARTIALLY_OCCUPIED);
            } else {
                room.setStatus(RoomStatus.AVAILABLE);
            }
            roomRepository.save(room);
        });
    }

    public RoomDto toRoomDto(Room room, boolean includeBeds) {
        List<BedDto> bedDtos = null;
        if (includeBeds) {
            bedDtos = bedRepository.findByRoomNumberOrderByBedNumberAsc(room.getRoomNumber()).stream()
                    .map(this::toBedDto)
                    .collect(Collectors.toList());
        }

        return RoomDto.builder()
                .id(room.getId())
                .roomNumber(room.getRoomNumber())
                .floor(room.getFloor())
                .totalBeds(room.getTotalBeds())
                .occupiedBeds(room.getOccupiedBeds())
                .availableBeds(room.getAvailableBeds())
                .status(room.getStatus())
                .roomType(room.getRoomType())
                .defaultRent(room.getDefaultRent())
                .notes(room.getNotes())
                .beds(bedDtos)
                .build();
    }

    public BedDto toBedDto(Bed bed) {
        return BedDto.builder()
                .id(bed.getId())
                .bedId(bed.getBedId())
                .roomNumber(bed.getRoomNumber())
                .bedNumber(bed.getBedNumber())
                .status(bed.getStatus())
                .studentId(bed.getStudentId())
                .studentName(bed.getStudentName())
                .allocationDate(bed.getAllocationDate())
                .notes(bed.getNotes())
                .build();
    }
}
