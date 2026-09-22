package com.srivenkateswarahostel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDocument {
    private String id;
    private String documentType; // AADHAAR, PHOTO, STUDENT_ID, OTHER
    private String documentName;
    private String fileUrl; // URL or Base64 / reference
    private LocalDateTime uploadedAt;
}
