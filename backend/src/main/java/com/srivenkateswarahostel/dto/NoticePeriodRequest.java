package com.srivenkateswarahostel.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoticePeriodRequest {

    @NotNull(message = "Notice date is required")
    private LocalDate noticeDate;

    @NotNull(message = "Expected vacating date is required")
    private LocalDate expectedVacateDate;

    private String reason;
    private String remarks;
}
