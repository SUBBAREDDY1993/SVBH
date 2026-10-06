package com.srivenkateswarahostel.controller;

import com.srivenkateswarahostel.dto.ApiResponse;
import com.srivenkateswarahostel.dto.AuthResponse;
import com.srivenkateswarahostel.dto.ChangePasswordRequest;
import com.srivenkateswarahostel.dto.LoginRequest;
import com.srivenkateswarahostel.dto.UserDto;
import com.srivenkateswarahostel.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Authentication & User Management APIs")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "User login with username and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("REST: Attempting login for user '{}'", request.getUsername());
        AuthResponse response = authService.login(request);
        log.info("REST: Login successful for user '{}' with role '{}'", response.getUsername(), response.getRole());
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @GetMapping("/me")
    @Operation(summary = "Get details of currently authenticated user")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        log.debug("REST: Fetching current profile for user '{}'", userDetails.getUsername());
        UserDto user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password for logged-in user")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        log.info("REST: Changing password for user '{}'", userDetails.getUsername());
        authService.changePassword(userDetails.getUsername(), request);
        log.info("REST: Password changed successfully for user '{}'", userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.successMessage("Password changed successfully"));
    }
}
