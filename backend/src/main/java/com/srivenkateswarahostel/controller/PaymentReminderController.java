package com.srivenkateswarahostel.controller;

import com.srivenkateswarahostel.dto.*;
import com.srivenkateswarahostel.service.AdminPaymentAlertService;
import com.srivenkateswarahostel.service.PaymentReminderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
@Tag(name = "Payment Reminders", description = "Fee Payment Reminders & Scheduled Notifications")
public class PaymentReminderController {

    private final PaymentReminderService reminderService;
    private final AdminPaymentAlertService adminPaymentAlertService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get active fee payment reminders for all residents with pending or upcoming dues")
    public ResponseEntity<ApiResponse<List<FeeReminderDto>>> getActiveFeeReminders() {
        List<FeeReminderDto> reminders = reminderService.getActiveFeeReminders();
        return ResponseEntity.ok(ApiResponse.success(reminders, "Active fee reminders retrieved successfully"));
    }

    @GetMapping("/counts")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get summary counts for upcoming, due today, overdue, and paid fees")
    public ResponseEntity<ApiResponse<ReminderCountsDto>> getReminderCounts() {
        ReminderCountsDto counts = reminderService.getReminderCounts();
        return ResponseEntity.ok(ApiResponse.success(counts, "Reminder counts retrieved successfully"));
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get list of all payment reminders sent today")
    public ResponseEntity<ApiResponse<List<PaymentReminderDto>>> getTodayReminders() {
        List<PaymentReminderDto> reminders = reminderService.getTodayReminders();
        return ResponseEntity.ok(ApiResponse.success(reminders));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get reminder history for a specific student")
    public ResponseEntity<ApiResponse<List<PaymentReminderDto>>> getStudentReminders(
            @PathVariable String studentId) {
        List<PaymentReminderDto> reminders = reminderService.getStudentReminders(studentId);
        return ResponseEntity.ok(ApiResponse.success(reminders));
    }

    @PostMapping("/{studentId}/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Send fee payment reminder to student via Meta WhatsApp Cloud API")
    public ResponseEntity<ApiResponse<PaymentReminderDto>> sendStudentReminder(
            @PathVariable String studentId,
            @RequestParam(defaultValue = "MANUAL") String slot,
            @RequestParam(defaultValue = "false") boolean force) {
        PaymentReminderDto result = reminderService.dispatchWhatsAppReminder(studentId, slot, force);
        String msg = "SENT".equalsIgnoreCase(result.getStatus())
                ? "WhatsApp fee reminder sent successfully to " + result.getStudentName()
                : "PENDING".equalsIgnoreCase(result.getStatus())
                ? "Prepared reminder. Open WhatsApp Web/App to dispatch."
                : "Failed to dispatch WhatsApp reminder: " + (result.getLastError() != null ? result.getLastError() : "Unknown error");
        return ResponseEntity.ok(ApiResponse.success(result, msg));
    }

    @PostMapping("/{studentId}/retry")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Retry sending a previously failed fee reminder")
    public ResponseEntity<ApiResponse<PaymentReminderDto>> retryStudentReminder(
            @PathVariable String studentId) {
        PaymentReminderDto result = reminderService.retryReminder(studentId);
        String msg = "SENT".equalsIgnoreCase(result.getStatus())
                ? "WhatsApp fee reminder retry succeeded for " + result.getStudentName()
                : "Retry failed: " + (result.getLastError() != null ? result.getLastError() : "Unknown error");
        return ResponseEntity.ok(ApiResponse.success(result, msg));
    }

    @PostMapping("/trigger")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Manually trigger scheduled reminder batch (supports force and includeSkipped)")
    public ResponseEntity<ApiResponse<ReminderBatchResultDto>> triggerBatch(
            @RequestParam(defaultValue = "MORNING") String slot,
            @RequestParam(defaultValue = "false") boolean force,
            @RequestParam(defaultValue = "false") boolean includeSkipped) {
        ReminderBatchResultDto result = reminderService.processScheduledReminders(slot, force, includeSkipped);
        return ResponseEntity.ok(ApiResponse.success(result, result.getMessage()));
    }

    @PostMapping("/send-skipped")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Send reminders to all residents including those previously skipped or manually sent")
    public ResponseEntity<ApiResponse<ReminderBatchResultDto>> sendSkippedReminders(
            @RequestParam(defaultValue = "ALL") String slot) {
        ReminderBatchResultDto result = reminderService.processScheduledReminders(slot, true, true);
        return ResponseEntity.ok(ApiResponse.success(result, result.getMessage()));
    }

    @PostMapping("/mark-all-sent")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Mark all eligible pending reminders as sent via WhatsApp Web/Broadcast")
    public ResponseEntity<ApiResponse<ReminderBatchResultDto>> markAllAsSent(
            @RequestParam(defaultValue = "ALL") String slot) {
        ReminderBatchResultDto result = reminderService.markAllAsSentViaWhatsAppWeb(slot);
        return ResponseEntity.ok(ApiResponse.success(result, result.getMessage()));
    }


    @PostMapping("/reset-today")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reset today's duplicate lock so reminders can be resent fresh")
    public ResponseEntity<ApiResponse<Void>> resetTodayReminders(@RequestParam(required = false) String slot) {
        reminderService.resetTodayReminders(slot);
        return ResponseEntity.ok(ApiResponse.successMessage("Today's reminder lock cleared successfully. You can now dispatch reminders."));
    }

    @PostMapping("/record")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Record a manual reminder sent to a resident (WhatsApp, SMS, Call)")
    public ResponseEntity<ApiResponse<PaymentReminderDto>> recordManualReminder(
            @RequestParam String studentId,
            @RequestParam(defaultValue = "WHATSAPP") String channel,
            @RequestParam(required = false) String customMessage) {
        PaymentReminderDto reminder = reminderService.recordManualReminder(studentId, channel, customMessage);
        return ResponseEntity.ok(ApiResponse.success(reminder, "Reminder logged successfully"));
    }

    @PostMapping("/reply")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Simulate or record an incoming resident reply and trigger automated reply")
    public ResponseEntity<ApiResponse<IncomingReplyResponseDto>> handleIncomingReply(
            @RequestBody IncomingReplyRequestDto request) {
        IncomingReplyResponseDto response = reminderService.handleIncomingReply(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Incoming message logged and auto-reply processed"));
    }

    @GetMapping("/replies")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get list of recent incoming resident replies and auto-replies")
    public ResponseEntity<ApiResponse<List<PaymentReminderDto>>> getIncomingReplies() {
        List<PaymentReminderDto> replies = reminderService.getIncomingReplies();
        return ResponseEntity.ok(ApiResponse.success(replies));
    }

    @GetMapping("/admin-alert")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Get management 5-day & 3-day payment due alert preview")
    public ResponseEntity<ApiResponse<AdminDueAlertDto>> getAdminDueAlert() {
        AdminDueAlertDto alert = adminPaymentAlertService.generateAdminDueAlert(null);
        return ResponseEntity.ok(ApiResponse.success(alert));
    }

    @PostMapping("/admin-alert/send")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Send management payment due alert to svbhostel2026@gmail.com & mobile 8985010694")
    public ResponseEntity<ApiResponse<AdminDueAlertDto>> sendAdminDueAlert(
            @RequestParam(defaultValue = "false") boolean force) {
        AdminDueAlertDto alert = adminPaymentAlertService.sendAdminDueAlert(force);
        String msg;
        if ("ALREADY_SENT_TODAY".equals(alert.getStatus())) {
            msg = "Alert already logged today (click Force Resend to send again)";
        } else if ("SENT".equals(alert.getStatus())) {
            msg = "Management due alert email sent successfully to " + alert.getRecipientEmail();
        } else {
            msg = "Management fee alert digest recorded successfully. WhatsApp digest ready for " + alert.getRecipientMobile();
        }
        return ResponseEntity.ok(ApiResponse.success(alert, msg));
    }
}
