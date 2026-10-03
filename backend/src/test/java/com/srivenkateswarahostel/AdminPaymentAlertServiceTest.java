package com.srivenkateswarahostel;

import com.srivenkateswarahostel.dto.AdminDueAlertDto;
import com.srivenkateswarahostel.service.AdminPaymentAlertService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AdminPaymentAlertServiceTest {

    @Autowired
    private AdminPaymentAlertService adminPaymentAlertService;

    @Test
    void testGenerateAdminDueAlert_IncludesStudentsDueIn1To3Days() {
        LocalDate today = LocalDate.of(2026, 10, 3);
        AdminDueAlertDto alert = adminPaymentAlertService.generateAdminDueAlert(today);

        assertNotNull(alert);
        System.out.println("Alert Date: " + alert.getAlertDate());
        System.out.println("Due in 1-3 Days count: " + alert.getDueIn3DaysCount());
        System.out.println("Due in 4-5 Days count: " + alert.getDueIn5DaysCount());
        System.out.println("Total Amount Due: " + alert.getTotalAmountDue());
        System.out.println("WhatsApp URL: " + alert.getWhatsappUrl());
        System.out.println("Digest Message:\n" + alert.getDigestMessage());

        // Manga Narender is due on Oct 5 (which is 2 days from Oct 3)
        assertTrue(alert.getDueIn3DaysCount() >= 1, "Should have at least 1 resident due in 1-3 days window");
        boolean foundMangaNarender = alert.getStudentsDueIn3Days().stream()
                .anyMatch(s -> "SVBH-2026-002".equals(s.getStudentId()) || "Manga Narender".equalsIgnoreCase(s.getStudentName()));
        assertTrue(foundMangaNarender, "Manga Narender must be in the 1-3 days alert list");
    }

    @Autowired
    private com.srivenkateswarahostel.service.PaymentReminderService paymentReminderService;

    @Test
    void testProcessScheduledReminders_ProcessesEligibleResidents() {
        var result = paymentReminderService.processScheduledReminders("MORNING", true);
        assertNotNull(result);
        System.out.println("Batch result message: " + result.getMessage());
        System.out.println("Reminders sent count: " + result.getRemindersSent());
        System.out.println("Eligible students count: " + result.getTotalEligibleStudents());
        assertTrue(result.getRemindersSent() > 0, "Should have processed at least 1 reminder");
    }
}
