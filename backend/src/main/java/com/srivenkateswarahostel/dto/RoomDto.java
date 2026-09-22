package com.srivenkateswarahostel.dto;

import com.srivenkateswarahostel.model.RoomStatus;
import com.srivenkateswarahostel.model.RoomType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomDto {
    private String id;

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    private int floor;

    @Min(value = 1, message = "Total beds must be at least 1")
    private int totalBeds;

    private int occupiedBeds;
    private int availableBeds;
    private RoomStatus status;
    private RoomType roomType;
    private Double defaultRent;
    private String notes;

    private List<BedDto> beds;
}
