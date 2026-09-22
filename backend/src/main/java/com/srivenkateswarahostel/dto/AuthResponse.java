package com.srivenkateswarahostel.dto;

import com.srivenkateswarahostel.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    @Builder.Default
    private String tokenType = "Bearer";
    private String userId;
    private String username;
    private String fullName;
    private String email;
    private Role role;
    private long expiresInMs;
}
