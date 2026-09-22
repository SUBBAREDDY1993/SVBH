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
public class BedTransferRequest {

    @NotBlank(message = "Target room number is required")
    private String targetRoomNumber;

    @NotBlank(message = "Target bed ID is required")
    private String targetBedId;

    private String reason;
}
