package com.srivenkateswarahostel.model;

/**
 * Lifecycle states for hostel fee payment reminders.
 * - PENDING: Reminder is queued or identified as needing dispatch
 * - PROCESSING: Reminder is currently being sent to the WhatsApp API
 * - SENT: WhatsApp API successfully accepted the message (captured wamid)
 * - FAILED: Delivery or API request failed (eligible for safe retry)
 * - SKIPPED: Intentionally skipped (e.g. valid reminder already delivered today)
 * - DELIVERED: Meta webhook confirmed message delivered to device
 * - READ: Meta webhook confirmed resident opened/read the message
 */
public enum ReminderStatus {
    PENDING,
    PROCESSING,
    SENT,
    FAILED,
    SKIPPED,
    DELIVERED,
    READ
}
