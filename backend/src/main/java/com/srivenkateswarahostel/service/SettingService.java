package com.srivenkateswarahostel.service;

import com.srivenkateswarahostel.model.HostelSetting;
import com.srivenkateswarahostel.repository.HostelSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SettingService {

    private final HostelSettingRepository hostelSettingRepository;
    private final AuditService auditService;

    public HostelSetting getSettings() {
        return hostelSettingRepository.findAll().stream().findFirst()
                .orElseGet(() -> hostelSettingRepository.save(HostelSetting.builder()
                        .hostelName("Sri Venkateswara Boys Hostel")
                        .address("Opp. SV University Main Gate, Tirupati, Andhra Pradesh - 517502")
                        .contactNumber("+91 98765 43210")
                        .email("svboyshostel.tirupati@gmail.com")
                        .totalBeds(70)
                        .defaultMonthlyRent(5000.0)
                        .defaultSecurityDeposit(5000.0)
                        .paymentGracePeriodDays(5)
                        .currency("INR")
                        .demoDataLoaded(true)
                        .build()));
    }

    public HostelSetting updateSettings(HostelSetting newSettings) {
        HostelSetting current = getSettings();
        current.setHostelName(newSettings.getHostelName());
        current.setAddress(newSettings.getAddress());
        current.setContactNumber(newSettings.getContactNumber());
        current.setEmail(newSettings.getEmail());
        current.setTotalBeds(newSettings.getTotalBeds());
        current.setDefaultMonthlyRent(newSettings.getDefaultMonthlyRent());
        current.setDefaultSecurityDeposit(newSettings.getDefaultSecurityDeposit());
        current.setPaymentGracePeriodDays(newSettings.getPaymentGracePeriodDays());
        current.setCurrency(newSettings.getCurrency());

        HostelSetting saved = hostelSettingRepository.save(current);
        auditService.log("UPDATE", "SETTINGS", saved.getId(), "Updated hostel general settings");
        return saved;
    }
}
