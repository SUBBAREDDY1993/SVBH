package com.srivenkateswarahostel.dto;

import com.srivenkateswarahostel.model.EmergencyContact;
import com.srivenkateswarahostel.model.NoticeInfo;
import com.srivenkateswarahostel.model.StudentDocument;
import com.srivenkateswarahostel.model.StudentStatus;
import com.srivenkateswarahostel.model.VacateInfo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponseDto {
    private String id;
    private String studentId;
    private String fullName;
    private String fatherName;
    private String motherName;
    private LocalDate dateOfBirth;
    private String gender;
    private String mobileNumber;
    private String alternateMobileNumber;
    private String email;
    private String aadhaarNumber;
    private String address;
    private String city;
    private String state;
    private String pincode;

    private LocalDate joiningDate;
    private String roomNumber;
    private String bedId;
    private int bedNumber;

    private Double monthlyRent;
    private Double securityDeposit;
    private int paymentDueDay;
    private LocalDate nextPaymentDueDate;
    private LocalDate lastPaymentDate;

    private String admissionStatus;
    private StudentStatus status;

    private EmergencyContact emergencyContact;
    private List<StudentDocument> documents;
    private NoticeInfo noticeInfo;
    private VacateInfo vacateInfo;

    private boolean isOverdue;
    private long daysOverdue;
    private String paymentStatus; // "PAID", "PENDING", "HALF_PAID"

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
