package com.srivenkateswarahostel.repository;

import com.srivenkateswarahostel.model.Student;
import com.srivenkateswarahostel.model.StudentStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends MongoRepository<Student, String> {
    Optional<Student> findByStudentId(String studentId);
    boolean existsByStudentId(String studentId);
    boolean existsByMobileNumber(String mobileNumber);
    boolean existsByAadhaarNumber(String aadhaarNumber);

    List<Student> findByStatus(StudentStatus status);
    List<Student> findByStatusOrderByFullNameAsc(StudentStatus status);
    List<Student> findByRoomNumber(String roomNumber);
    Optional<Student> findByBedId(String bedId);

    long countByStatus(StudentStatus status);

    @Query("{ $and: [ " +
            "{ 'status': { $ne: 'VACATED' } }, " +
            "{ 'nextPaymentDueDate': { $lte: ?0 } } " +
            "] }")
    List<Student> findOverdueStudents(LocalDate currentDate);

    @Query("{ $and: [ " +
            "{ 'status': { $ne: 'VACATED' } }, " +
            "{ 'nextPaymentDueDate': { $gte: ?0, $lte: ?1 } } " +
            "] }")
    List<Student> findStudentsDueBetween(LocalDate startDate, LocalDate endDate);

    @Query("{ $and: [ " +
            "{ 'status': 'NOTICE_PERIOD' }, " +
            "{ 'noticeInfo.expectedVacateDate': { $gte: ?0, $lte: ?1 } } " +
            "] }")
    List<Student> findStudentsLeavingSoon(LocalDate startDate, LocalDate endDate);

    @Query("{ $or: [ " +
            "{ 'fullName': { $regex: ?0, $options: 'i' } }, " +
            "{ 'studentId': { $regex: ?0, $options: 'i' } }, " +
            "{ 'mobileNumber': { $regex: ?0, $options: 'i' } }, " +
            "{ 'aadhaarNumber': { $regex: ?0, $options: 'i' } }, " +
            "{ 'roomNumber': { $regex: ?0, $options: 'i' } }, " +
            "{ 'bedId': { $regex: ?0, $options: 'i' } } " +
            "] }")
    List<Student> searchStudents(String keyword);
}
