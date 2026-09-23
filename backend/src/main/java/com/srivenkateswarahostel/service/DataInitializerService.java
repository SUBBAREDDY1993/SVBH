package com.srivenkateswarahostel.service;

import com.srivenkateswarahostel.model.*;
import com.srivenkateswarahostel.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataInitializerService implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final StudentRepository studentRepository;
    private final PaymentRepository paymentRepository;
    private final AllocationHistoryRepository allocationHistoryRepository;
    private final HostelSettingRepository hostelSettingRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoomService roomService;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Value("${app.admin.email:admin@svboyshostel.com}")
    private String adminEmail;

    @Value("${app.admin.name:Hostel Administrator}")
    private String adminName;

    @Override
    public void run(String... args) {
        initAdminUser();
        initHostelSettings();
        if (bedRepository.count() == 0 || !roomRepository.existsByRoomNumber("601") || roomRepository.existsByRoomNumber("104")) {
            log.info("Initializing layout to 6 floors (16 rooms, exactly 70 beds)...");
            initRoomsAndBeds();
            roomRepository.findAll().forEach(room -> roomService.syncRoomStats(room.getRoomNumber()));
        } else {
            log.info("Database initialized with {} beds across {} rooms.", bedRepository.count(), roomRepository.count());
        }
    }

    public void initAdminUser() {
        if (!userRepository.existsByUsername(adminUsername)) {
            User admin = User.builder()
                    .username(adminUsername)
                    .password(passwordEncoder.encode(adminPassword))
                    .fullName(adminName)
                    .email(adminEmail)
                    .role(Role.ROLE_ADMIN)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(admin);
            log.info("Default Admin user created successfully: {}", adminUsername);
        }

        if (!userRepository.existsByUsername("staff")) {
            User staff = User.builder()
                    .username("staff")
                    .password(passwordEncoder.encode("staff123"))
                    .fullName("Warden Srinivas")
                    .email("staff@svboyshostel.com")
                    .role(Role.ROLE_STAFF)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(staff);
            log.info("Default Staff user created: staff / staff123");
        }
    }

    public void initHostelSettings() {
        HostelSetting setting = hostelSettingRepository.findAll().stream().findFirst().orElse(null);
        if (setting == null) {
            setting = HostelSetting.builder()
                    .hostelName("Sri Venkateswara Boys Hostel")
                    .address("Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038")
                    .contactNumber("+91 9441843574")
                    .email("svbhostel2026@gmail.com")
                    .totalBeds(70)
                    .defaultMonthlyRent(5000.0)
                    .defaultSecurityDeposit(5000.0)
                    .paymentGracePeriodDays(5)
                    .currency("INR")
                    .demoDataLoaded(false)
                    .build();
            hostelSettingRepository.save(setting);
        } else if (setting.getAddress() == null || setting.getAddress().contains("Tirupati") || setting.getContactNumber().contains("98765")) {
            setting.setAddress("Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038");
            setting.setContactNumber("+91 9441843574");
            setting.setEmail("svbhostel2026@gmail.com");
            hostelSettingRepository.save(setting);
        }
    }

    public synchronized void initRoomsAndBeds() {
        bedRepository.deleteAll();
        roomRepository.deleteAll();

        // Floor 1: 3 rooms (4 + 4 + 5 = 13 beds)
        createRoomWithBeds("101", 1, 4, RoomType.ATTACHED_BATHROOM, 5500.0, "Deluxe 4-sharing with attached bathroom");
        createRoomWithBeds("102", 1, 4, RoomType.NON_AC, 5000.0, "Standard 4-sharing room");
        createRoomWithBeds("103", 1, 5, RoomType.NON_AC, 4800.0, "Spacious 5-sharing room");

        // Floor 2: 3 rooms (4 + 4 + 5 = 13 beds)
        createRoomWithBeds("201", 2, 4, RoomType.ATTACHED_BATHROOM, 5500.0, "Deluxe 4-sharing with attached bathroom");
        createRoomWithBeds("202", 2, 4, RoomType.NON_AC, 5000.0, "Standard 4-sharing room");
        createRoomWithBeds("203", 2, 5, RoomType.NON_AC, 4800.0, "Spacious 5-sharing room");

        // Floor 3: 3 rooms (4 + 4 + 5 = 13 beds)
        createRoomWithBeds("301", 3, 4, RoomType.NON_AC, 5000.0, "Standard 4-sharing room");
        createRoomWithBeds("302", 3, 4, RoomType.NON_AC, 5000.0, "Standard 4-sharing room");
        createRoomWithBeds("303", 3, 5, RoomType.NON_AC, 4800.0, "Spacious 5-sharing room");

        // Floor 4: 3 rooms (4 + 4 + 5 = 13 beds)
        createRoomWithBeds("401", 4, 4, RoomType.NON_AC, 5000.0, "Standard 4-sharing room");
        createRoomWithBeds("402", 4, 4, RoomType.NON_AC, 5000.0, "Standard 4-sharing room");
        createRoomWithBeds("403", 4, 5, RoomType.NON_AC, 4800.0, "Spacious 5-sharing room");

        // Floor 5: 3 rooms (4 + 4 + 5 = 13 beds)
        createRoomWithBeds("501", 5, 4, RoomType.AC, 6500.0, "Premium AC 4-sharing room");
        createRoomWithBeds("502", 5, 4, RoomType.AC, 6500.0, "Premium AC 4-sharing room");
        createRoomWithBeds("503", 5, 5, RoomType.NON_AC, 4800.0, "Spacious 5-sharing room");

        // Floor 6: 1 room (5 beds)
        createRoomWithBeds("601", 6, 5, RoomType.AC, 6000.0, "Penthouse AC 5-sharing room");

        log.info("Initialized 16 rooms with exactly 70 beds across 6 floors.");
    }

    public synchronized void clearDemoData() {
        log.info("Clearing all dummy data (students, payments, allocations)...");
        studentRepository.deleteAll();
        paymentRepository.deleteAll();
        allocationHistoryRepository.deleteAll();

        // Ensure 16 rooms and 70 beds exist
        if (bedRepository.count() != 70 || roomRepository.count() != 16) {
            initRoomsAndBeds();
        } else {
            // Reset all existing beds to AVAILABLE
            List<Bed> beds = bedRepository.findAll();
            for (Bed bed : beds) {
                bed.setStatus(BedStatus.AVAILABLE);
                bed.setStudentId(null);
                bed.setStudentName(null);
                bed.setAllocationDate(null);
                bed.setUpdatedAt(LocalDateTime.now());
            }
            bedRepository.saveAll(beds);
        }

        // Sync room statistics for all rooms
        roomRepository.findAll().forEach(room -> roomService.syncRoomStats(room.getRoomNumber()));

        // Mark settings as live / not demo data
        hostelSettingRepository.findAll().stream().findFirst().ifPresent(setting -> {
            setting.setDemoDataLoaded(false);
            hostelSettingRepository.save(setting);
        });

        log.info("Successfully cleared all dummy data. System is ready for real records with 70 available beds.");
    }

    public synchronized void seedDemoData() {
        // Clear non-user collections before demo seed
        studentRepository.deleteAll();
        paymentRepository.deleteAll();
        allocationHistoryRepository.deleteAll();

        // Ensure 16 rooms and 70 beds exist
        initRoomsAndBeds();

        // 2. Seed Sample Students (10 Active, 1 Notice Period, 1 Vacated)
        LocalDate today = LocalDate.now();

        // Student 1: Ravi Kumar (OVERDUE demo)
        createDemoStudent("SVBH-2026-001", "Ravi Kumar", "Venkat Rao", "Lakshmi",
                LocalDate.of(2002, 5, 14), "Male", "9876543211", "ravi.kumar@example.com",
                "123456789012", "Gandhi Road, Nellore", "Nellore", "Andhra Pradesh", "524001",
                today.minusMonths(3), "203", "B203-1", 1, 5000.0, 5000.0, 5,
                today.minusDays(17), today.minusMonths(1).minusDays(17), // OVERDUE
                StudentStatus.ACTIVE, null, null,
                new EmergencyContact("Venkat Rao", "Father", "9876543210"));

        // Student 2: K. Suresh
        createDemoStudent("SVBH-2026-002", "K. Suresh", "K. Narayana", "Parvathi",
                LocalDate.of(2003, 8, 20), "Male", "9876543212", "suresh.k@example.com",
                "234567890123", "Main Bazar, Kadapa", "Kadapa", "Andhra Pradesh", "516001",
                today.minusMonths(4), "101", "B101-1", 1, 5500.0, 5000.0, 5,
                today.plusDays(15), today.minusDays(15),
                StudentStatus.ACTIVE, null, null,
                new EmergencyContact("K. Narayana", "Father", "9876543213"));

        // Student 3: P. Sai Teja
        createDemoStudent("SVBH-2026-003", "P. Sai Teja", "P. Srinivas", "Sujatha",
                LocalDate.of(2001, 11, 10), "Male", "9876543214", "saiteja.p@example.com",
                "345678901234", "Brundavan Colony, Vijayawada", "Vijayawada", "Andhra Pradesh", "520001",
                today.minusMonths(2), "101", "B101-2", 2, 5500.0, 5000.0, 5,
                today.plusDays(12), today.minusDays(18),
                StudentStatus.ACTIVE, null, null,
                new EmergencyContact("P. Srinivas", "Father", "9876543215"));

        // Student 4: M. Akhil Reddy (DUE SOON demo - 3 days ahead)
        createDemoStudent("SVBH-2026-004", "M. Akhil Reddy", "M. Pratap Reddy", "Radha",
                LocalDate.of(2003, 3, 25), "Male", "9876543216", "akhil.reddy@example.com",
                "456789012345", "R.T.C. Colony, Chittoor", "Chittoor", "Andhra Pradesh", "517001",
                today.minusMonths(2), "102", "B102-1", 1, 5000.0, 5000.0, 5,
                today.plusDays(3), today.minusDays(27), // DUE SOON
                StudentStatus.ACTIVE, null, null,
                new EmergencyContact("M. Pratap Reddy", "Father", "9876543217"));

        // Student 5: B. Manoj Kumar
        createDemoStudent("SVBH-2026-005", "B. Manoj Kumar", "B. Ramaiah", "Saraswathi",
                LocalDate.of(2002, 7, 18), "Male", "9876543218", "manoj.b@example.com",
                "567890123456", "Tilak Road, Tirupati", "Tirupati", "Andhra Pradesh", "517501",
                today.minusMonths(5), "103", "B103-1", 1, 5000.0, 5000.0, 5,
                today.plusDays(20), today.minusDays(10),
                StudentStatus.ACTIVE, null, null,
                new EmergencyContact("B. Ramaiah", "Father", "9876543219"));

        // Student 6: V. Mahesh
        createDemoStudent("SVBH-2026-006", "V. Mahesh", "V. Subba Rao", "Padma",
                LocalDate.of(2004, 1, 15), "Male", "9876543220", "mahesh.v@example.com",
                "678901234567", "Balaji Colony, Tirupati", "Tirupati", "Andhra Pradesh", "517502",
                today.minusMonths(1), "103", "B103-2", 2, 4800.0, 5000.0, 10,
                today.plusDays(25), today.minusDays(5),
                StudentStatus.ACTIVE, null, null,
                new EmergencyContact("V. Subba Rao", "Father", "9876543221"));

        // Student 7: N. Tarun
        createDemoStudent("SVBH-2026-007", "N. Tarun", "N. Chandrasekhar", "Kavitha",
                LocalDate.of(2003, 9, 5), "Male", "9876543222", "tarun.n@example.com",
                "789012345678", "Ashok Nagar, Kurnool", "Kurnool", "Andhra Pradesh", "518001",
                today.minusMonths(3), "201", "B201-1", 1, 5500.0, 5000.0, 5,
                today.plusDays(10), today.minusDays(20),
                StudentStatus.ACTIVE, null, null,
                new EmergencyContact("N. Chandrasekhar", "Father", "9876543223"));

        // Student 8: G. Harshavardhan
        createDemoStudent("SVBH-2026-008", "G. Harshavardhan", "G. Mallikarjun", "Bhavani",
                LocalDate.of(2002, 12, 12), "Male", "9876543224", "harsha.g@example.com",
                "890123456789", "Collectorate Road, Anantapur", "Anantapur", "Andhra Pradesh", "515001",
                today.minusMonths(2), "201", "B201-2", 2, 5500.0, 5000.0, 5,
                today.plusDays(8), today.minusDays(22),
                StudentStatus.ACTIVE, null, null,
                new EmergencyContact("G. Mallikarjun", "Father", "9876543225"));

        // Student 9: D. Karthik (OVERDUE demo - 5 days overdue)
        createDemoStudent("SVBH-2026-009", "D. Karthik", "D. Govind", "Sandhya",
                LocalDate.of(2003, 4, 30), "Male", "9876543226", "karthik.d@example.com",
                "901234567890", "RTC Bus Stand Road, Ongole", "Ongole", "Andhra Pradesh", "523001",
                today.minusMonths(3), "202", "B202-1", 1, 5000.0, 5000.0, 5,
                today.minusDays(5), today.minusMonths(1).minusDays(5), // OVERDUE
                StudentStatus.ACTIVE, null, null,
                new EmergencyContact("D. Govind", "Father", "9876543227"));

        // Student 10: S. Naveen
        createDemoStudent("SVBH-2026-010", "S. Naveen", "S. Krishna", "Lalitha",
                LocalDate.of(2002, 6, 22), "Male", "9876543228", "naveen.s@example.com",
                "112233445566", "Vidyanagar, Guntur", "Guntur", "Andhra Pradesh", "522001",
                today.minusMonths(2), "301", "B301-1", 1, 5000.0, 5000.0, 5,
                today.plusDays(18), today.minusDays(12),
                StudentStatus.ACTIVE, null, null,
                new EmergencyContact("S. Krishna", "Father", "9876543229"));

        // Student 11: K. Lokesh (NOTICE PERIOD demo)
        NoticeInfo noticeInfo = NoticeInfo.builder()
                .noticeDate(today.minusDays(10))
                .expectedVacateDate(today.plusDays(10))
                .reason("Course completion and campus placement")
                .remarks("Leaving for job in Bangalore")
                .build();
        createDemoStudent("SVBH-2026-011", "K. Lokesh", "K. Prabhakar", "Usha",
                LocalDate.of(2001, 10, 14), "Male", "9876543230", "lokesh.k@example.com",
                "223344556677", "Park Road, Rajahmundry", "Rajahmundry", "Andhra Pradesh", "533101",
                today.minusMonths(6), "302", "B302-1", 1, 5000.0, 5000.0, 5,
                today.plusDays(5), today.minusDays(25),
                StudentStatus.NOTICE_PERIOD, noticeInfo, null,
                new EmergencyContact("K. Prabhakar", "Father", "9876543231"));

        // Student 12: P. Kalyan (VACATED demo - bed is now free)
        VacateInfo vacateInfo = VacateInfo.builder()
                .vacateDate(today.minusDays(12))
                .reason("Transferred to another college in Hyderabad")
                .refundAmount(5000.0)
                .finalPayment(0.0)
                .remarks("Deposit refunded via UPI. No pending balance.")
                .build();
        createDemoStudent("SVBH-2026-012", "P. Kalyan", "P. Raman", "Meena",
                LocalDate.of(2002, 2, 17), "Male", "9876543232", "kalyan.p@example.com",
                "334455667788", "Railway Station Road, Madanapalle", "Madanapalle", "Andhra Pradesh", "517325",
                today.minusMonths(8), null, null, 0, 5000.0, 5000.0, 5,
                null, today.minusDays(40),
                StudentStatus.VACATED, null, vacateInfo,
                new EmergencyContact("P. Raman", "Father", "9876543233"));

        // 3. Seed Sample Payments for these students
        seedSamplePayments();

        // 4. Sync Room Stats for all rooms
        roomRepository.findAll().forEach(room -> roomService.syncRoomStats(room.getRoomNumber()));

        // Mark settings as demo data loaded
        hostelSettingRepository.findAll().stream().findFirst().ifPresent(setting -> {
            setting.setDemoDataLoaded(true);
            hostelSettingRepository.save(setting);
        });

        log.info("Demo data initialized successfully with 70 beds, 16 rooms across 6 floors, 12 students, and payments.");
    }

    private void createRoomWithBeds(String roomNum, int floor, int totalBeds, RoomType type, Double rent, String notes) {
        Room room = Room.builder()
                .roomNumber(roomNum)
                .floor(floor)
                .totalBeds(totalBeds)
                .occupiedBeds(0)
                .availableBeds(totalBeds)
                .status(RoomStatus.AVAILABLE)
                .roomType(type)
                .defaultRent(rent)
                .notes(notes)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        roomRepository.save(room);

        List<Bed> beds = new ArrayList<>();
        for (int i = 1; i <= totalBeds; i++) {
            Bed bed = Bed.builder()
                    .bedId("B" + roomNum + "-" + i)
                    .roomNumber(roomNum)
                    .bedNumber(i)
                    .status(BedStatus.AVAILABLE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            beds.add(bed);
        }
        bedRepository.saveAll(beds);
    }

    private void createDemoStudent(String studentId, String fullName, String father, String mother,
                                   LocalDate dob, String gender, String mobile, String email,
                                   String aadhaar, String addr, String city, String state, String pincode,
                                   LocalDate joiningDate, String roomNum, String bedId, int bedNum,
                                   Double rent, Double deposit, int dueDay, LocalDate nextDue, LocalDate lastPayment,
                                   StudentStatus status, NoticeInfo noticeInfo, VacateInfo vacateInfo,
                                   EmergencyContact emergencyContact) {
        Student student = Student.builder()
                .studentId(studentId)
                .fullName(fullName)
                .fatherName(father)
                .motherName(mother)
                .dateOfBirth(dob)
                .gender(gender)
                .mobileNumber(mobile)
                .email(email)
                .aadhaarNumber(aadhaar)
                .address(addr)
                .city(city)
                .state(state)
                .pincode(pincode)
                .joiningDate(joiningDate)
                .roomNumber(roomNum)
                .bedId(bedId)
                .bedNumber(bedNum)
                .monthlyRent(rent)
                .securityDeposit(deposit)
                .paymentDueDay(dueDay)
                .nextPaymentDueDate(nextDue)
                .lastPaymentDate(lastPayment)
                .admissionStatus("CONFIRMED")
                .status(status)
                .noticeInfo(noticeInfo)
                .vacateInfo(vacateInfo)
                .emergencyContact(emergencyContact)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        studentRepository.save(student);

        // If allocated to a bed, mark the bed OCCUPIED
        if (bedId != null && status != StudentStatus.VACATED) {
            bedRepository.findByBedId(bedId).ifPresent(bed -> {
                bed.setStatus(BedStatus.OCCUPIED);
                bed.setStudentId(studentId);
                bed.setStudentName(fullName);
                bed.setAllocationDate(joiningDate);
                bedRepository.save(bed);
            });

            // Record initial allocation history
            AllocationHistory history = AllocationHistory.builder()
                    .studentId(studentId)
                    .studentName(fullName)
                    .toRoom(roomNum)
                    .toBedId(bedId)
                    .allocationDate(joiningDate.atStartOfDay())
                    .type(AllocationType.INITIAL)
                    .allocatedBy("ADMIN")
                    .remarks("Initial allocation")
                    .createdAt(LocalDateTime.now())
                    .build();
            allocationHistoryRepository.save(history);
        }
    }

    private void seedSamplePayments() {
        LocalDate today = LocalDate.now();

        // Payments for Suresh
        createPayment("REC-2026-0001", "SVBH-2026-002", "K. Suresh", "101", 1, 5500.0,
                today.minusDays(15), PaymentMethod.UPI, PaymentType.MONTHLY_RENT, "UPI-REF-981245");
        createPayment("REC-2026-0002", "SVBH-2026-002", "K. Suresh", "101", 1, 5500.0,
                today.minusMonths(1).minusDays(15), PaymentMethod.CASH, PaymentType.MONTHLY_RENT, "CASH-REC-101");

        // Payments for Sai Teja
        createPayment("REC-2026-0003", "SVBH-2026-003", "P. Sai Teja", "101", 2, 5500.0,
                today.minusDays(18), PaymentMethod.UPI, PaymentType.MONTHLY_RENT, "UPI-REF-552199");

        // Payments for Akhil Reddy
        createPayment("REC-2026-0004", "SVBH-2026-004", "M. Akhil Reddy", "102", 1, 5000.0,
                today.minusDays(27), PaymentMethod.BANK_TRANSFER, PaymentType.MONTHLY_RENT, "IMPS-44332211");

        // Payments for Manoj Kumar
        createPayment("REC-2026-0005", "SVBH-2026-005", "B. Manoj Kumar", "103", 1, 5000.0,
                today.minusDays(10), PaymentMethod.UPI, PaymentType.MONTHLY_RENT, "UPI-REF-771122");

        // Payments for Mahesh
        createPayment("REC-2026-0006", "SVBH-2026-006", "V. Mahesh", "103", 2, 4800.0,
                today.minusDays(5), PaymentMethod.CASH, PaymentType.MONTHLY_RENT, "CASH-REC-103");

        // Payments for Tarun
        createPayment("REC-2026-0007", "SVBH-2026-007", "N. Tarun", "201", 1, 5500.0,
                today.minusDays(20), PaymentMethod.UPI, PaymentType.MONTHLY_RENT, "UPI-REF-889900");

        // Payments for Naveen
        createPayment("REC-2026-0008", "SVBH-2026-010", "S. Naveen", "301", 1, 5000.0,
                today.minusDays(12), PaymentMethod.CASH, PaymentType.MONTHLY_RENT, "CASH-REC-301");

        // Security deposits recorded
        createPayment("REC-2026-0009", "SVBH-2026-006", "V. Mahesh", "103", 2, 5000.0,
                today.minusMonths(1), PaymentMethod.UPI, PaymentType.SECURITY_DEPOSIT, "UPI-DEP-5000");
    }

    private void createPayment(String receipt, String studentId, String studentName, String roomNum, int bedNum,
                              Double amount, LocalDate date, PaymentMethod method, PaymentType type, String ref) {
        Payment payment = Payment.builder()
                .receiptNumber(receipt)
                .studentId(studentId)
                .studentName(studentName)
                .roomNumber(roomNum)
                .bedNumber(bedNum)
                .amount(amount)
                .paymentDate(date)
                .paymentMethod(method)
                .paymentType(type)
                .paymentStatus(PaymentStatus.PAID)
                .transactionReference(ref)
                .previousBalance(0.0)
                .remainingBalance(0.0)
                .rentForMonth(date.getMonth().name() + " " + date.getYear())
                .recordedBy("ADMIN")
                .createdAt(date.atTime(10, 30))
                .updatedAt(date.atTime(10, 30))
                .build();
        paymentRepository.save(payment);
    }
}
