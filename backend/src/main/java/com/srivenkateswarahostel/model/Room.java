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

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "rooms")
public class Room {

    @Id
    private String id;

    @Indexed(unique = true)
    private String roomNumber;

    private int floor;

    private int totalBeds;

    @Builder.Default
    private int occupiedBeds = 0;

    @Builder.Default
    private int availableBeds = 0;

    @Builder.Default
    private RoomStatus status = RoomStatus.AVAILABLE;

    @Builder.Default
    private RoomType roomType = RoomType.NON_AC;

    private Double defaultRent;

    private String notes;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
