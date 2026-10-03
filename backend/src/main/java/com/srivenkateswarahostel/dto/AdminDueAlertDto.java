package com.srivenkateswarahostel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDueAlertDto {
    private String recipientEmail;
    private String recipientMobile;
    private LocalDate alertDate;
    private int dueIn5DaysCount;
    private int dueIn3DaysCount;
    private int dueTodayCount;
    private int totalStudentsCount;
    private double totalAmountDue;
    private List<PaymentDueDto> studentsDueIn5Days;
    private List<PaymentDueDto> studentsDueIn3Days;
    private List<PaymentDueDto> studentsDueToday;
    private String digestMessage;
    private String emailSubject;
    private String emailHtmlBody;
    private String whatsappUrl;
    private String status; // "READY", "SENT", "LOGGED", "ALREADY_SENT_TODAY"
    private boolean emailDelivered;
    private String emailDeliveryMessage;
}
