package com.srivenkateswarahostel.dto;

import com.srivenkateswarahostel.model.EmergencyContact;
import com.srivenkateswarahostel.model.StudentDocument;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
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
public class StudentUpdateRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String fatherName;
    private String motherName;
    private LocalDate dateOfBirth;
    private String gender;

    @NotBlank(message = "Mobile number is required")
    private String mobileNumber;

    private String alternateMobileNumber;
    private String email;
    private String aadhaarNumber;
    private String address;
    private String city;
    private String state;
    private String pincode;

    @Min(value = 1, message = "Monthly rent must be greater than 0")
    private Double monthlyRent;

    private Double securityDeposit;
    private int paymentDueDay;

    private EmergencyContact emergencyContact;
    private List<StudentDocument> documents;
}
