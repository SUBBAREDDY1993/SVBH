package com.srivenkateswarahostel.dto;

import com.srivenkateswarahostel.model.RoomType;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomUpdateRequest {

    private String roomNumber;

    private int floor;

    private RoomType roomType;

    @Min(value = 0, message = "Default rent cannot be negative")
    private Double defaultRent;

    private String notes;

    private Integer totalBeds;
}
