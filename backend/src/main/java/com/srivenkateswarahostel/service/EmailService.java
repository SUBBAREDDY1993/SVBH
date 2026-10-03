package com.srivenkateswarahostel.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:svbhostel2026@gmail.com}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    /**
     * Send email with HTML and plain text fallback.
     * If SMTP is not configured or fails, logs to console and returns false gracefully.
     */
    public boolean sendEmail(String toEmail, String subject, String htmlBody, String plainTextBody) {
        log.info("Preparing fee alert email for: {}", toEmail);

        if (mailSender == null) {
            log.warn("JavaMailSender is not initialized. Email alert logged only:\n[TO: {}]\n[SUBJECT: {}]\n{}",
                    toEmail, subject, plainTextBody);
            return false;
        }

        if (mailPassword == null || mailPassword.trim().isEmpty()) {
            log.info("SMTP password (spring.mail.password) not provided. Email logged to database only for: {}. " +
                    "To enable direct delivery to {} inbox, set Gmail App Password in application.properties or SPRING_MAIL_PASSWORD environment variable.",
                    toEmail, toEmail);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Sri Venkateswara Boys Hostel");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(plainTextBody, htmlBody != null ? htmlBody : plainTextBody);

            mailSender.send(message);
            log.info("Successfully sent email alert to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.warn("Could not dispatch live SMTP email to {} ({}). Email logged to system:\n[SUBJECT: {}]\n{}",
                    toEmail, e.getMessage(), subject, plainTextBody);
            return false;
        }
    }
}
