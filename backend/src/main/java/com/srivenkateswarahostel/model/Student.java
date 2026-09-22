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
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "students")
public class Student {

    @Id
    private String id;

    @Indexed(unique = true)
    private String studentId; // e.g. SVBH-2026-001

    @Indexed
    private String fullName;

    private String fatherName;
    private String motherName;
    private LocalDate dateOfBirth;
    private String gender;

    @Indexed
    private String mobileNumber;
    private String alternateMobileNumber;
    private String email;

    @Indexed
    private String aadhaarNumber;
    private String address;
    private String city;
    private String state;
    private String pincode;

    // Hostel Details
    private LocalDate joiningDate;

    @Indexed
    private String roomNumber;

    @Indexed
    private String bedId;
    private int bedNumber;

    private Double monthlyRent;
    private Double securityDeposit;
    private int paymentDueDay; // e.g. 5th of every month
    
    @Indexed
    private LocalDate nextPaymentDueDate;
    private LocalDate lastPaymentDate;

    @Builder.Default
    private String admissionStatus = "CONFIRMED";

    @Indexed
    @Builder.Default
    private StudentStatus status = StudentStatus.ACTIVE;

    private EmergencyContact emergencyContact;

    @Builder.Default
    private List<StudentDocument> documents = new ArrayList<>();

    private NoticeInfo noticeInfo;
    private VacateInfo vacateInfo;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
