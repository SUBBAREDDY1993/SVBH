package com.srivenkateswarahostel.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.srivenkateswarahostel.dto.IncomingReplyRequestDto;
import com.srivenkateswarahostel.service.PaymentReminderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reminders/webhook")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "WhatsApp Webhook", description = "Meta WhatsApp Cloud API Webhook for delivery receipts and resident replies")
public class WhatsAppWebhookController {

    private final PaymentReminderService reminderService;
    private final ObjectMapper objectMapper;

    @Value("${app.whatsapp.webhook-verify-token:svbh_hostel_webhook_secret_2026}")
    private String verifyToken;

    /**
     * Meta Webhook Verification Handshake.
     * When configuring the webhook URL in Meta App Dashboard, Meta sends a GET request
     * with hub.mode, hub.challenge, and hub.verify_token.
     */
    @GetMapping
    @Operation(summary = "Verify Meta WhatsApp Webhook endpoint")
    public ResponseEntity<String> verifyWebhook(
            @RequestParam(name = "hub.mode", required = false) String mode,
            @RequestParam(name = "hub.challenge", required = false) String challenge,
            @RequestParam(name = "hub.verify_token", required = false) String token) {

        log.info("Received WhatsApp webhook verification handshake request: mode={}, token={}", mode, token);

        if ("subscribe".equals(mode) && verifyToken.equals(token)) {
            log.info("WhatsApp webhook verified successfully!");
            return ResponseEntity.ok(challenge);
        } else {
            log.warn("WhatsApp webhook verification failed! Invalid token or mode.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Verification token mismatch");
        }
    }

    /**
     * Meta Webhook Event Notification Receiver.
     * Receives delivery receipts (SENT, DELIVERED, READ, FAILED) and incoming resident messages.
     */
    @PostMapping
    @Operation(summary = "Handle incoming Meta WhatsApp events (delivery updates & resident messages)")
    public ResponseEntity<String> handleWebhookEvent(@RequestBody String payload) {
        log.debug("Received WhatsApp webhook event payload: {}", payload);

        try {
            JsonNode root = objectMapper.readTree(payload);
            JsonNode entryArray = root.get("entry");
            if (entryArray != null && entryArray.isArray()) {
                for (JsonNode entry : entryArray) {
                    JsonNode changesArray = entry.get("changes");
                    if (changesArray != null && changesArray.isArray()) {
                        for (JsonNode change : changesArray) {
                            JsonNode value = change.get("value");
                            if (value != null) {

                                // 1. Handle Delivery Status Updates (SENT, DELIVERED, READ, FAILED)
                                JsonNode statuses = value.get("statuses");
                                if (statuses != null && statuses.isArray()) {
                                    for (JsonNode statusNode : statuses) {
                                        String wamid = statusNode.has("id") ? statusNode.get("id").asText() : null;
                                        String status = statusNode.has("status") ? statusNode.get("status").asText() : null;
                                        String error = null;
                                        if (statusNode.has("errors") && statusNode.get("errors").isArray() && !statusNode.get("errors").isEmpty()) {
                                            error = statusNode.get("errors").get(0).toString();
                                        }

                                        if (wamid != null && status != null) {
                                            reminderService.updateReminderStatusByMessageId(wamid, status, error);
                                        }
                                    }
                                }

                                // 2. Handle Incoming Resident Messages (Trigger Auto-Reply)
                                JsonNode messages = value.get("messages");
                                if (messages != null && messages.isArray()) {
                                    for (JsonNode msgNode : messages) {
                                        String fromPhone = msgNode.has("from") ? msgNode.get("from").asText() : null;
                                        String textBody = "";
                                        if (msgNode.has("text") && msgNode.get("text").has("body")) {
                                            textBody = msgNode.get("text").get("body").asText();
                                        } else if (msgNode.has("type")) {
                                            textBody = "[" + msgNode.get("type").asText() + " attachment received]";
                                        }

                                        if (fromPhone != null) {
                                            log.info("Received incoming WhatsApp reply from {}: '{}'", fromPhone, textBody);
                                            IncomingReplyRequestDto replyReq = IncomingReplyRequestDto.builder()
                                                    .mobileNumber(fromPhone)
                                                    .messageText(textBody)
                                                    .channel("WHATSAPP")
                                                    .build();
                                            reminderService.handleIncomingReply(replyReq);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error processing WhatsApp webhook event: {}", e.getMessage(), e);
        }

        return ResponseEntity.ok("EVENT_RECEIVED");
    }
}
