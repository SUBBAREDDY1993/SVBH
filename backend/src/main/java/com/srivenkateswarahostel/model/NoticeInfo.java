package com.srivenkateswarahostel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoticeInfo {
    private LocalDate noticeDate;
    private LocalDate expectedVacateDate;
    private String reason;
    private String remarks;
}
