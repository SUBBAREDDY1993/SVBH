package com.srivenkateswarahostel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "payments")
public class Payment {

    @Id
    private String id;

    @Indexed(unique = true)
    private String receiptNumber;

    @Indexed
    private String studentId;

    private String studentName;
    private String roomNumber;
    private int bedNumber;

    private Double amount;
    private LocalDate paymentDate;

    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.CASH;

    @Builder.Default
    private PaymentType paymentType = PaymentType.MONTHLY_RENT;

    @Indexed
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.PAID;

    private String transactionReference;
    private Double previousBalance;
    private Double remainingBalance;
    private String rentForMonth; // e.g. "September 2026"
    private String remarks;
    private String recordedBy;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
