package com.srivenkateswarahostel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OccupancyReportDto {
    private int totalBeds;
    private int occupiedBeds;
    private int availableBeds;
    private int reservedBeds;
    private int maintenanceBeds;
    private double occupancyPercentage;

    private List<FloorOccupancy> floorBreakdown;
    private List<RoomDto> roomBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FloorOccupancy {
        private int floor;
        private int totalBeds;
        private int occupiedBeds;
        private int availableBeds;
        private double occupancyPercentage;
    }
}
