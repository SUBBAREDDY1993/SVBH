package com.srivenkateswarahostel.service;

import com.srivenkateswarahostel.dto.AuthResponse;
import com.srivenkateswarahostel.dto.ChangePasswordRequest;
import com.srivenkateswarahostel.dto.LoginRequest;
import com.srivenkateswarahostel.dto.UserDto;
import com.srivenkateswarahostel.exception.BadRequestException;
import com.srivenkateswarahostel.exception.ResourceNotFoundException;
import com.srivenkateswarahostel.model.User;
import com.srivenkateswarahostel.repository.UserRepository;
import com.srivenkateswarahostel.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public AuthResponse login(LoginRequest request) {
        log.info("Authenticating credentials for username '{}'", request.getUsername());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        String token = jwtTokenProvider.generateToken(authentication);
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> {
                    log.error("Authenticated user not found in database: {}", request.getUsername());
                    return new ResourceNotFoundException("User not found: " + request.getUsername());
                });

        auditService.log("LOGIN", "USER", user.getId(), "User logged in: " + user.getUsername());
        log.info("User '{}' authenticated successfully (ID: {}, Role: {})", user.getUsername(), user.getId(), user.getRole());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .expiresInMs(jwtTokenProvider.getExpirationMs())
                .build();
    }

    public void changePassword(String username, ChangePasswordRequest request) {
        log.info("Processing password change request for user '{}'", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            log.warn("Password change failed for '{}': current password did not match", username);
            throw new BadRequestException("Current password does not match");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditService.log("CHANGE_PASSWORD", "USER", user.getId(), "Password updated for user: " + username);
        log.info("Password successfully changed for user '{}'", username);
    }

    public UserDto getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
