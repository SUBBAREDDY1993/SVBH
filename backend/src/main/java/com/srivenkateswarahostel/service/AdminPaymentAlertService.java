package com.srivenkateswarahostel.service;

import com.srivenkateswarahostel.dto.AdminDueAlertDto;
import com.srivenkateswarahostel.dto.PaymentDueDto;
import com.srivenkateswarahostel.model.PaymentReminderLog;
import com.srivenkateswarahostel.model.Student;
import com.srivenkateswarahostel.model.StudentStatus;
import com.srivenkateswarahostel.repository.PaymentReminderRepository;
import com.srivenkateswarahostel.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminPaymentAlertService {

    private final StudentRepository studentRepository;
    private final PaymentReminderRepository reminderRepository;
    private final StudentService studentService;
    private final AuditService auditService;
    private final EmailService emailService;

    @Value("${app.admin.alert.email:svbhostel2026@gmail.com}")
    private String alertEmail;

    @Value("${app.admin.alert.mobile:8985010694}")
    private String alertMobile;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

    /**
     * Automatic check on Application Startup.
     * If the management digest was not yet dispatched today, trigger it immediately.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onStartupCheckManagementAlert() {
        log.info("System startup: Checking daily management payment due alert status...");
        try {
            LocalDate today = LocalDate.now();
            String slotId = "ADMIN_ALERT_5D_3D";
            boolean alreadySentToday = reminderRepository.existsByStudentIdAndReminderDateAndReminderSlot(
                    "MANAGEMENT_ALERT", today, slotId);
            if (!alreadySentToday) {
                log.info("Management alert for today ({}) has not been logged yet. Running automated dispatch...", today);
                sendAdminDueAlert(false);
            } else {
                log.info("Management fee alert for today ({}) is already recorded in the system.", today);
            }
        } catch (Exception e) {
            log.warn("Startup check for management alert encountered a non-fatal error: {}", e.getMessage());
        }
    }

    /**
     * Daily morning management alert at 8:30 AM IST.
     * Evaluates all active residents with fee dues in 1-3 days (urgent) and 4-5 days (upcoming).
     * Dispatches notification to svbhostel2026@gmail.com and WhatsApp digest for 8985010694.
     */
    @Scheduled(cron = "0 30 8 * * *", zone = "Asia/Kolkata")
    public void scheduledDailyMorningManagementAlert() {
        log.info("Running automated 8:30 AM management fee alert job (5-day & 3-day window)...");
        try {
            sendAdminDueAlert(false);
        } catch (Exception e) {
            log.error("Failed to run automated morning management fee alert: {}", e.getMessage(), e);
        }
    }

    /**
     * Daily evening management alert at 6:30 PM IST.
     */
    @Scheduled(cron = "0 30 18 * * *", zone = "Asia/Kolkata")
    public void scheduledDailyEveningManagementAlert() {
        log.info("Running automated 6:30 PM evening management fee alert check...");
        try {
            sendAdminDueAlert(false);
        } catch (Exception e) {
            log.error("Failed to run automated evening management fee alert: {}", e.getMessage(), e);
        }
    }

    /**
     * Generate 5-day and 3-day payment due report for management.
     * - 1 to 3 Days Prior (Urgent Attention): [today + 1, today + 3]
     * - 4 to 5 Days Prior (Upcoming Notice): [today + 4, today + 5]
     * - Due Today: [today, today]
     */
    public AdminDueAlertDto generateAdminDueAlert(LocalDate today) {
        if (today == null) {
            today = LocalDate.now();
        }

        try {
            studentService.syncLiveMonthlyDueDates();
        } catch (Exception e) {
            log.warn("Non-fatal: could not sync live monthly dues during admin alert: {}", e.getMessage());
        }

        LocalDate urgentStart = today.plusDays(1);
        LocalDate urgentEnd = today.plusDays(3);

        LocalDate upcomingStart = today.plusDays(4);
        LocalDate upcomingEnd = today.plusDays(5);

        // Fetch all active non-vacated students with unpaid fee dues
        LocalDate finalToday = today;
        List<Student> activeUnpaid = studentRepository.findAll()
                .stream()
                .filter(s -> s.getStatus() != StudentStatus.VACATED)
                .filter(s -> s.getNextPaymentDueDate() != null)
                .filter(s -> !"PAID".equalsIgnoreCase(s.getPaymentStatus()))
                .collect(Collectors.toList());

        // 1 to 3 Days Window (Urgent)
        List<PaymentDueDto> students3Days = activeUnpaid.stream()
                .filter(s -> !s.getNextPaymentDueDate().isBefore(urgentStart) && !s.getNextPaymentDueDate().isAfter(urgentEnd))
                .map(s -> toDueDto(s, finalToday))
                .collect(Collectors.toList());

        // 4 to 5 Days Window (Upcoming)
        List<PaymentDueDto> students5Days = activeUnpaid.stream()
                .filter(s -> !s.getNextPaymentDueDate().isBefore(upcomingStart) && !s.getNextPaymentDueDate().isAfter(upcomingEnd))
                .map(s -> toDueDto(s, finalToday))
                .collect(Collectors.toList());

        // Due Today Window
        List<PaymentDueDto> studentsDueToday = activeUnpaid.stream()
                .filter(s -> s.getNextPaymentDueDate().isEqual(finalToday))
                .map(s -> toDueDto(s, finalToday))
                .collect(Collectors.toList());

        double totalAmount3Days = students3Days.stream()
                .mapToDouble(s -> s.getMonthlyRent() != null ? s.getMonthlyRent() : 0.0)
                .sum();
        double totalAmount5Days = students5Days.stream()
                .mapToDouble(s -> s.getMonthlyRent() != null ? s.getMonthlyRent() : 0.0)
                .sum();
        double totalAmountToday = studentsDueToday.stream()
                .mapToDouble(s -> s.getMonthlyRent() != null ? s.getMonthlyRent() : 0.0)
                .sum();

        double grandTotal = totalAmountToday + totalAmount3Days + totalAmount5Days;
        int totalCount = studentsDueToday.size() + students3Days.size() + students5Days.size();

        String digestMessage = buildDigestMessage(today, urgentStart, urgentEnd, upcomingStart, upcomingEnd,
                studentsDueToday, students3Days, students5Days, grandTotal);
        String emailHtml = buildEmailHtml(today, urgentStart, urgentEnd, upcomingStart, upcomingEnd,
                studentsDueToday, students3Days, students5Days, grandTotal);

        String whatsappDigits = alertMobile.replaceAll("[^0-9]", "");
        if (whatsappDigits.length() == 10) {
            whatsappDigits = "91" + whatsappDigits;
        }
        String whatsappUrl = "https://wa.me/" + whatsappDigits + "?text=" + URLEncoder.encode(digestMessage, StandardCharsets.UTF_8);

        String subject = String.format("📢 [SVBH Alert] Fee Payment Due in 1-5 Days: %d Residents (₹%,.0f)",
                totalCount, grandTotal);

        return AdminDueAlertDto.builder()
                .recipientEmail(alertEmail)
                .recipientMobile(alertMobile)
                .alertDate(today)
                .dueIn5DaysCount(students5Days.size())
                .dueIn3DaysCount(students3Days.size())
                .dueTodayCount(studentsDueToday.size())
                .totalStudentsCount(totalCount)
                .totalAmountDue(grandTotal)
                .studentsDueIn5Days(students5Days)
                .studentsDueIn3Days(students3Days)
                .studentsDueToday(studentsDueToday)
                .digestMessage(digestMessage)
                .emailSubject(subject)
                .emailHtmlBody(emailHtml)
                .whatsappUrl(whatsappUrl)
                .status("READY")
                .build();
    }

    /**
     * Dispatch management fee alert via Email and record tracking log.
     */
    @Transactional
    public AdminDueAlertDto sendAdminDueAlert(boolean force) {
        LocalDate today = LocalDate.now();
        AdminDueAlertDto alertDto = generateAdminDueAlert(today);

        String slotId = "ADMIN_ALERT_5D_3D";
        boolean alreadySentToday = reminderRepository.existsByStudentIdAndReminderDateAndReminderSlot(
                "MANAGEMENT_ALERT", today, slotId);

        if (!force && alreadySentToday) {
            log.info("Management alert for 5-day & 3-day dues was already sent today. Skipping (use force=true to resend).");
            alertDto.setStatus("ALREADY_SENT_TODAY");
            alertDto.setEmailDelivered(false);
            alertDto.setEmailDeliveryMessage("Alert was already recorded today.");
            return alertDto;
        }

        // Dispatch Email to svbhostel2026@gmail.com
        boolean emailSuccess = emailService.sendEmail(
                alertEmail,
                alertDto.getEmailSubject(),
                alertDto.getEmailHtmlBody(),
                alertDto.getDigestMessage()
        );

        // Record Management Alert Log in Database
        PaymentReminderLog logEntry = PaymentReminderLog.builder()
                .studentId("MANAGEMENT_ALERT")
                .studentName("Management Digest (" + alertEmail + ")")
                .mobileNumber(alertMobile)
                .roomNumber("OFFICE")
                .bedId("ADMIN")
                .amountDue(alertDto.getTotalAmountDue())
                .nextPaymentDueDate(today.plusDays(3))
                .daysUntilDue(3)
                .reminderSlot(slotId)
                .reminderDate(today)
                .sentAt(LocalDateTime.now())
                .channel("ADMIN_EMAIL_WHATSAPP")
                .message(alertDto.getDigestMessage())
                .status(emailSuccess ? "SENT" : "LOGGED")
                .build();

        reminderRepository.save(logEntry);

        auditService.log("MANAGEMENT_ALERT", "EMAIL_WHATSAPP", alertEmail,
                String.format("Dispatched 5-day & 3-day fee alert to %s & mobile %s (%d residents, ₹%,.0f)",
                        alertEmail, alertMobile, alertDto.getTotalStudentsCount(), alertDto.getTotalAmountDue()));

        alertDto.setStatus(emailSuccess ? "SENT" : "LOGGED");
        alertDto.setEmailDelivered(emailSuccess);
        alertDto.setEmailDeliveryMessage(emailSuccess
                ? "Email sent successfully to " + alertEmail
                : "Alert saved to system database & WhatsApp digest ready. (To receive direct Gmail delivery, set Gmail App Password in application.properties or SPRING_MAIL_PASSWORD)");

        return alertDto;
    }

    private PaymentDueDto toDueDto(Student student, LocalDate today) {
        double amount = student.getMonthlyRent() != null ? student.getMonthlyRent() : 0.0;
        if ("HALF_PAID".equalsIgnoreCase(student.getPaymentStatus())) {
            amount = amount / 2.0;
        }

        long daysUntilDue = student.getNextPaymentDueDate() != null
                ? ChronoUnit.DAYS.between(today, student.getNextPaymentDueDate())
                : 0;

        return PaymentDueDto.builder()
                .studentId(student.getStudentId())
                .studentName(student.getFullName())
                .mobileNumber(student.getMobileNumber())
                .roomNumber(student.getRoomNumber())
                .bedId(student.getBedId())
                .bedNumber(student.getBedNumber())
                .monthlyRent(amount)
                .nextPaymentDueDate(student.getNextPaymentDueDate())
                .paymentStatus(student.getPaymentStatus())
                .dueCategory(daysUntilDue == 0 ? "DUE_TODAY" : "DUE_SOON")
                .overdue(false)
                .daysOverdue(0)
                .daysUntilDue(daysUntilDue)
                .build();
    }

    private String buildDigestMessage(LocalDate today, LocalDate urgentStart, LocalDate urgentEnd,
                                      LocalDate upcomingStart, LocalDate upcomingEnd,
                                      List<PaymentDueDto> listToday, List<PaymentDueDto> list3,
                                      List<PaymentDueDto> list5, double total) {
        StringBuilder sb = new StringBuilder();
        sb.append("📢 *Sri Venkateswara Boys Hostel - Management Fee Alert*\n\n");
        sb.append("📅 *Alert Date:* ").append(today.format(DATE_FORMATTER)).append("\n");
        sb.append("✉️ *Target Email:* ").append(alertEmail).append("\n");
        sb.append("📞 *Target Mobile:* ").append(alertMobile).append("\n\n");

        if (!listToday.isEmpty()) {
            sb.append("🚨 *FEE DUE TODAY (").append(today.format(DATE_FORMATTER)).append("):* ")
                    .append(listToday.size()).append(" Resident(s)\n");
            for (PaymentDueDto s : listToday) {
                sb.append("  • *").append(s.getStudentName()).append("* (Room ").append(s.getRoomNumber())
                        .append(", Bed ").append(s.getBedId()).append(")")
                        .append(" - ₹").append(String.format("%,.0f", s.getMonthlyRent()))
                        .append(" | 📱 ").append(s.getMobileNumber() != null ? s.getMobileNumber() : "N/A")
                        .append("\n");
            }
            sb.append("\n");
        }

        sb.append("🔔 *FEE DUE IN 1 TO 3 DAYS (").append(urgentStart.format(DATE_FORMATTER))
                .append(" to ").append(urgentEnd.format(DATE_FORMATTER)).append("):* ")
                .append(list3.size()).append(" Resident(s)\n");
        if (list3.isEmpty()) {
            sb.append("  • No residents due in next 3 days.\n");
        } else {
            for (PaymentDueDto s : list3) {
                String dueDateStr = s.getNextPaymentDueDate() != null ? s.getNextPaymentDueDate().format(DATE_FORMATTER) : "N/A";
                sb.append("  • *").append(s.getStudentName()).append("* (Room ").append(s.getRoomNumber())
                        .append(", Bed ").append(s.getBedId()).append(")")
                        .append(" - ₹").append(String.format("%,.0f", s.getMonthlyRent()))
                        .append(" (Due: ").append(dueDateStr).append(")")
                        .append(" | 📱 ").append(s.getMobileNumber() != null ? s.getMobileNumber() : "N/A")
                        .append("\n");
            }
        }
        sb.append("\n");

        sb.append("🔔 *FEE DUE IN 4 TO 5 DAYS (").append(upcomingStart.format(DATE_FORMATTER))
                .append(" to ").append(upcomingEnd.format(DATE_FORMATTER)).append("):* ")
                .append(list5.size()).append(" Resident(s)\n");
        if (list5.isEmpty()) {
            sb.append("  • No residents due in 4-5 days.\n");
        } else {
            for (PaymentDueDto s : list5) {
                String dueDateStr = s.getNextPaymentDueDate() != null ? s.getNextPaymentDueDate().format(DATE_FORMATTER) : "N/A";
                sb.append("  • *").append(s.getStudentName()).append("* (Room ").append(s.getRoomNumber())
                        .append(", Bed ").append(s.getBedId()).append(")")
                        .append(" - ₹").append(String.format("%,.0f", s.getMonthlyRent()))
                        .append(" (Due: ").append(dueDateStr).append(")")
                        .append(" | 📱 ").append(s.getMobileNumber() != null ? s.getMobileNumber() : "N/A")
                        .append("\n");
            }
        }
        sb.append("\n");

        sb.append("💰 *Total Expected Collection:* ₹").append(String.format("%,.0f", total)).append("\n\n");
        sb.append("📍 *Sri Venkateswara Boys Hostel Management*\n");
        sb.append("SR Nagar, Ameerpet, Hyderabad - 500038\n");
        sb.append("📞 +91 9441843574 | ✉️ svbhostel2026@gmail.com");

        return sb.toString();
    }

    private String buildEmailHtml(LocalDate today, LocalDate urgentStart, LocalDate urgentEnd,
                                  LocalDate upcomingStart, LocalDate upcomingEnd,
                                  List<PaymentDueDto> listToday, List<PaymentDueDto> list3,
                                  List<PaymentDueDto> list5, double total) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html><body style='font-family: Arial, sans-serif; color: #1e293b; background-color: #f8fafc; padding: 20px;'>");
        sb.append("<div style='max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;'>");

        // Header
        sb.append("<div style='background-color: #0f172a; color: #ffffff; padding: 24px; text-align: center;'>");
        sb.append("<h2 style='margin: 0; font-size: 20px;'>Sri Venkateswara Boys Hostel</h2>");
        sb.append("<p style='margin: 6px 0 0; color: #38bdf8; font-size: 13px; font-weight: bold;'>MANAGEMENT PAYMENT DUE ALERT (1-5 DAYS PRIOR WINDOW)</p>");
        sb.append("</div>");

        // Body
        sb.append("<div style='padding: 24px;'>");
        sb.append("<p style='font-size: 14px; margin-top: 0;'>Hello Administrator,</p>");
        sb.append("<p style='font-size: 14px; color: #475569;'>Here is your automated fee due tracking digest for <strong>")
                .append(today.format(DATE_FORMATTER)).append("</strong>.</p>");

        // Summary KPI Boxes
        sb.append("<div style='display: flex; gap: 12px; margin: 20px 0;'>");

        sb.append("<div style='flex: 1; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; text-align: center;'>");
        sb.append("<div style='font-size: 22px; font-weight: bold; color: #b91c1c;'>").append(listToday.size()).append("</div>");
        sb.append("<div style='font-size: 12px; color: #b91c1c; font-weight: bold;'>Due Today</div>");
        sb.append("<div style='font-size: 11px; color: #64748b;'>(").append(today.format(DATE_FORMATTER)).append(")</div>");
        sb.append("</div>");

        sb.append("<div style='flex: 1; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; text-align: center;'>");
        sb.append("<div style='font-size: 22px; font-weight: bold; color: #92400e;'>").append(list3.size()).append("</div>");
        sb.append("<div style='font-size: 12px; color: #b45309; font-weight: bold;'>Due in 1-3 Days</div>");
        sb.append("<div style='font-size: 11px; color: #64748b;'>(").append(urgentStart.format(DATE_FORMATTER)).append(" - ").append(urgentEnd.format(DATE_FORMATTER)).append(")</div>");
        sb.append("</div>");

        sb.append("<div style='flex: 1; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center;'>");
        sb.append("<div style='font-size: 22px; font-weight: bold; color: #166534;'>").append(list5.size()).append("</div>");
        sb.append("<div style='font-size: 12px; color: #15803d; font-weight: bold;'>Due in 4-5 Days</div>");
        sb.append("<div style='font-size: 11px; color: #64748b;'>(").append(upcomingStart.format(DATE_FORMATTER)).append(" - ").append(upcomingEnd.format(DATE_FORMATTER)).append(")</div>");
        sb.append("</div>");

        sb.append("<div style='flex: 1; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; text-align: center;'>");
        sb.append("<div style='font-size: 22px; font-weight: bold; color: #1e40af;'>₹").append(String.format("%,.0f", total)).append("</div>");
        sb.append("<div style='font-size: 12px; color: #2563eb; font-weight: bold;'>Total Expected</div>");
        sb.append("<div style='font-size: 11px; color: #64748b;'>Collection</div>");
        sb.append("</div>");

        sb.append("</div>");

        // Section Due Today (if any)
        if (!listToday.isEmpty()) {
            sb.append("<h4 style='color: #b91c1c; margin-bottom: 8px;'>🚨 Payments Due Today (").append(today.format(DATE_FORMATTER)).append(")</h4>");
            appendResidentTable(sb, listToday);
        }

        // Section 1-3 Days
        sb.append("<h4 style='color: #b45309; margin-bottom: 8px;'>📌 Dues in 1 to 3 Days (").append(urgentStart.format(DATE_FORMATTER)).append(" to ").append(urgentEnd.format(DATE_FORMATTER)).append(")</h4>");
        if (list3.isEmpty()) {
            sb.append("<p style='font-size: 13px; color: #64748b; font-style: italic;'>No residents due in next 3 days.</p>");
        } else {
            appendResidentTable(sb, list3);
        }

        // Section 4-5 Days
        sb.append("<h4 style='color: #166534; margin-bottom: 8px;'>📌 Dues in 4 to 5 Days (").append(upcomingStart.format(DATE_FORMATTER)).append(" to ").append(upcomingEnd.format(DATE_FORMATTER)).append(")</h4>");
        if (list5.isEmpty()) {
            sb.append("<p style='font-size: 13px; color: #64748b; font-style: italic;'>No residents due in 4-5 days.</p>");
        } else {
            appendResidentTable(sb, list5);
        }

        sb.append("<p style='font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;'>")
                .append("Sent automatically to ").append(alertEmail).append(" | Sri Venkateswara Boys Hostel Management System</p>");
        sb.append("</div></div></body></html>");

        return sb.toString();
    }

    private void appendResidentTable(StringBuilder sb, List<PaymentDueDto> list) {
        sb.append("<table style='width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;'>");
        sb.append("<tr style='background-color: #f1f5f9; text-align: left;'><th style='padding: 8px;'>Resident</th><th style='padding: 8px;'>Room/Bed</th><th style='padding: 8px;'>Rent</th><th style='padding: 8px;'>Due Date</th><th style='padding: 8px;'>Mobile</th></tr>");
        for (PaymentDueDto s : list) {
            String dueDateStr = s.getNextPaymentDueDate() != null ? s.getNextPaymentDueDate().format(DATE_FORMATTER) : "N/A";
            sb.append("<tr style='border-bottom: 1px solid #e2e8f0;'>")
                    .append("<td style='padding: 8px; font-weight: bold;'>").append(s.getStudentName()).append("</td>")
                    .append("<td style='padding: 8px;'>Room ").append(s.getRoomNumber()).append(" (").append(s.getBedId()).append(")</td>")
                    .append("<td style='padding: 8px; font-weight: bold; color: #0f172a;'>₹").append(String.format("%,.0f", s.getMonthlyRent())).append("</td>")
                    .append("<td style='padding: 8px; color: #2563eb;'>").append(dueDateStr).append("</td>")
                    .append("<td style='padding: 8px; color: #64748b;'>").append(s.getMobileNumber()).append("</td>")
                    .append("</tr>");
        }
        sb.append("</table>");
    }
}
