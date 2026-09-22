package com.srivenkateswarahostel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "beds")
@CompoundIndex(name = "room_bed_idx", def = "{'roomNumber': 1, 'bedNumber': 1}", unique = true)
public class Bed {

    @Id
    private String id;

    @Indexed(unique = true)
    private String bedId; // e.g. "B101-1", "B101-2"

    @Indexed
    private String roomNumber;

    private int bedNumber;

    @Builder.Default
    private BedStatus status = BedStatus.AVAILABLE;

    @Indexed
    private String studentId;

    private String studentName;

    private LocalDate allocationDate;

    private String notes;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
