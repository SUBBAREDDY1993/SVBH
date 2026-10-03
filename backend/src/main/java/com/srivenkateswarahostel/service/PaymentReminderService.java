package com.srivenkateswarahostel.service;

import com.srivenkateswarahostel.dto.FeeReminderDto;
import com.srivenkateswarahostel.dto.PaymentReminderDto;
import com.srivenkateswarahostel.dto.ReminderBatchResultDto;
import com.srivenkateswarahostel.dto.ReminderCountsDto;
import com.srivenkateswarahostel.exception.ResourceNotFoundException;
import com.srivenkateswarahostel.model.PaymentReminderLog;
import com.srivenkateswarahostel.model.Student;
import com.srivenkateswarahostel.model.StudentStatus;
import com.srivenkateswarahostel.repository.PaymentReminderRepository;
import com.srivenkateswarahostel.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentReminderService {

    private final PaymentReminderRepository reminderRepository;
    private final StudentRepository studentRepository;
    private final AuditService auditService;
    private final EmailService emailService;
    private final SmsService smsService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

    /**
     * Daily morning reminder task at 9:00 AM.
     * Evaluates all students with fee due date within 5 days, due today, or overdue.
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void scheduledMorningReminders() {
        log.info("Starting automated Morning fee payment reminder job...");
        processScheduledReminders("MORNING", false);
    }

    /**
     * Daily evening reminder task at 6:00 PM.
     * Evaluates all students with fee due date within 5 days, due today, or overdue.
     */
    @Scheduled(cron = "0 0 18 * * *")
    public void scheduledEveningReminders() {
        log.info("Starting automated Evening fee payment reminder job...");
        processScheduledReminders("EVENING", false);
    }

    /**
     * Daily night reminder task at 9:00 PM (21:00).
     * Evaluates all students with fee due date within 5 days, due today, or overdue.
     */
    @Scheduled(cron = "0 0 21 * * *")
    public void scheduledNightReminders() {
        log.info("Starting automated Night fee payment reminder job at 9:00 PM...");
        processScheduledReminders("NIGHT", false);
    }

    /**
     * Clear today's reminder log for a slot or all slots so that duplicate locks are reset.
     */
    @Transactional
    public void resetTodayReminders(String slot) {
        LocalDate today = LocalDate.now();
        if (slot == null || slot.isBlank() || slot.equalsIgnoreCase("ALL")) {
            reminderRepository.deleteByReminderDate(today);
            auditService.log("FEE_REMINDER", "RESET", "ALL", "Cleared all reminder duplicate locks for today (" + today + ")");
        } else {
            reminderRepository.deleteByReminderDateAndReminderSlot(today, slot.toUpperCase());
            auditService.log("FEE_REMINDER", "RESET", slot, "Cleared " + slot + " reminder duplicate locks for today (" + today + ")");
        }
    }

    /**
     * Core batch processor for scheduled reminders (Morning / Evening / Night / Manual).
     *
     * @param slot  "MORNING", "EVENING", "NIGHT", or "MANUAL"
     * @param force If true, clears previous lock and forces fresh dispatch
     */
    @Transactional
    public ReminderBatchResultDto processScheduledReminders(String slot, boolean force) {
        LocalDate today = LocalDate.now();
        LocalDate maxDueDate = today.plusDays(5); // Remind residents due within next 5 days, due today, or overdue

        // If force is requested, clear previous logs for this slot today to ensure a completely clean resend
        if (force) {
            reminderRepository.deleteByReminderDateAndReminderSlot(today, slot);
        }

        // Retrieve active students who have unpaid fee dues and whose due date is overdue, due today, or due within 5 days
        List<Student> eligibleStudents = studentRepository.findAll()
                .stream()
                .filter(s -> s.getStatus() != StudentStatus.VACATED)
                .filter(s -> !"PAID".equalsIgnoreCase(s.getPaymentStatus()))
                .filter(s -> {
                    if (s.getNextPaymentDueDate() == null) return true;
                    return !s.getNextPaymentDueDate().isAfter(maxDueDate);
                })
                .collect(Collectors.toList());

        List<PaymentReminderDto> processedReminders = new ArrayList<>();
        int remindersSent = 0;
        int alreadyRemindedCount = 0;

        for (Student student : eligibleStudents) {
            String studentId = student.getStudentId();
            long daysUntilDue = student.getNextPaymentDueDate() != null
                    ? ChronoUnit.DAYS.between(today, student.getNextPaymentDueDate())
                    : 0;
            String message = generateReminderMessage(student, slot, daysUntilDue);

            double logAmount = student.getMonthlyRent() != null ? student.getMonthlyRent() : 0.0;
            if ("HALF_PAID".equalsIgnoreCase(student.getPaymentStatus())) {
                logAmount = logAmount / 2.0;
            }

            if (!force && reminderRepository.existsByStudentIdAndReminderDateAndReminderSlot(studentId, today, slot)) {
                alreadyRemindedCount++;
                // Include in returned DTO list with generated whatsappUrl so the manager can still view and dispatch via WhatsApp
                PaymentReminderLog dummy = PaymentReminderLog.builder()
                        .studentId(studentId)
                        .studentName(student.getFullName())
                        .mobileNumber(student.getMobileNumber())
                        .roomNumber(student.getRoomNumber())
                        .bedId(student.getBedId())
                        .amountDue(logAmount)
                        .nextPaymentDueDate(student.getNextPaymentDueDate())
                        .daysUntilDue(daysUntilDue)
                        .reminderSlot(slot)
                        .reminderDate(today)
                        .sentAt(LocalDateTime.now())
                        .channel("WHATSAPP_QUEUE")
                        .message(message)
                        .status("ALREADY_LOGGED")
                        .build();
                processedReminders.add(toDto(dummy));
                continue;
            }

            // 1. Try real SMS dispatch if gateway is configured
            boolean smsSent = false;
            if (student.getMobileNumber() != null && !student.getMobileNumber().isBlank()) {
                smsSent = smsService.sendSms(student.getMobileNumber(), message);
            }

            // 2. Try email dispatch if resident has an email configured
            boolean emailSent = false;
            if (student.getEmail() != null && !student.getEmail().isBlank()) {
                try {
                    String subject = String.format("📢 [SVBH Fee Reminder] Hostel Rent Notice - Room %s (Bed %s)",
                            student.getRoomNumber() != null ? student.getRoomNumber() : "-",
                            student.getBedId() != null ? student.getBedId() : "-");
                    emailSent = emailService.sendEmail(student.getEmail(), subject, null, message);
                } catch (Exception e) {
                    log.warn("Could not dispatch fee email to student {}: {}", student.getFullName(), e.getMessage());
                }
            }

            String channel;
            String status;
            if (smsSent && emailSent) {
                channel = "SMS_EMAIL";
                status = "SENT";
            } else if (smsSent) {
                channel = "SMS";
                status = "SENT";
            } else if (emailSent) {
                channel = "EMAIL";
                status = "SENT";
            } else {
                channel = "WHATSAPP_QUEUE";
                status = "READY_TO_DISPATCH";
            }

            PaymentReminderLog logEntry = PaymentReminderLog.builder()
                    .studentId(studentId)
                    .studentName(student.getFullName())
                    .mobileNumber(student.getMobileNumber())
                    .roomNumber(student.getRoomNumber())
                    .bedId(student.getBedId())
                    .amountDue(logAmount)
                    .nextPaymentDueDate(student.getNextPaymentDueDate())
                    .daysUntilDue(daysUntilDue)
                    .reminderSlot(slot)
                    .reminderDate(today)
                    .sentAt(LocalDateTime.now())
                    .channel(channel)
                    .message(message)
                    .status(status)
                    .build();

            PaymentReminderLog saved = reminderRepository.save(logEntry);
            processedReminders.add(toDto(saved));
            remindersSent++;
        }

        auditService.log("FEE_REMINDER", "BATCH", slot,
                String.format("Processed %s payment reminders: %d processed, %d already logged for today",
                        slot, remindersSent, alreadyRemindedCount));

        log.info("Payment reminder batch [{}] completed: {} processed, {} already logged out of {} eligible",
                slot, remindersSent, alreadyRemindedCount, eligibleStudents.size());

        String messageResult;
        if (remindersSent == 0 && alreadyRemindedCount > 0) {
            messageResult = String.format("All %d eligible residents have reminder records logged today. You can open the WhatsApp Dispatcher or click Force Resend.",
                    alreadyRemindedCount);
        } else if (force && remindersSent > 0) {
            messageResult = String.format("Successfully refreshed %s reminders for %d residents. Ready for WhatsApp dispatch!",
                    slot, remindersSent);
        } else {
            messageResult = String.format("Successfully prepared %s reminders for %d residents",
                    slot, remindersSent);
        }

        return ReminderBatchResultDto.builder()
                .slot(slot)
                .date(today)
                .totalEligibleStudents(eligibleStudents.size())
                .remindersSent(remindersSent)
                .alreadyRemindedCount(alreadyRemindedCount)
                .message(messageResult)
                .reminders(processedReminders)
                .build();
    }

    /**
     * Record a manual reminder (e.g. when staff clicks WhatsApp or calls student).
     */
    @Transactional
    public PaymentReminderDto recordManualReminder(String studentId, String channel, String customMessage) {
        Student student = studentRepository.findByStudentId(studentId)
                .or(() -> studentRepository.findById(studentId))
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        LocalDate today = LocalDate.now();
        long daysUntilDue = student.getNextPaymentDueDate() != null
                ? ChronoUnit.DAYS.between(today, student.getNextPaymentDueDate())
                : 0;

        String message = (customMessage != null && !customMessage.isBlank())
                ? customMessage
                : generateReminderMessage(student, "MANUAL", daysUntilDue);

        double logAmount = student.getMonthlyRent() != null ? student.getMonthlyRent() : 0.0;
        if ("HALF_PAID".equalsIgnoreCase(student.getPaymentStatus())) {
            logAmount = logAmount / 2.0;
        }

        PaymentReminderLog logEntry = PaymentReminderLog.builder()
                .studentId(student.getStudentId())
                .studentName(student.getFullName())
                .mobileNumber(student.getMobileNumber())
                .roomNumber(student.getRoomNumber())
                .bedId(student.getBedId())
                .amountDue(logAmount)
                .nextPaymentDueDate(student.getNextPaymentDueDate())
                .daysUntilDue(daysUntilDue)
                .reminderSlot("MANUAL")
                .reminderDate(today)
                .sentAt(LocalDateTime.now())
                .channel(channel != null ? channel.toUpperCase() : "WHATSAPP")
                .message(message)
                .status("SENT")
                .build();

        PaymentReminderLog saved = reminderRepository.save(logEntry);
        auditService.log("FEE_REMINDER", "MANUAL", student.getStudentId(),
                "Sent manual fee reminder via " + channel + " to " + student.getFullName());

        return toDto(saved);
    }

    /**
     * Get all reminders sent today.
     */
    public List<PaymentReminderDto> getTodayReminders() {
        return reminderRepository.findByReminderDateOrderBySentAtDesc(LocalDate.now())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get recent reminders for a specific student.
     */
    public List<PaymentReminderDto> getStudentReminders(String studentId) {
        return reminderRepository.findByStudentIdOrderBySentAtDesc(studentId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Get active fee reminders for all active students based on fee due dates.
     * Evaluates:
     * - Past due date -> OVERDUE ("Fee payment is overdue")
     * - Due today -> DUE_TODAY ("Fee payment is due today")
     * - Due tomorrow -> URGENT ("Fee payment is due tomorrow")
     * - Due in 3 days -> REMINDER ("Fee payment is due in X days")
     * - Due in 7 days -> UPCOMING ("Fee payment is due in X days")
     * Filters out students who have already paid (PAID).
     */
    public List<FeeReminderDto> getActiveFeeReminders() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        LocalDate maxDueDate = today.plusDays(7); // Include dues within 7 days, due today, or overdue

        List<Student> activeStudents = studentRepository.findAll().stream()
                .filter(s -> s.getStatus() != StudentStatus.VACATED)
                .filter(s -> !"PAID".equalsIgnoreCase(s.getPaymentStatus()))
                .filter(s -> s.getNextPaymentDueDate() != null && !s.getNextPaymentDueDate().isAfter(maxDueDate))
                .collect(Collectors.toList());

        List<FeeReminderDto> list = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

        for (Student student : activeStudents) {
            LocalDate dueDate = student.getNextPaymentDueDate();
            long daysRemaining = ChronoUnit.DAYS.between(today, dueDate);

            double feeAmount = student.getMonthlyRent() != null ? student.getMonthlyRent() : 0.0;
            if ("HALF_PAID".equalsIgnoreCase(student.getPaymentStatus())) {
                feeAmount = feeAmount / 2.0;
            }

            String status;
            String statusLabel;
            String urgency;
            String message;
            String dueDateFormatted = dueDate.format(formatter);

            if (daysRemaining < 0) {
                long daysOverdue = Math.abs(daysRemaining);
                status = "OVERDUE";
                statusLabel = daysOverdue == 1 ? "1 day overdue" : daysOverdue + " days overdue";
                urgency = "CRITICAL";
                message = "Fee payment is overdue";
            } else if (daysRemaining == 0) {
                status = "DUE_TODAY";
                statusLabel = "Due today";
                urgency = "URGENT";
                message = "Fee payment is due today";
            } else if (daysRemaining == 1) {
                status = "URGENT";
                statusLabel = "Due tomorrow";
                urgency = "URGENT";
                message = "Fee payment is due tomorrow";
            } else if (daysRemaining <= 3) {
                status = "REMINDER";
                statusLabel = "Due in " + daysRemaining + " days";
                urgency = "MEDIUM";
                message = "Fee payment is due in " + daysRemaining + " days";
            } else {
                status = "UPCOMING";
                statusLabel = "Due in " + daysRemaining + " days";
                urgency = "NORMAL";
                message = "Fee payment is due in " + daysRemaining + " days";
            }

            // Example format requested by user:
            // "Fee payment reminder: Ravi Kumar's hostel fee of ₹5,000 is due on 05-Oct-2026."
            String reminderText = String.format("Fee payment reminder: %s's hostel fee of ₹%,.0f is %s.",
                    student.getFullName(),
                    feeAmount,
                    daysRemaining < 0 ? "overdue (was due on " + dueDateFormatted + ")" :
                    daysRemaining == 0 ? "due today on " + dueDateFormatted :
                    daysRemaining == 1 ? "due tomorrow on " + dueDateFormatted :
                    "due on " + dueDateFormatted);

            String encodedMsg = "";
            try {
                encodedMsg = URLEncoder.encode(
                        String.format("📢 *Sri Venkateswara Boys Hostel - Fee Reminder*\n\n" +
                                "Hello %s,\n" +
                                "%s.\n\n" +
                                "🏠 Room: %s | Bed: %s\n" +
                                "💰 Fee Amount: ₹%,.0f\n" +
                                "📅 Due Date: %s\n\n" +
                                "Please settle your dues via UPI or cash at reception.\n" +
                                "Thank you! - SVBH Management",
                                student.getFullName(), message,
                                student.getRoomNumber() != null ? student.getRoomNumber() : "-",
                                student.getBedNumber() > 0 ? String.valueOf(student.getBedNumber()) : (student.getBedId() != null ? student.getBedId() : "-"),
                                feeAmount, dueDateFormatted
                        ), StandardCharsets.UTF_8);
            } catch (Exception ignored) {}

            String whatsappUrl = (student.getMobileNumber() != null && !student.getMobileNumber().isBlank())
                    ? "https://wa.me/91" + student.getMobileNumber().replaceAll("[^0-9]", "") + "?text=" + encodedMsg
                    : null;

            list.add(FeeReminderDto.builder()
                    .studentId(student.getStudentId())
                    .studentName(student.getFullName())
                    .roomNumber(student.getRoomNumber())
                    .bedNumber(student.getBedNumber() > 0 ? student.getBedNumber() : 1)
                    .bedId(student.getBedId())
                    .mobileNumber(student.getMobileNumber())
                    .feeAmount(feeAmount)
                    .dueDate(dueDate)
                    .dueDateFormatted(dueDateFormatted)
                    .daysRemaining(daysRemaining)
                    .status(status)
                    .statusLabel(statusLabel)
                    .urgency(urgency)
                    .paymentStatus(student.getPaymentStatus() != null ? student.getPaymentStatus() : "PENDING")
                    .message(message)
                    .reminderText(reminderText)
                    .whatsappUrl(whatsappUrl)
                    .build());
        }

        // Sort: Overdue first (lowest daysRemaining), then due today, tomorrow, upcoming
        list.sort((a, b) -> Long.compare(a.getDaysRemaining(), b.getDaysRemaining()));
        return list;
    }

    /**
     * Get dynamic summary counts for fee reminders:
     * - Upcoming Fees: Due in 1 to 7 days
     * - Due Today: Due today
     * - Overdue: Due date is in the past
     * - Paid: Current fee marked as PAID
     */
    public ReminderCountsDto getReminderCounts() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        LocalDate sevenDaysAhead = today.plusDays(7);

        List<Student> activeStudents = studentRepository.findAll().stream()
                .filter(s -> s.getStatus() != StudentStatus.VACATED)
                .collect(Collectors.toList());

        long paidCount = 0;
        long overdueCount = 0;
        long dueTodayCount = 0;
        long upcomingCount = 0;

        for (Student s : activeStudents) {
            String status = s.getPaymentStatus();
            LocalDate dueDate = s.getNextPaymentDueDate();

            if ("PAID".equalsIgnoreCase(status)) {
                paidCount++;
            } else if (dueDate != null) {
                if (dueDate.isBefore(today)) {
                    overdueCount++;
                } else if (dueDate.isEqual(today)) {
                    dueTodayCount++;
                } else if (!dueDate.isAfter(sevenDaysAhead)) {
                    upcomingCount++;
                }
            } else {
                overdueCount++;
            }
        }

        return ReminderCountsDto.builder()
                .upcomingFees(upcomingCount)
                .dueToday(dueTodayCount)
                .overdue(overdueCount)
                .paid(paidCount)
                .totalActive(activeStudents.size())
                .build();
    }

    /**
     * Generate personalized reminder message based on due status and time slot.
     */
    public String generateReminderMessage(Student student, String slot, long daysUntilDue) {
        String greeting = "MORNING".equalsIgnoreCase(slot)
                ? "Good morning"
                : ("EVENING".equalsIgnoreCase(slot) || "NIGHT".equalsIgnoreCase(slot))
                ? "Good evening"
                : "Hello";

        String reminderIntro = "NIGHT".equalsIgnoreCase(slot)
                ? "This is a night follow-up reminder that"
                : "EVENING".equalsIgnoreCase(slot)
                ? "This is an evening reminder that"
                : "MORNING".equalsIgnoreCase(slot)
                ? "This is a gentle morning reminder that"
                : "This is a friendly reminder that";

        String dueDateStr = student.getNextPaymentDueDate() != null
                ? student.getNextPaymentDueDate().format(DATE_FORMATTER)
                : "N/A";

        String statusNotice;
        double amountToPay = student.getMonthlyRent() != null ? student.getMonthlyRent() : 0.0;
        if ("HALF_PAID".equalsIgnoreCase(student.getPaymentStatus())) {
            double halfAmount = amountToPay / 2.0;
            statusNotice = String.format("you have paid partial fee, and your remaining *HALF FEE BALANCE of ₹%.0f is PENDING* to be cleared (Due date: %s)",
                    halfAmount, dueDateStr);
            amountToPay = halfAmount;
        } else if (daysUntilDue < 0) {
            long overdueDays = Math.abs(daysUntilDue);
            statusNotice = String.format("your monthly hostel rent of ₹%.0f is *%d day%s OVERDUE and PENDING* (Due date: %s)",
                    amountToPay, overdueDays, overdueDays == 1 ? "" : "s", dueDateStr);
        } else if (daysUntilDue == 0) {
            statusNotice = String.format("your monthly hostel rent of ₹%.0f is *DUE TODAY* (%s)", amountToPay, dueDateStr);
        } else {
            statusNotice = String.format("your monthly hostel rent of ₹%.0f is *due in %d day%s* on %s",
                    amountToPay, daysUntilDue, daysUntilDue == 1 ? "" : "s", dueDateStr);
        }

        return String.format(
                "📢 *Sri Venkateswara Boys Hostel - Fee Reminder*\n\n" +
                "%s %s,\n\n" +
                "%s %s.\n\n" +
                "🏠 *Room & Bed:* Room %s (Bed %s)\n" +
                "💰 *Amount Due:* ₹%.0f\n" +
                "📅 *Due Date:* %s\n\n" +
                "💳 *Payment Options:*\n" +
                "• Pay via UPI: *9441843574@ybl* (PhonePe / Google Pay / Paytm: *9441843574*)\n" +
                "• Or pay in cash at the hostel office\n" +
                "Kindly reply with your payment screenshot to receive your official rent receipt.\n\n" +
                "_If you have already cleared your dues, kindly disregard this notice._\n\n" +
                "Thank you,\n*Sri Venkateswara Boys Hostel Management*\n" +
                "📍 Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038\n" +
                "📞 Phone: +91 9441843574 | ✉️ Email: svbhostel2026@gmail.com",
                greeting,
                student.getFullName(),
                reminderIntro,
                statusNotice,
                student.getRoomNumber() != null ? student.getRoomNumber() : "-",
                student.getBedId() != null ? student.getBedId() : "-",
                amountToPay,
                dueDateStr
        );
    }

    /**
     * Helper to map Entity to DTO and build formatted WhatsApp direct link.
     */
    public PaymentReminderDto toDto(PaymentReminderLog entity) {
        String whatsappUrl = null;
        if (entity.getMobileNumber() != null && entity.getMessage() != null) {
            String digits = entity.getMobileNumber().replaceAll("[^0-9]", "");
            if (digits.length() == 10) {
                digits = "91" + digits;
            }
            if (!digits.isEmpty()) {
                String encodedMsg = URLEncoder.encode(entity.getMessage(), StandardCharsets.UTF_8);
                whatsappUrl = "https://wa.me/" + digits + "?text=" + encodedMsg;
            }
        }

        return PaymentReminderDto.builder()
                .id(entity.getId())
                .studentId(entity.getStudentId())
                .studentName(entity.getStudentName())
                .mobileNumber(entity.getMobileNumber())
                .roomNumber(entity.getRoomNumber())
                .bedId(entity.getBedId())
                .amountDue(entity.getAmountDue())
                .nextPaymentDueDate(entity.getNextPaymentDueDate())
                .daysUntilDue(entity.getDaysUntilDue())
                .reminderSlot(entity.getReminderSlot())
                .reminderDate(entity.getReminderDate())
                .sentAt(entity.getSentAt())
                .channel(entity.getChannel())
                .message(entity.getMessage())
                .status(entity.getStatus())
                .whatsappUrl(whatsappUrl)
                .build();
    }
}
