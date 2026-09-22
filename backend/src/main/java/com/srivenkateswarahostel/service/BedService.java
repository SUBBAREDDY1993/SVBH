package com.srivenkateswarahostel.service;

import com.srivenkateswarahostel.dto.BedDto;
import com.srivenkateswarahostel.exception.BadRequestException;
import com.srivenkateswarahostel.exception.ResourceNotFoundException;
import com.srivenkateswarahostel.model.Bed;
import com.srivenkateswarahostel.model.BedStatus;
import com.srivenkateswarahostel.repository.BedRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BedService {

    private final BedRepository bedRepository;
    private final RoomService roomService;
    private final AuditService auditService;

    public List<BedDto> getAllBeds(BedStatus status, String roomNumber) {
        List<Bed> beds;
        if (roomNumber != null && !roomNumber.isBlank()) {
            beds = bedRepository.findByRoomNumberOrderByBedNumberAsc(roomNumber);
            if (status != null) {
                beds = beds.stream().filter(b -> b.getStatus() == status).collect(Collectors.toList());
            }
        } else if (status != null) {
            beds = bedRepository.findByStatusOrderByRoomNumberAscBedNumberAsc(status);
        } else {
            beds = bedRepository.findAll();
        }

        return beds.stream().map(roomService::toBedDto).collect(Collectors.toList());
    }

    public BedDto getBedById(String bedId) {
        Bed bed = bedRepository.findByBedId(bedId)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found: " + bedId));
        return roomService.toBedDto(bed);
    }

    @Transactional
    public BedDto updateBedStatus(String bedId, BedStatus newStatus, String notes) {
        Bed bed = bedRepository.findByBedId(bedId)
                .orElseThrow(() -> new ResourceNotFoundException("Bed not found: " + bedId));

        if (bed.getStatus() == BedStatus.OCCUPIED && newStatus != BedStatus.OCCUPIED) {
            throw new BadRequestException("Cannot change status of occupied bed directly. Vacate or transfer student first.");
        }

        bed.setStatus(newStatus);
        if (notes != null) {
            bed.setNotes(notes);
        }
        bed.setUpdatedAt(LocalDateTime.now());

        Bed saved = bedRepository.save(bed);
        roomService.syncRoomStats(saved.getRoomNumber());

        auditService.log("UPDATE_STATUS", "BED", saved.getBedId(),
                "Bed " + saved.getBedId() + " status changed to " + newStatus);

        return roomService.toBedDto(saved);
    }

    @Transactional
    public BedDto addBedToRoom(String roomNumber) {
        List<Bed> existingBeds = bedRepository.findByRoomNumberOrderByBedNumberAsc(roomNumber);
        int nextBedNum = existingBeds.size() + 1;
        String newBedId = "B" + roomNumber + "-" + nextBedNum;

        Bed bed = Bed.builder()
                .bedId(newBedId)
                .roomNumber(roomNumber)
                .bedNumber(nextBedNum)
                .status(BedStatus.AVAILABLE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Bed saved = bedRepository.save(bed);
        roomService.syncRoomStats(roomNumber);

        auditService.log("CREATE", "BED", saved.getBedId(), "Added bed " + saved.getBedId() + " to room " + roomNumber);
        return roomService.toBedDto(saved);
    }
}
