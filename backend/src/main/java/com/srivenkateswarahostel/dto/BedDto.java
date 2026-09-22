package com.srivenkateswarahostel.dto;

import com.srivenkateswarahostel.model.BedStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BedDto {
    private String id;
    private String bedId;
    private String roomNumber;
    private int bedNumber;
    private BedStatus status;
    private String studentId;
    private String studentName;
    private LocalDate allocationDate;
    private String notes;
}
