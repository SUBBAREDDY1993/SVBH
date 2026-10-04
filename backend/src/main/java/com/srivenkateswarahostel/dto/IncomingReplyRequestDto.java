package com.srivenkateswarahostel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncomingReplyRequestDto {
    private String studentId;
    private String mobileNumber;
    private String senderName;
    private String messageText;
    private String channel; // WHATSAPP, SMS, EMAIL
}
