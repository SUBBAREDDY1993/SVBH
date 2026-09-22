package com.srivenkateswarahostel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "allocations")
public class AllocationHistory {

    @Id
    private String id;

    @Indexed
    private String studentId;

    private String studentName;

    private String fromRoom;
    private String fromBedId;

    private String toRoom;
    private String toBedId;

    private LocalDateTime allocationDate;
    private LocalDateTime vacatedDate;

    private AllocationType type;

    private String allocatedBy;
    private String remarks;

    @CreatedDate
    private LocalDateTime createdAt;
}
