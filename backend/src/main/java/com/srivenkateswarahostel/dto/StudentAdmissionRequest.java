package com.srivenkateswarahostel.dto;

import com.srivenkateswarahostel.model.EmergencyContact;
import com.srivenkateswarahostel.model.StudentDocument;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
public class StudentAdmissionRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String fatherName;
    private String motherName;
    private LocalDate dateOfBirth;
    private String gender;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Please enter a valid 10-digit Indian mobile number")
    private String mobileNumber;

    private String alternateMobileNumber;
    private String email;
    private String aadhaarNumber;
    private String address;
    private String city;
    private String state;
    private String pincode;

    @NotNull(message = "Joining date is required")
    private LocalDate joiningDate;

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @NotBlank(message = "Bed ID is required")
    private String bedId;

    @NotNull(message = "Monthly rent is required")
    @Min(value = 1, message = "Monthly rent must be greater than 0")
    private Double monthlyRent;

    @Builder.Default
    private Double securityDeposit = 0.0;

    @Builder.Default
    private int paymentDueDay = 5;

    private EmergencyContact emergencyContact;
    private List<StudentDocument> documents;
}
