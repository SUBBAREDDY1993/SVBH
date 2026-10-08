package com.srivenkateswarahostel.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.srivenkateswarahostel.dto.WhatsAppSendResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.regex.Pattern;

@Service
@Slf4j
public class WhatsAppService {

    @Value("${app.whatsapp.enabled:true}")
    private boolean enabled;

    @Value("${app.whatsapp.sandbox-mode:false}")
    private boolean sandboxMode;

    @Value("${app.whatsapp.access-token:}")
    private String accessToken;

    @Value("${app.whatsapp.phone-number-id:}")
    private String phoneNumberId;

    @Value("${app.whatsapp.api-version:v21.0}")
    private String apiVersion;

    @Value("${app.whatsapp.template-name:hostel_fee_reminder}")
    private String templateName;

    @Value("${app.whatsapp.template-language:en}")
    private String templateLanguage;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final Pattern INDIAN_PHONE_PATTERN = Pattern.compile("^91[6-9]\\d{9}$");

    public WhatsAppService(RestTemplateBuilder builder, ObjectMapper objectMapper) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(6))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = objectMapper;
    }

    /**
     * Check if live Meta WhatsApp Cloud API credentials are configured.
     * Requires enabled=true, sandboxMode=false, a real access token, and a real phone number ID.
     */
    public boolean isConfigured() {
        return enabled
                && !sandboxMode
                && accessToken != null && !accessToken.isBlank() && !accessToken.startsWith("sandbox_")
                && phoneNumberId != null && !phoneNumberId.isBlank() && !"105948372619485".equals(phoneNumberId);
    }


    /**
     * Normalize Indian phone number to international E.164 without plus sign (e.g., 919876543210).
     */
    public String normalizePhoneNumber(String rawNumber) {
        if (rawNumber == null || rawNumber.isBlank()) {
            return null;
        }

        // Remove all non-digit characters
        String digits = rawNumber.replaceAll("[^0-9]", "");

        // 10 digits starting with 6, 7, 8, 9 -> prepend 91
        if (digits.length() == 10 && digits.matches("^[6-9]\\d{9}$")) {
            return "91" + digits;
        }

        // 11 digits starting with 0 -> replace 0 with 91
        if (digits.length() == 11 && digits.startsWith("0")) {
            digits = digits.substring(1);
            if (digits.matches("^[6-9]\\d{9}$")) {
                return "91" + digits;
            }
        }

        // 12 digits starting with 91
        if (digits.length() == 12 && digits.startsWith("91") && digits.matches("^91[6-9]\\d{9}$")) {
            return digits;
        }

        return digits;
    }

    /**
     * Validate that phone number is a valid mobile number for WhatsApp dispatch.
     */
    public boolean isValidPhoneNumber(String normalizedNumber) {
        return normalizedNumber != null && INDIAN_PHONE_PATTERN.matcher(normalizedNumber).matches();
    }

    /**
     * Mask phone number for secure logging (e.g. 919876543210 -> 91******3210).
     */
    public String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) {
            return "***";
        }
        return phone.substring(0, 2) + "******" + phone.substring(phone.length() - 4);
    }

    /**
     * Send approved WhatsApp Fee Reminder Template to student.
     * Template: hostel_fee_reminder
     * Parameters: {{1}} = studentName, {{2}} = feeAmount, {{3}} = dueDate
     */
    public WhatsAppSendResult sendFeeReminderTemplate(String rawPhone, String studentName, double amount, String dueDateStr) {
        String normalizedPhone = normalizePhoneNumber(rawPhone);
        if (!isValidPhoneNumber(normalizedPhone)) {
            String err = String.format("Invalid Indian mobile number '%s'. Must be 10 digits (e.g. 9876543210).", rawPhone);
            log.warn("WhatsApp validation failed: {}", err);
            return WhatsAppSendResult.failure(err, normalizedPhone, null, 400);
        }

        if (!isConfigured()) {
            String err = "Meta WhatsApp Cloud API is not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment or application.properties.";
            log.warn("WhatsApp dispatch skipped for {}: {}", maskPhone(normalizedPhone), err);
            return WhatsAppSendResult.failure(err, normalizedPhone, null, 503);
        }

        String url = String.format("https://graph.facebook.com/%s/%s/messages", apiVersion, phoneNumberId);


        try {
            // Build Meta JSON Payload
            ObjectNode root = objectMapper.createObjectNode();
            root.put("messaging_product", "whatsapp");
            root.put("recipient_type", "individual");
            root.put("to", normalizedPhone);
            root.put("type", "template");

            ObjectNode templateNode = root.putObject("template");
            templateNode.put("name", templateName);
            templateNode.putObject("language").put("code", templateLanguage != null ? templateLanguage : "en");

            ArrayNode components = templateNode.putArray("components");
            ObjectNode bodyComponent = components.addObject();
            bodyComponent.put("type", "body");
            ArrayNode parameters = bodyComponent.putArray("parameters");

            // Param 1: Student Name
            parameters.addObject().put("type", "text").put("text", studentName != null ? studentName : "Resident");
            // Param 2: Fee Amount formatted (e.g. 5,000)
            parameters.addObject().put("type", "text").put("text", String.format("%,.0f", amount));
            // Param 3: Due Date formatted (e.g. 05-Oct-2026)
            parameters.addObject().put("type", "text").put("text", dueDateStr != null ? dueDateStr : "Due Date");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken.trim());

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(root), headers);

            log.info("Dispatching WhatsApp fee reminder template '{}' to recipient {}", templateName, maskPhone(normalizedPhone));
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            return parseMetaSuccessResponse(response, normalizedPhone);

        } catch (HttpStatusCodeException ex) {
            String errorMsg = parseMetaErrorResponse(ex);
            log.error("Meta WhatsApp Cloud API HTTP {} error for recipient {}: {}",
                    ex.getStatusCode().value(), maskPhone(normalizedPhone), errorMsg);
            return WhatsAppSendResult.failure(errorMsg, normalizedPhone, ex.getResponseBodyAsString(), ex.getStatusCode().value());
        } catch (ResourceAccessException ex) {
            String errorMsg = "Network timeout / connection error connecting to Meta WhatsApp Cloud API: " + ex.getMessage();
            log.error("WhatsApp network error for recipient {}: {}", maskPhone(normalizedPhone), errorMsg);
            return WhatsAppSendResult.failure(errorMsg, normalizedPhone, null, 504);
        } catch (Exception ex) {
            String errorMsg = "Unexpected error dispatching WhatsApp message: " + ex.getMessage();
            log.error("WhatsApp error for recipient {}: {}", maskPhone(normalizedPhone), errorMsg, ex);
            return WhatsAppSendResult.failure(errorMsg, normalizedPhone, null, 500);
        }
    }

    /**
     * Send direct text message (used for automatic replies to incoming resident messages).
     */
    public WhatsAppSendResult sendTextMessage(String rawPhone, String messageText) {
        String normalizedPhone = normalizePhoneNumber(rawPhone);
        if (!isValidPhoneNumber(normalizedPhone)) {
            String err = "Invalid mobile number format for WhatsApp text dispatch: " + rawPhone;
            return WhatsAppSendResult.failure(err, normalizedPhone, null, 400);
        }

        if (!isConfigured()) {
            return WhatsAppSendResult.failure("WhatsApp credentials not configured", normalizedPhone, null, 503);
        }

        String url = String.format("https://graph.facebook.com/%s/%s/messages", apiVersion, phoneNumberId);


        try {
            ObjectNode root = objectMapper.createObjectNode();
            root.put("messaging_product", "whatsapp");
            root.put("recipient_type", "individual");
            root.put("to", normalizedPhone);
            root.put("type", "text");
            root.putObject("text")
                    .put("preview_url", false)
                    .put("body", messageText);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken.trim());

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(root), headers);

            log.info("Sending WhatsApp text message to {}", maskPhone(normalizedPhone));
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            return parseMetaSuccessResponse(response, normalizedPhone);

        } catch (HttpStatusCodeException ex) {
            String errorMsg = parseMetaErrorResponse(ex);
            log.error("Meta WhatsApp Cloud API HTTP {} error for text message to {}: {}",
                    ex.getStatusCode().value(), maskPhone(normalizedPhone), errorMsg);
            return WhatsAppSendResult.failure(errorMsg, normalizedPhone, ex.getResponseBodyAsString(), ex.getStatusCode().value());
        } catch (Exception ex) {
            log.error("Error sending WhatsApp text message to {}: {}", maskPhone(normalizedPhone), ex.getMessage());
            return WhatsAppSendResult.failure(ex.getMessage(), normalizedPhone, null, 500);
        }
    }

    private WhatsAppSendResult parseMetaSuccessResponse(ResponseEntity<String> response, String phone) {
        String body = response.getBody();
        String messageId = null;

        try {
            if (body != null) {
                JsonNode root = objectMapper.readTree(body);
                JsonNode messagesNode = root.get("messages");
                if (messagesNode != null && messagesNode.isArray() && !messagesNode.isEmpty()) {
                    JsonNode firstMsg = messagesNode.get(0);
                    if (firstMsg.has("id")) {
                        messageId = firstMsg.get("id").asText();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not parse WhatsApp response JSON for message ID: {}", e.getMessage());
        }

        if (messageId == null) {
            messageId = "wamid.generated." + System.currentTimeMillis();
        }

        log.info("WhatsApp message successfully accepted by Meta! Message ID: {}, recipient: {}", messageId, maskPhone(phone));
        return WhatsAppSendResult.success(messageId, phone, body);
    }

    private String parseMetaErrorResponse(HttpStatusCodeException ex) {
        try {
            String body = ex.getResponseBodyAsString();
            if (body != null && !body.isBlank()) {
                JsonNode root = objectMapper.readTree(body);
                if (root.has("error")) {
                    JsonNode err = root.get("error");
                    String msg = err.has("message") ? err.get("message").asText() : ex.getMessage();
                    int code = err.has("code") ? err.get("code").asInt() : ex.getStatusCode().value();
                    String details = err.has("error_data") && err.get("error_data").has("details")
                            ? " - Details: " + err.get("error_data").get("details").asText()
                            : "";
                    return String.format("Meta API Error (%d): %s%s", code, msg, details);
                }
            }
        } catch (Exception ignored) {}
        return String.format("Meta API HTTP %d %s: %s", ex.getStatusCode().value(), ex.getStatusText(), ex.getResponseBodyAsString());
    }
}
