package com.srivenkateswarahostel.dto;

import com.srivenkateswarahostel.model.PaymentMethod;
import com.srivenkateswarahostel.model.PaymentStatus;
import com.srivenkateswarahostel.model.PaymentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponseDto {
    private String id;
    private String receiptNumber;
    private String studentId;
    private String studentName;
    private String roomNumber;
    private int bedNumber;
    private Double amount;
    private LocalDate paymentDate;
    private PaymentMethod paymentMethod;
    private PaymentType paymentType;
    private PaymentStatus paymentStatus;
    private String transactionReference;
    private Double previousBalance;
    private Double remainingBalance;
    private String rentForMonth;
    private String remarks;
    private String recordedBy;
    private LocalDateTime createdAt;
}
