package com.srivenkateswarahostel.repository;

import com.srivenkateswarahostel.model.AllocationHistory;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AllocationHistoryRepository extends MongoRepository<AllocationHistory, String> {
    List<AllocationHistory> findByStudentIdOrderByAllocationDateDesc(String studentId);
    List<AllocationHistory> findAllByOrderByAllocationDateDesc();
}
