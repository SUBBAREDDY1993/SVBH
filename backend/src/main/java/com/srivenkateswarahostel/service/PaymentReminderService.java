package com.srivenkateswarahostel.service;

import com.srivenkateswarahostel.dto.PaymentReminderDto;
import com.srivenkateswarahostel.dto.ReminderBatchResultDto;
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

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

    /**
     * Daily morning reminder task at 9:00 AM.
     * Evaluates all students with fee due date within 3 days, due today, or overdue.
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void scheduledMorningReminders() {
        log.info("Starting automated Morning fee payment reminder job...");
        processScheduledReminders("MORNING", false);
    }

    /**
     * Daily evening reminder task at 6:00 PM.
     * Evaluates all students with fee due date within 3 days, due today, or overdue.
     */
    @Scheduled(cron = "0 0 18 * * *")
    public void scheduledEveningReminders() {
        log.info("Starting automated Evening fee payment reminder job...");
        processScheduledReminders("EVENING", false);
    }

    /**
     * Core batch processor for scheduled reminders (Morning / Evening / Manual).
     *
     * @param slot  "MORNING", "EVENING", or "MANUAL"
     * @param force If true, sends even if student already received a reminder for this slot today
     */
    @Transactional
    public ReminderBatchResultDto processScheduledReminders(String slot, boolean force) {
        LocalDate today = LocalDate.now();
        LocalDate maxDueDate = today.plusDays(3); // 3 days nearby reminder window

        // Retrieve active students whose next payment due date is on or before today + 3 days
        List<Student> eligibleStudents = studentRepository.findOverdueStudents(maxDueDate)
                .stream()
                .filter(s -> s.getStatus() != StudentStatus.VACATED && s.getNextPaymentDueDate() != null)
                .collect(Collectors.toList());

        List<PaymentReminderDto> processedReminders = new ArrayList<>();
        int remindersSent = 0;
        int alreadyRemindedCount = 0;

        for (Student student : eligibleStudents) {
            String studentId = student.getStudentId();

            if (!force && reminderRepository.existsByStudentIdAndReminderDateAndReminderSlot(studentId, today, slot)) {
                alreadyRemindedCount++;
                continue;
            }

            long daysUntilDue = ChronoUnit.DAYS.between(today, student.getNextPaymentDueDate());
            String message = generateReminderMessage(student, slot, daysUntilDue);

            PaymentReminderLog logEntry = PaymentReminderLog.builder()
                    .studentId(studentId)
                    .studentName(student.getFullName())
                    .mobileNumber(student.getMobileNumber())
                    .roomNumber(student.getRoomNumber())
                    .bedId(student.getBedId())
                    .amountDue(student.getMonthlyRent())
                    .nextPaymentDueDate(student.getNextPaymentDueDate())
                    .daysUntilDue(daysUntilDue)
                    .reminderSlot(slot)
                    .reminderDate(today)
                    .sentAt(LocalDateTime.now())
                    .channel("SYSTEM_BATCH")
                    .message(message)
                    .status("SENT")
                    .build();

            PaymentReminderLog saved = reminderRepository.save(logEntry);
            processedReminders.add(toDto(saved));
            remindersSent++;
        }

        auditService.log("FEE_REMINDER", "BATCH", slot,
                String.format("Processed %s payment reminders: %d sent, %d skipped (already reminded)",
                        slot, remindersSent, alreadyRemindedCount));

        log.info("Payment reminder batch [{}] completed: {} sent, {} skipped out of {} eligible",
                slot, remindersSent, alreadyRemindedCount, eligibleStudents.size());

        return ReminderBatchResultDto.builder()
                .slot(slot)
                .date(today)
                .totalEligibleStudents(eligibleStudents.size())
                .remindersSent(remindersSent)
                .alreadyRemindedCount(alreadyRemindedCount)
                .message(String.format("Successfully processed %s reminders: %d sent, %d skipped",
                        slot, remindersSent, alreadyRemindedCount))
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

        PaymentReminderLog logEntry = PaymentReminderLog.builder()
                .studentId(student.getStudentId())
                .studentName(student.getFullName())
                .mobileNumber(student.getMobileNumber())
                .roomNumber(student.getRoomNumber())
                .bedId(student.getBedId())
                .amountDue(student.getMonthlyRent())
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
     * Generate personalized reminder message based on due status and time slot.
     */
    public String generateReminderMessage(Student student, String slot, long daysUntilDue) {
        String greeting = "MORNING".equalsIgnoreCase(slot)
                ? "Good morning"
                : "EVENING".equalsIgnoreCase(slot)
                ? "Good evening"
                : "Hello";

        String dueDateStr = student.getNextPaymentDueDate() != null
                ? student.getNextPaymentDueDate().format(DATE_FORMATTER)
                : "N/A";

        String statusNotice;
        if (daysUntilDue < 0) {
            statusNotice = String.format("your monthly rent is *%d days OVERDUE* (Due date: %s)",
                    Math.abs(daysUntilDue), dueDateStr);
        } else if (daysUntilDue == 0) {
            statusNotice = String.format("your monthly rent is *DUE TODAY* (%s)", dueDateStr);
        } else {
            statusNotice = String.format("your monthly rent is *due in %d day%s* on %s",
                    daysUntilDue, daysUntilDue == 1 ? "" : "s", dueDateStr);
        }

        return String.format(
                "📢 *Sri Venkateswara Boys Hostel - Fee Reminder*\n\n" +
                "%s %s,\n\n" +
                "This is a reminder that %s.\n\n" +
                "🏠 *Room & Bed:* Room %s (Bed %s)\n" +
                "💰 *Amount Due:* ₹%.0f\n" +
                "📅 *Due Date:* %s\n\n" +
                "💳 *Payment Options:*\n" +
                "Please pay via UPI or Cash at the hostel office. After paying, please share the transaction screenshot to collect your receipt.\n\n" +
                "_If you have already paid, kindly ignore this message._\n\n" +
                "Thank you,\n*Sri Venkateswara Boys Hostel Management*\n" +
                "📍 Opposite Venkatesh Kirana & General Store, Near Balaji Flour Mill, Grand Lucky Restaurant Road, SR Nagar, Ameerpet, Hyderabad - 500038\n" +
                "📞 Phone: +91 9441843574 | ✉️ Email: svbhostel2026@gmail.com",
                greeting,
                student.getFullName(),
                statusNotice,
                student.getRoomNumber() != null ? student.getRoomNumber() : "-",
                student.getBedId() != null ? student.getBedId() : "-",
                student.getMonthlyRent() != null ? student.getMonthlyRent() : 0.0,
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
