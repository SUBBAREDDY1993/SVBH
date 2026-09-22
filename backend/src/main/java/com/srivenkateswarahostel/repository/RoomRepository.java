package com.srivenkateswarahostel.repository;

import com.srivenkateswarahostel.model.Room;
import com.srivenkateswarahostel.model.RoomStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends MongoRepository<Room, String> {
    Optional<Room> findByRoomNumber(String roomNumber);
    boolean existsByRoomNumber(String roomNumber);
    List<Room> findByFloorOrderByRoomNumberAsc(int floor);
    List<Room> findByStatus(RoomStatus status);
    List<Room> findAllByOrderByRoomNumberAsc();
}
