package com.srivenkateswarahostel.controller;

import com.srivenkateswarahostel.dto.ApiResponse;
import com.srivenkateswarahostel.model.HostelSetting;
import com.srivenkateswarahostel.service.DataInitializerService;
import com.srivenkateswarahostel.service.SettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Tag(name = "Settings", description = "Hostel Configuration & Demo Data Reset APIs")
public class SettingController {

    private final SettingService settingService;
    private final DataInitializerService dataInitializerService;

    @GetMapping
    @Operation(summary = "Get hostel configuration settings")
    public ResponseEntity<ApiResponse<HostelSetting>> getSettings() {
        HostelSetting setting = settingService.getSettings();
        return ResponseEntity.ok(ApiResponse.success(setting));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update hostel configuration settings")
    public ResponseEntity<ApiResponse<HostelSetting>> updateSettings(@RequestBody HostelSetting setting) {
        HostelSetting updated = settingService.updateSettings(setting);
        return ResponseEntity.ok(ApiResponse.success(updated, "Hostel settings updated successfully"));
    }

    @PostMapping("/reset-demo")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reset database to initial demo state with 70 beds, rooms, and sample students")
    public ResponseEntity<ApiResponse<Void>> resetDemoData() {
        dataInitializerService.seedDemoData();
        return ResponseEntity.ok(ApiResponse.successMessage("Demo data reseeded successfully (70 beds, rooms, students, payments)"));
    }

    @PostMapping("/clear-demo")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Clear all dummy data (students, payments, allocations) and prepare for real data with all 70 beds available")
    public ResponseEntity<ApiResponse<Void>> clearDemoData() {
        dataInitializerService.clearDemoData();
        return ResponseEntity.ok(ApiResponse.successMessage("Dummy data cleared successfully. All 70 beds across 16 rooms are now AVAILABLE for real student admissions."));
    }
}
