package com.srivenkateswarahostel.service;

import com.srivenkateswarahostel.dto.*;
import com.srivenkateswarahostel.exception.ResourceNotFoundException;
import com.srivenkateswarahostel.model.PaymentReminderLog;
import com.srivenkateswarahostel.model.ReminderStatus;
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
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentReminderService {

    private final PaymentReminderRepository reminderRepository;
    private final StudentRepository studentRepository;
    private final StudentService studentService;
    private final WhatsAppService whatsAppService;
    private final AuditService auditService;
    private final EmailService emailService;
    private final SmsService smsService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MMMM yyyy");

    /**
     * Daily morning reminder task at 9:00 AM IST.
     */
    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Kolkata")
    public void scheduledMorningReminders() {
        log.info("Starting automated Morning fee payment reminder job...");
        processScheduledReminders("MORNING", false, false);
    }

    /**
     * Daily evening reminder task at 6:00 PM IST.
     */
    @Scheduled(cron = "0 0 18 * * *", zone = "Asia/Kolkata")
    public void scheduledEveningReminders() {
        log.info("Starting automated Evening fee payment reminder job...");
        processScheduledReminders("EVENING", false, false);
    }

    /**
     * Daily night reminder task at 9:00 PM IST.
     */
    @Scheduled(cron = "0 0 21 * * *", zone = "Asia/Kolkata")
    public void scheduledNightReminders() {
        log.info("Starting automated Night fee payment reminder job at 9:00 PM...");
        processScheduledReminders("NIGHT", false, false);
    }

    /**
     * Clear today's reminder log for a slot or all slots so that duplicate locks are reset.
     */
    @Transactional
    public void resetTodayReminders(String slot) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        if (slot == null || slot.isBlank() || slot.equalsIgnoreCase("ALL")) {
            reminderRepository.deleteByReminderDate(today);
            auditService.log("FEE_REMINDER", "RESET", "ALL", "Cleared all reminder duplicate locks for today (" + today + ")");
        } else {
            reminderRepository.deleteByReminderDateAndReminderSlot(today, slot.toUpperCase());
            auditService.log("FEE_REMINDER", "RESET", slot, "Cleared " + slot + " reminder duplicate locks for today (" + today + ")");
        }
    }

    /**
     * Overload for backward compatibility.
     */
    @Transactional
    public ReminderBatchResultDto processScheduledReminders(String slot, boolean force) {
        return processScheduledReminders(slot, force, false);
    }

    /**
     * Core batch processor for scheduled reminders (Morning / Evening / Night / Manual).
     * Dispatches WhatsApp API reminders, SMS, and Email without letting a single failure stop the batch.
     *
     * @param slot           "MORNING", "EVENING", "NIGHT", or "MANUAL"
     * @param force          If true, clears previous lock and forces fresh dispatch
     * @param includeSkipped If true, dispatches to all eligible students even if previously recorded
     */
    @Transactional
    public ReminderBatchResultDto processScheduledReminders(String slot, boolean force, boolean includeSkipped) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        LocalDate maxDueDate = today.plusDays(7);

        // Sync live monthly fee due dates for all active students first!
        try {
            studentService.syncLiveMonthlyDueDates();
        } catch (Exception e) {
            log.warn("Non-fatal: could not sync live monthly due dates: {}", e.getMessage());
        }

        if (force || includeSkipped) {
            if ("ALL".equalsIgnoreCase(slot) || includeSkipped) {
                reminderRepository.deleteByReminderDate(today);
            } else {
                reminderRepository.deleteByReminderDateAndReminderSlot(today, slot);
            }
        }

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
        int failedCount = 0;

        for (Student student : eligibleStudents) {
            String studentId = student.getStudentId();
            LocalDate dueDate = student.getNextPaymentDueDate() != null ? student.getNextPaymentDueDate() : today;
            long daysUntilDue = ChronoUnit.DAYS.between(today, dueDate);

            double logAmount = student.getMonthlyRent() != null ? student.getMonthlyRent() : 0.0;
            if ("HALF_PAID".equalsIgnoreCase(student.getPaymentStatus())) {
                logAmount = logAmount / 2.0;
            }

            // Check if reminder was already successfully sent today
            List<PaymentReminderLog> existingToday = reminderRepository.findByStudentIdAndReminderDate(studentId, today);
            boolean alreadySentSuccess = existingToday.stream().anyMatch(r ->
                    ReminderStatus.SENT.name().equalsIgnoreCase(r.getStatus())
                            || ReminderStatus.DELIVERED.name().equalsIgnoreCase(r.getStatus())
                            || ReminderStatus.READ.name().equalsIgnoreCase(r.getStatus()));

            if (alreadySentSuccess && !force && !includeSkipped) {
                alreadyRemindedCount++;
                PaymentReminderLog existing = existingToday.get(0);
                processedReminders.add(toDto(existing));
                continue;
            }

            // Dispatch WhatsApp reminder for student
            try {
                PaymentReminderDto dto = dispatchWhatsAppReminderInternal(student, slot, force || includeSkipped);
                processedReminders.add(dto);

                if (ReminderStatus.SENT.name().equalsIgnoreCase(dto.getStatus())) {
                    remindersSent++;
                } else if (ReminderStatus.FAILED.name().equalsIgnoreCase(dto.getStatus())) {
                    failedCount++;
                }
            } catch (Exception ex) {
                log.error("Failed to process reminder for student {}: {}", student.getFullName(), ex.getMessage(), ex);
                failedCount++;
            }
        }

        boolean isWaConfigured = whatsAppService.isConfigured();
        int pendingCount = (int) processedReminders.stream()
                .filter(r -> ReminderStatus.PENDING.name().equalsIgnoreCase(r.getStatus()))
                .count();

        auditService.log("FEE_REMINDER", "BATCH", slot,
                String.format("Batch %s: %d sent, %d failed, %d pending, %d previously sent out of %d eligible",
                        slot, remindersSent, failedCount, pendingCount, alreadyRemindedCount, eligibleStudents.size()));

        String messageResult;
        if (!isWaConfigured) {
            messageResult = String.format("Meta WhatsApp Cloud API credentials not configured in application.properties. %d reminders prepared in queue for WhatsApp Web dispatch.",
                    pendingCount > 0 ? pendingCount : eligibleStudents.size());
        } else {
            messageResult = String.format("Prepared %s reminders: %d sent successfully via Meta Cloud API, %d failed, %d already delivered for today.",
                    slot, remindersSent, failedCount, alreadyRemindedCount);
        }

        return ReminderBatchResultDto.builder()
                .slot(slot)
                .date(today)
                .totalEligibleStudents(eligibleStudents.size())
                .remindersSent(remindersSent)
                .alreadyRemindedCount(alreadyRemindedCount)
                .pendingCount(pendingCount)
                .metaApiConfigured(isWaConfigured)
                .message(messageResult)
                .reminders(processedReminders)
                .build();
    }


    /**
     * Dispatch WhatsApp reminder for a specific student via Meta WhatsApp Cloud API.
     * Enforces:
     * - Only marks SENT if WhatsApp API returns HTTP 200 with message ID (wamid).
     * - If API fails: marks FAILED, saves lastError & apiResponse, allows retry.
     * - Previous FAILED attempt is always retryable.
     * - Previous SENT attempt prevents duplicate sending unless force=true.
     */
    @Transactional
    public PaymentReminderDto dispatchWhatsAppReminder(String studentId, String slot, boolean force) {
        Student student = studentRepository.findByStudentId(studentId)
                .or(() -> studentRepository.findById(studentId))
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        return dispatchWhatsAppReminderInternal(student, slot != null ? slot : "MANUAL", force);
    }

    /**
     * Retry a failed or skipped reminder for a student.
     */
    @Transactional
    public PaymentReminderDto retryReminder(String studentId) {
        return dispatchWhatsAppReminder(studentId, "MANUAL", true);
    }

    private PaymentReminderDto dispatchWhatsAppReminderInternal(Student student, String slot, boolean force) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        LocalDate dueDate = student.getNextPaymentDueDate() != null ? student.getNextPaymentDueDate() : today;
        long daysUntilDue = ChronoUnit.DAYS.between(today, dueDate);
        String dueDateStr = dueDate.format(DATE_FORMATTER);
        String billingMonth = dueDate.format(MONTH_FORMATTER);

        double feeAmount = student.getMonthlyRent() != null ? student.getMonthlyRent() : 0.0;
        if ("HALF_PAID".equalsIgnoreCase(student.getPaymentStatus())) {
            feeAmount = feeAmount / 2.0;
        }

        String fullMessage = generateReminderMessage(student, slot, daysUntilDue);

        // Find or create reminder log record
        Optional<PaymentReminderLog> existingOpt = reminderRepository.findTopByStudentIdOrderBySentAtDesc(student.getStudentId());
        PaymentReminderLog logEntry;

        if (existingOpt.isPresent() && today.isEqual(existingOpt.get().getReminderDate()) && !force) {
            PaymentReminderLog existing = existingOpt.get();
            // If already sent or delivered today, return existing without resending
            if (ReminderStatus.SENT.name().equalsIgnoreCase(existing.getStatus())
                    || ReminderStatus.DELIVERED.name().equalsIgnoreCase(existing.getStatus())
                    || ReminderStatus.READ.name().equalsIgnoreCase(existing.getStatus())) {
                log.info("Reminder for {} already successfully sent today (wamid: {}). Skipping duplicate.",
                        student.getFullName(), existing.getWhatsappMessageId());
                return toDto(existing);
            }
            logEntry = existing;
        } else {
            logEntry = PaymentReminderLog.builder()
                    .studentId(student.getStudentId())
                    .studentName(student.getFullName())
                    .mobileNumber(student.getMobileNumber())
                    .roomNumber(student.getRoomNumber())
                    .bedId(student.getBedId())
                    .amountDue(feeAmount)
                    .nextPaymentDueDate(dueDate)
                    .daysUntilDue(daysUntilDue)
                    .billingMonth(billingMonth)
                    .reminderType(daysUntilDue < 0 ? "OVERDUE" : (daysUntilDue == 0 ? "DUE_TODAY" : "UPCOMING"))
                    .reminderSlot(slot)
                    .reminderDate(today)
                    .sentAt(null)
                    .channel("WHATSAPP_CLOUD_API")
                    .message(fullMessage)
                    .status(ReminderStatus.PROCESSING.name())
                    .attemptCount(0)
                    .build();
        }

        logEntry.setStatus(ReminderStatus.PROCESSING.name());
        logEntry.setLastAttemptAt(LocalDateTime.now());
        logEntry.setAttemptCount(logEntry.getAttemptCount() + 1);

        // 1. Dispatch via Meta WhatsApp Cloud API
        WhatsAppSendResult waResult = whatsAppService.sendFeeReminderTemplate(
                student.getMobileNumber(),
                student.getFullName(),
                feeAmount,
                dueDateStr
        );

        if (waResult.isSuccess()) {
            logEntry.setStatus(ReminderStatus.SENT.name());
            logEntry.setWhatsappMessageId(waResult.getWhatsappMessageId());
            logEntry.setApiResponse(waResult.getRawResponse());
            logEntry.setLastError(null);
            logEntry.setSentAt(LocalDateTime.now());
            logEntry.setChannel("WHATSAPP_CLOUD_API");
            log.info("WhatsApp Cloud API successfully sent fee reminder to {} (Message ID: {})",
                    student.getFullName(), waResult.getWhatsappMessageId());
        } else {
            // Check if Meta credentials are not configured, fallback to WhatsApp Web link queue
            if (waResult.getHttpStatusCode() != null && waResult.getHttpStatusCode() == 503) {
                logEntry.setStatus(ReminderStatus.PENDING.name());
                logEntry.setLastError("Meta WhatsApp Cloud API credentials not configured. Click WhatsApp to send via WhatsApp Web/App.");
                logEntry.setChannel("WHATSAPP_WEB");
                logEntry.setSentAt(null);
            } else {
                logEntry.setStatus(ReminderStatus.FAILED.name());
                logEntry.setLastError(waResult.getErrorMessage());
                logEntry.setApiResponse(waResult.getRawResponse());
                log.warn("WhatsApp dispatch FAILED for {}: {}", student.getFullName(), waResult.getErrorMessage());
            }
        }

        // 2. Also attempt SMS and Email dispatch if configured
        if (student.getMobileNumber() != null && !student.getMobileNumber().isBlank()) {
            try {
                smsService.sendSms(student.getMobileNumber(), fullMessage);
            } catch (Exception ignored) {}
        }

        if (student.getEmail() != null && !student.getEmail().isBlank()) {
            try {
                String subject = String.format("📢 [SVBH Fee Reminder] %s Hostel Rent Notice - Room %s (Bed %s)",
                        billingMonth,
                        student.getRoomNumber() != null ? student.getRoomNumber() : "-",
                        student.getBedId() != null ? student.getBedId() : "-");
                emailService.sendEmail(student.getEmail(), subject, null, fullMessage);
            } catch (Exception ignored) {}
        }

        PaymentReminderLog saved = reminderRepository.save(logEntry);
        auditService.log("FEE_REMINDER", "WHATSAPP", student.getStudentId(),
                String.format("WhatsApp reminder status for %s: %s (attempt #%d)",
                        student.getFullName(), saved.getStatus(), saved.getAttemptCount()));

        return toDto(saved);
    }

    /**
     * Record a manual reminder or send direct WhatsApp/SMS message.
     */
    @Transactional
    public PaymentReminderDto recordManualReminder(String studentId, String channel, String customMessage) {
        Student student = studentRepository.findByStudentId(studentId)
                .or(() -> studentRepository.findById(studentId))
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        LocalDate dueDate = student.getNextPaymentDueDate() != null ? student.getNextPaymentDueDate() : today;
        long daysUntilDue = ChronoUnit.DAYS.between(today, dueDate);

        double logAmount = student.getMonthlyRent() != null ? student.getMonthlyRent() : 0.0;
        if ("HALF_PAID".equalsIgnoreCase(student.getPaymentStatus())) {
            logAmount = logAmount / 2.0;
        }

        String message = (customMessage != null && !customMessage.isBlank())
                ? customMessage
                : generateReminderMessage(student, "MANUAL", daysUntilDue);

        // If channel is WHATSAPP and Meta API is configured, attempt live dispatch
        if ("WHATSAPP".equalsIgnoreCase(channel) && whatsAppService.isConfigured()) {
            return dispatchWhatsAppReminder(student.getStudentId(), "MANUAL", true);
        }

        PaymentReminderLog logEntry = PaymentReminderLog.builder()
                .studentId(student.getStudentId())
                .studentName(student.getFullName())
                .mobileNumber(student.getMobileNumber())
                .roomNumber(student.getRoomNumber())
                .bedId(student.getBedId())
                .amountDue(logAmount)
                .nextPaymentDueDate(dueDate)
                .daysUntilDue(daysUntilDue)
                .billingMonth(dueDate.format(MONTH_FORMATTER))
                .reminderSlot("MANUAL")
                .reminderDate(today)
                .sentAt(LocalDateTime.now())
                .lastAttemptAt(LocalDateTime.now())
                .attemptCount(1)
                .channel(channel != null ? channel.toUpperCase() : "WHATSAPP_WEB")
                .message(message)
                .status(ReminderStatus.SENT.name())
                .build();

        PaymentReminderLog saved = reminderRepository.save(logEntry);
        auditService.log("FEE_REMINDER", "MANUAL", student.getStudentId(),
                "Logged manual reminder via " + channel + " to " + student.getFullName());

        return toDto(saved);
    }

    /**
     * Handle incoming resident reply and dispatch intelligent automated response.
     */
    @Transactional
    public IncomingReplyResponseDto handleIncomingReply(IncomingReplyRequestDto request) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        Student student = null;

        if (request.getStudentId() != null && !request.getStudentId().isBlank()) {
            student = studentRepository.findByStudentId(request.getStudentId()).orElse(null);
        }

        if (student == null && request.getMobileNumber() != null) {
            String norm = whatsAppService.normalizePhoneNumber(request.getMobileNumber());
            String raw10 = norm != null && norm.length() >= 10 ? norm.substring(norm.length() - 10) : "";
            student = studentRepository.findAll().stream()
                    .filter(s -> s.getMobileNumber() != null && s.getMobileNumber().contains(raw10))
                    .findFirst().orElse(null);
        }

        String studentName = student != null ? student.getFullName() : (request.getSenderName() != null ? request.getSenderName() : "Resident");
        String studentId = student != null ? student.getStudentId() : "UNKNOWN";
        String room = student != null ? student.getRoomNumber() : "-";
        String bed = student != null ? student.getBedId() : "-";
        String incomingMsg = request.getMessageText() != null ? request.getMessageText() : "";

        // Generate intelligent automated reply
        String autoReplyText;
        String lower = incomingMsg.toLowerCase();
        if (lower.contains("paid") || lower.contains("sent") || lower.contains("gpay") || lower.contains("phonepe")
                || lower.contains("upi") || lower.contains("done") || lower.contains("transfer") || lower.contains("screenshot")) {
            autoReplyText = String.format(
                    "📢 *Sri Venkateswara Boys Hostel Management*\n\n" +
                    "Hello %s,\n" +
                    "Thank you for confirming your payment! 🙏\n\n" +
                    "• Kindly reply with your *payment screenshot* or *UPI Reference / UTR Number*.\n" +
                    "• Our management will verify the transaction and generate your official fee receipt shortly.\n" +
                    "• For cash payment verification or desk receipt, visit the hostel office.\n\n" +
                    "Thank you,\n*SVBH Management* | 📞 +91 9441843574 | ✉️ svbhostel2026@gmail.com",
                    studentName
            );
        } else {
            autoReplyText = String.format(
                    "📢 *Sri Venkateswara Boys Hostel Management*\n\n" +
                    "Hello %s,\n" +
                    "Thank you for your message! 🙏\n\n" +
                    "We have received your response regarding Room %s (Bed %s).\n" +
                    "Our management team is reviewing your message and will assist you shortly.\n" +
                    "For immediate assistance, please call the hostel helpline: *+91 9441843574*.\n\n" +
                    "Thank you,\n*Sri Venkateswara Boys Hostel Management*",
                    studentName, room, bed
            );
        }

        // Dispatch auto-reply via WhatsApp if configured
        if (whatsAppService.isConfigured() && request.getMobileNumber() != null) {
            try {
                whatsAppService.sendTextMessage(request.getMobileNumber(), autoReplyText);
            } catch (Exception e) {
                log.warn("Could not dispatch automated WhatsApp reply: {}", e.getMessage());
            }
        }

        // Record incoming reply and auto-reply into reminder log
        Optional<PaymentReminderLog> latestLog = reminderRepository.findTopByStudentIdOrderBySentAtDesc(studentId);
        PaymentReminderLog logEntry;
        if (latestLog.isPresent()) {
            logEntry = latestLog.get();
        } else {
            logEntry = PaymentReminderLog.builder()
                    .studentId(studentId)
                    .studentName(studentName)
                    .mobileNumber(request.getMobileNumber())
                    .roomNumber(room)
                    .bedId(bed)
                    .reminderDate(today)
                    .sentAt(LocalDateTime.now())
                    .reminderSlot("MANUAL")
                    .channel("INCOMING_REPLY")
                    .build();
        }

        logEntry.setReplyText(incomingMsg);
        logEntry.setReplyReceivedAt(LocalDateTime.now());
        logEntry.setAutoReplyText(autoReplyText);
        logEntry.setAutoReplySentAt(LocalDateTime.now());
        reminderRepository.save(logEntry);

        auditService.log("FEE_REMINDER", "AUTO_REPLY", studentId,
                String.format("Auto-replied to %s: '%s'", studentName, incomingMsg));

        String digits = request.getMobileNumber() != null ? request.getMobileNumber().replaceAll("[^0-9]", "") : "";
        if (digits.length() == 10) digits = "91" + digits;
        String waReplyUrl = !digits.isEmpty() ? "https://wa.me/" + digits + "?text=" + URLEncoder.encode(autoReplyText, StandardCharsets.UTF_8) : null;

        return IncomingReplyResponseDto.builder()
                .studentId(studentId)
                .studentName(studentName)
                .mobileNumber(request.getMobileNumber())
                .roomNumber(room)
                .bedId(bed)
                .incomingMessage(incomingMsg)
                .autoReplyMessage(autoReplyText)
                .whatsappReplyUrl(waReplyUrl)
                .channel(request.getChannel() != null ? request.getChannel() : "WHATSAPP")
                .receivedAt(LocalDateTime.now())
                .status("AUTO_REPLIED")
                .build();
    }

    /**
     * Update reminder status from Meta WhatsApp Webhook callbacks (e.g. delivered, read, failed).
     */
    @Transactional
    public boolean updateReminderStatusByMessageId(String messageId, String newStatus, String errorDetails) {
        if (messageId == null || messageId.isBlank()) return false;

        Optional<PaymentReminderLog> opt = reminderRepository.findByWhatsappMessageId(messageId);
        if (opt.isPresent()) {
            PaymentReminderLog r = opt.get();
            String upper = newStatus.toUpperCase();
            if ("DELIVERED".equals(upper)) {
                r.setStatus(ReminderStatus.DELIVERED.name());
                r.setDeliveredAt(LocalDateTime.now());
            } else if ("READ".equals(upper)) {
                r.setStatus(ReminderStatus.READ.name());
                r.setReadAt(LocalDateTime.now());
            } else if ("FAILED".equals(upper)) {
                r.setStatus(ReminderStatus.FAILED.name());
                if (errorDetails != null) r.setLastError(errorDetails);
            } else if ("SENT".equals(upper)) {
                r.setStatus(ReminderStatus.SENT.name());
            }
            reminderRepository.save(r);
            log.info("Updated reminder {} status to {} via Meta Webhook (wamid: {})", r.getStudentName(), upper, messageId);
            return true;
        }
        return false;
    }

    /**
     * Get active fee reminders for all active students based on fee due dates.
     * Synchronizes live monthly due dates (e.g. October 2026) and generates dynamic
     * October fee alert notices.
     */
    public List<FeeReminderDto> getActiveFeeReminders() {
        // Sync live monthly dues first
        try {
            studentService.syncLiveMonthlyDueDates();
        } catch (Exception e) {
            log.warn("Non-fatal: could not sync live monthly due dates: {}", e.getMessage());
        }

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        LocalDate maxDueDate = today.plusDays(7);

        List<Student> activeStudents = studentRepository.findAll().stream()
                .filter(s -> s.getStatus() != StudentStatus.VACATED)
                .filter(s -> !"PAID".equalsIgnoreCase(s.getPaymentStatus()))
                .filter(s -> s.getNextPaymentDueDate() != null && !s.getNextPaymentDueDate().isAfter(maxDueDate))
                .collect(Collectors.toList());

        List<FeeReminderDto> list = new ArrayList<>();

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
            String dueDateFormatted = dueDate.format(DATE_FORMATTER);
            String monthName = dueDate.format(MONTH_FORMATTER); // e.g. "October 2026"
            String shortMonth = dueDate.format(DateTimeFormatter.ofPattern("MMMM")); // e.g. "October"

            if (daysRemaining < 0) {
                long daysOverdue = Math.abs(daysRemaining);
                status = "OVERDUE";
                statusLabel = daysOverdue == 1 ? "1 day overdue" : daysOverdue + " days overdue";
                urgency = "CRITICAL";
                message = String.format("%s fee payment is %d day%s overdue", shortMonth, daysOverdue, daysOverdue == 1 ? "" : "s");
            } else if (daysRemaining == 0) {
                status = "DUE_TODAY";
                statusLabel = "Due today";
                urgency = "URGENT";
                message = String.format("%s fee payment is due today", shortMonth);
            } else if (daysRemaining == 1) {
                status = "URGENT";
                statusLabel = "Due tomorrow";
                urgency = "URGENT";
                message = String.format("%s fee payment is due tomorrow", shortMonth);
            } else if (daysRemaining <= 3) {
                status = "REMINDER";
                statusLabel = "Due in " + daysRemaining + " days";
                urgency = "MEDIUM";
                message = String.format("%s fee payment is due in %d days", shortMonth, daysRemaining);
            } else {
                status = "UPCOMING";
                statusLabel = "Due in " + daysRemaining + " days";
                urgency = "NORMAL";
                message = String.format("%s fee payment is due in %d days", shortMonth, daysRemaining);
            }

            // User-requested format with explicit month name:
            // "Fee payment reminder: Naik's hostel fee for October 2026 of ₹5,000 is 3 days overdue (due on 01-Oct-2026)."
            String reminderText = String.format("Fee payment reminder: %s's hostel fee for %s of ₹%,.0f is %s.",
                    student.getFullName(),
                    monthName,
                    feeAmount,
                    daysRemaining < 0 ? Math.abs(daysRemaining) + " days overdue (due on " + dueDateFormatted + ")" :
                    daysRemaining == 0 ? "due today on " + dueDateFormatted :
                    daysRemaining == 1 ? "due tomorrow on " + dueDateFormatted :
                    "due on " + dueDateFormatted);

            String encodedMsg = "";
            try {
                encodedMsg = URLEncoder.encode(
                        String.format("📢 *Sri Venkateswara Boys Hostel - %s Fee Reminder*\n\n" +
                                "Hello %s,\n" +
                                "%s.\n\n" +
                                "🏠 Room: %s | Bed: %s\n" +
                                "💰 Fee Amount: ₹%,.0f\n" +
                                "📅 Due Date: %s\n\n" +
                                "💳 *UPI Payment:* 9441843574@ybl (PhonePe / Google Pay / Paytm: 9441843574)\n" +
                                "Kindly reply with your payment screenshot.\n" +
                                "Thank you! - SVBH Management",
                                shortMonth,
                                student.getFullName(), message,
                                student.getRoomNumber() != null ? student.getRoomNumber() : "-",
                                student.getBedNumber() > 0 ? String.valueOf(student.getBedNumber()) : (student.getBedId() != null ? student.getBedId() : "-"),
                                feeAmount, dueDateFormatted
                        ), StandardCharsets.UTF_8);
            } catch (Exception ignored) {}

            String digits = student.getMobileNumber() != null ? student.getMobileNumber().replaceAll("[^0-9]", "") : "";
            if (digits.length() == 10) digits = "91" + digits;
            String whatsappUrl = !digits.isEmpty() ? "https://wa.me/" + digits + "?text=" + encodedMsg : null;

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

        list.sort((a, b) -> Long.compare(a.getDaysRemaining(), b.getDaysRemaining()));
        return list;
    }

    /**
     * Get dynamic summary counts for fee reminders.
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
                .whatsAppConfigured(whatsAppService.isConfigured())
                .whatsAppProvider(whatsAppService.isConfigured() ? "META_CLOUD_API" : "WHATSAPP_WEB")
                .build();
    }

    /**
     * Mark all pending eligible reminders as sent via WhatsApp Web or manual broadcast.
     */
    @Transactional
    public ReminderBatchResultDto markAllAsSentViaWhatsAppWeb(String slot) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        LocalDate maxDueDate = today.plusDays(7);

        List<Student> eligibleStudents = studentRepository.findAll().stream()
                .filter(s -> s.getStatus() != StudentStatus.VACATED)
                .filter(s -> !"PAID".equalsIgnoreCase(s.getPaymentStatus()))
                .filter(s -> {
                    if (s.getNextPaymentDueDate() == null) return true;
                    return !s.getNextPaymentDueDate().isAfter(maxDueDate);
                })
                .collect(Collectors.toList());

        List<PaymentReminderDto> updatedReminders = new ArrayList<>();
        int markedCount = 0;

        for (Student student : eligibleStudents) {
            PaymentReminderDto dto = recordManualReminder(student.getStudentId(), "WHATSAPP_WEB", null);
            updatedReminders.add(dto);
            markedCount++;
        }

        auditService.log("FEE_REMINDER", "MARK_ALL_SENT", slot,
                String.format("Marked %d fee reminders as Sent (WhatsApp Web) for slot %s", markedCount, slot));

        return ReminderBatchResultDto.builder()
                .slot(slot)
                .date(today)
                .totalEligibleStudents(eligibleStudents.size())
                .remindersSent(markedCount)
                .pendingCount(0)
                .metaApiConfigured(whatsAppService.isConfigured())
                .message(String.format("Successfully recorded %d reminders as Sent via WhatsApp Web.", markedCount))
                .reminders(updatedReminders)
                .build();
    }


    /**
     * Generate personalized reminder message incorporating dynamic month (e.g. October 2026).
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

        LocalDate dueDate = student.getNextPaymentDueDate();
        String dueDateStr = dueDate != null ? dueDate.format(DATE_FORMATTER) : "N/A";
        String monthName = dueDate != null ? dueDate.format(MONTH_FORMATTER) : "Current Month";

        String statusNotice;
        double amountToPay = student.getMonthlyRent() != null ? student.getMonthlyRent() : 0.0;
        if ("HALF_PAID".equalsIgnoreCase(student.getPaymentStatus())) {
            double halfAmount = amountToPay / 2.0;
            statusNotice = String.format("you have paid partial fee, and your remaining *%s HALF FEE BALANCE of ₹%.0f is PENDING* to be cleared (Due date: %s)",
                    monthName, halfAmount, dueDateStr);
            amountToPay = halfAmount;
        } else if (daysUntilDue < 0) {
            long overdueDays = Math.abs(daysUntilDue);
            statusNotice = String.format("your *%s hostel rent of ₹%.0f is %d day%s OVERDUE and PENDING* (Due date: %s)",
                    monthName, amountToPay, overdueDays, overdueDays == 1 ? "" : "s", dueDateStr);
        } else if (daysUntilDue == 0) {
            statusNotice = String.format("your *%s hostel rent of ₹%.0f is DUE TODAY* (%s)", monthName, amountToPay, dueDateStr);
        } else if (daysUntilDue == 1) {
            statusNotice = String.format("your *%s hostel rent of ₹%.0f is DUE TOMORROW* (%s)", monthName, amountToPay, dueDateStr);
        } else {
            statusNotice = String.format("your *%s hostel rent of ₹%.0f is due in %d day%s* on %s",
                    monthName, amountToPay, daysUntilDue, daysUntilDue == 1 ? "" : "s", dueDateStr);
        }

        return String.format(
                "📢 *Sri Venkateswara Boys Hostel - %s Fee Due Alert*\n\n" +
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
                monthName,
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

    public List<PaymentReminderDto> getTodayReminders() {
        return reminderRepository.findByReminderDateOrderBySentAtDesc(LocalDate.now(ZoneId.of("Asia/Kolkata")))
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<PaymentReminderDto> getStudentReminders(String studentId) {
        return reminderRepository.findByStudentIdOrderBySentAtDesc(studentId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<PaymentReminderDto> getIncomingReplies() {
        return reminderRepository.findByReplyTextIsNotNullOrderByReplyReceivedAtDesc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

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
                .billingMonth(entity.getBillingMonth())
                .reminderSlot(entity.getReminderSlot())
                .reminderDate(entity.getReminderDate())
                .sentAt(entity.getSentAt())
                .lastAttemptAt(entity.getLastAttemptAt())
                .deliveredAt(entity.getDeliveredAt())
                .readAt(entity.getReadAt())
                .whatsappMessageId(entity.getWhatsappMessageId())
                .lastError(entity.getLastError())
                .apiResponse(entity.getApiResponse())
                .attemptCount(entity.getAttemptCount())
                .channel(entity.getChannel())
                .message(entity.getMessage())
                .status(entity.getStatus())
                .whatsappUrl(whatsappUrl)
                .replyText(entity.getReplyText())
                .replyReceivedAt(entity.getReplyReceivedAt())
                .autoReplyText(entity.getAutoReplyText())
                .autoReplySentAt(entity.getAutoReplySentAt())
                .build();
    }
}
