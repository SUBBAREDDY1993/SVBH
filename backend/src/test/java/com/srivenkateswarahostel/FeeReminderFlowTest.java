package com.srivenkateswarahostel;

import com.srivenkateswarahostel.dto.FeeReminderDto;
import com.srivenkateswarahostel.dto.ReminderCountsDto;
import com.srivenkateswarahostel.service.PaymentReminderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class FeeReminderFlowTest {

    @Autowired
    private PaymentReminderService paymentReminderService;

    @Test
    void testGetActiveFeeReminders_ReturnsCorrectStructureAndSorting() {
        List<FeeReminderDto> reminders = paymentReminderService.getActiveFeeReminders();
        assertNotNull(reminders);
        System.out.println("Active Fee Reminders count: " + reminders.size());

        for (FeeReminderDto r : reminders) {
            assertNotNull(r.getStudentId(), "Student ID must not be null");
            assertNotNull(r.getStudentName(), "Student Name must not be null");
            assertNotNull(r.getDueDate(), "Due date must not be null");
            assertTrue(r.getFeeAmount() > 0, "Fee amount must be greater than zero");
            assertNotNull(r.getStatus(), "Status must not be null");
            assertNotNull(r.getMessage(), "Message must not be null");
            assertNotNull(r.getReminderText(), "Reminder text must not be null");

            System.out.printf("Reminder: %s | Room %s | Bed %s | Fee: ₹%.0f | Due: %s | Days: %d | Status: %s | Message: %s%n",
                    r.getStudentName(), r.getRoomNumber(), r.getBedNumber(), r.getFeeAmount(),
                    r.getDueDateFormatted(), r.getDaysRemaining(), r.getStatus(), r.getMessage());

            // Verify reminder text format requested by user
            assertTrue(r.getReminderText().contains("Fee payment reminder:"), "Reminder text must contain standard prefix");
            assertTrue(r.getReminderText().contains(r.getStudentName()), "Reminder text must contain student name");
        }

        // Verify sorting: overdue first (lowest daysRemaining), then upcoming
        for (int i = 0; i < reminders.size() - 1; i++) {
            assertTrue(reminders.get(i).getDaysRemaining() <= reminders.get(i + 1).getDaysRemaining(),
                    "Reminders must be sorted in ascending order of days remaining (overdue first)");
        }
    }

    @Test
    void testGetReminderCounts_ReturnsDynamicDatabaseCounts() {
        ReminderCountsDto counts = paymentReminderService.getReminderCounts();
        assertNotNull(counts);
        System.out.printf("Dynamic Reminder Counts -> Upcoming: %d, Due Today: %d, Overdue: %d, Paid: %d, Total Active: %d%n",
                counts.getUpcomingFees(), counts.getDueToday(), counts.getOverdue(), counts.getPaid(), counts.getTotalActive());

        assertTrue(counts.getUpcomingFees() >= 0);
        assertTrue(counts.getDueToday() >= 0);
        assertTrue(counts.getOverdue() >= 0);
        assertTrue(counts.getPaid() >= 0);
    }
}
