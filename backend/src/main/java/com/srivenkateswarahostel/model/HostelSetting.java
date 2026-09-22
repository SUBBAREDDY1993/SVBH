package com.srivenkateswarahostel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "hostel_settings")
public class HostelSetting {

    @Id
    private String id;

    @Builder.Default
    private String hostelName = "Sri Venkateswara Boys Hostel";

    @Builder.Default
    private String address = "Opp. SV University Main Gate, Tirupati, Andhra Pradesh - 517502";

    @Builder.Default
    private String contactNumber = "+91 98765 43210";

    @Builder.Default
    private String email = "svboyshostel.tirupati@gmail.com";

    @Builder.Default
    private int totalBeds = 70;

    @Builder.Default
    private Double defaultMonthlyRent = 5000.0;

    @Builder.Default
    private Double defaultSecurityDeposit = 5000.0;

    @Builder.Default
    private int paymentGracePeriodDays = 5;

    @Builder.Default
    private String currency = "INR";

    @Builder.Default
    private boolean demoDataLoaded = false;
}
