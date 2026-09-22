package com.srivenkateswarahostel.repository;

import com.srivenkateswarahostel.model.Bed;
import com.srivenkateswarahostel.model.BedStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BedRepository extends MongoRepository<Bed, String> {
    Optional<Bed> findByBedId(String bedId);
    Optional<Bed> findByRoomNumberAndBedNumber(String roomNumber, int bedNumber);
    List<Bed> findByRoomNumberOrderByBedNumberAsc(String roomNumber);
    List<Bed> findByStatus(BedStatus status);
    List<Bed> findByStatusOrderByRoomNumberAscBedNumberAsc(BedStatus status);
    Optional<Bed> findByStudentId(String studentId);
    long countByStatus(BedStatus status);
    void deleteByRoomNumber(String roomNumber);
}
