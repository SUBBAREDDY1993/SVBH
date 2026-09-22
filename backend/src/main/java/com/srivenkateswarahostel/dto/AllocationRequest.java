package com.srivenkateswarahostel.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllocationRequest {

    @NotBlank(message = "Student ID is required")
    private String studentId;

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotBlank(message = "Bed ID is required")
    private String bedId;

    private String remarks;
}
