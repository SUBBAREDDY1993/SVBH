package com.srivenkateswarahostel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncomingReplyResponseDto {
    private String studentId;
    private String studentName;
    private String mobileNumber;
    private String roomNumber;
    private String bedId;
    private String incomingMessage;
    private String autoReplyMessage;
    private String whatsappReplyUrl;
    private String channel;
    private LocalDateTime receivedAt;
    private String status; // AUTO_REPLIED, LOGGED
}
