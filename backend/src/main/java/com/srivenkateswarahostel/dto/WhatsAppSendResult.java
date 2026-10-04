package com.srivenkateswarahostel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WhatsAppSendResult {
    private boolean success;
    private String whatsappMessageId; // wamid
    private String recipientPhone;
    private String rawResponse;
    private String errorMessage;
    private Integer httpStatusCode;

    public static WhatsAppSendResult success(String messageId, String phone, String rawResponse) {
        return WhatsAppSendResult.builder()
                .success(true)
                .whatsappMessageId(messageId)
                .recipientPhone(phone)
                .rawResponse(rawResponse)
                .httpStatusCode(200)
                .build();
    }

    public static WhatsAppSendResult failure(String errorMessage, String phone, String rawResponse, Integer statusCode) {
        return WhatsAppSendResult.builder()
                .success(false)
                .errorMessage(errorMessage)
                .recipientPhone(phone)
                .rawResponse(rawResponse)
                .httpStatusCode(statusCode)
                .build();
    }
}
