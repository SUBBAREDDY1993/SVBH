package com.srivenkateswarahostel.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class SmsService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.sms.provider:FAST2SMS}")
    private String smsProvider;

    @Value("${app.sms.api-key:}")
    private String apiKey;

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty() && !apiKey.equalsIgnoreCase("YOUR_SMS_API_KEY");
    }

    /**
     * Dispatches real SMS to a 10-digit Indian mobile number if an SMS provider/API key is configured.
     * Returns true if sent successfully, or false if not configured or failed.
     */
    public boolean sendSms(String mobileNumber, String message) {
        if (!isConfigured()) {
            log.info("SMS API Key (app.sms.api-key) not configured. Prepared for WhatsApp Web/App dispatch for mobile: {}", mobileNumber);
            return false;
        }

        if (mobileNumber == null || mobileNumber.trim().isEmpty()) {
            return false;
        }

        String cleanPhone = mobileNumber.replaceAll("[^0-9]", "");
        if (cleanPhone.length() == 12 && cleanPhone.startsWith("91")) {
            cleanPhone = cleanPhone.substring(2);
        }
        if (cleanPhone.length() != 10) {
            log.warn("Invalid 10-digit mobile number for SMS dispatch: {}", mobileNumber);
            return false;
        }

        try {
            if ("FAST2SMS".equalsIgnoreCase(smsProvider)) {
                String url = "https://www.fast2sms.com/dev/bulkV2";
                HttpHeaders headers = new HttpHeaders();
                headers.set("authorization", apiKey.trim());
                headers.setContentType(MediaType.APPLICATION_JSON);

                Map<String, Object> body = new HashMap<>();
                body.put("route", "q");
                body.put("message", message);
                body.put("language", "english");
                body.put("flash", 0);
                body.put("numbers", cleanPhone);

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
                ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
                log.info("Fast2SMS dispatch response for {}: status={}", cleanPhone, response.getStatusCode());
                return response.getStatusCode().is2xxSuccessful();
            }
            return false;
        } catch (Exception e) {
            log.error("Failed to dispatch live SMS to {}: {}", cleanPhone, e.getMessage());
            return false;
        }
    }
}
