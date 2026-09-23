package com.srivenkateswarahostel.controller;

import com.srivenkateswarahostel.dto.ApiResponse;
import com.srivenkateswarahostel.dto.PaymentReminderDto;
import com.srivenkateswarahostel.dto.ReminderBatchResultDto;
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

    @PostMapping("/trigger")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Manually trigger morning or evening scheduled reminder batch")
    public ResponseEntity<ApiResponse<ReminderBatchResultDto>> triggerBatch(
            @RequestParam(defaultValue = "MORNING") String slot,
            @RequestParam(defaultValue = "false") boolean force) {
        ReminderBatchResultDto result = reminderService.processScheduledReminders(slot, force);
        return ResponseEntity.ok(ApiResponse.success(result, result.getMessage()));
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
}
