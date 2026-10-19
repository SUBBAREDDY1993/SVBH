package com.srivenkateswarahostel.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final RequestLoggingFilter requestLoggingFilter;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;

    @Value("${app.cors.allowed-origins:http://localhost:5173,https://svbh-10.onrender.com}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setContentType("application/json;charset=UTF-8");
                            response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                            response.getWriter().write("{\"success\":false,\"message\":\"Unauthorized: Please log in to access this resource\"}");
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setContentType("application/json;charset=UTF-8");
                            response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_FORBIDDEN);
                            response.getWriter().write("{\"success\":false,\"message\":\"Forbidden: Administrator privileges required\"}");
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.FORWARD, jakarta.servlet.DispatcherType.ERROR).permitAll()
                        // Ensure preflight CORS OPTIONS requests are always allowed
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Public endpoints
                        .requestMatchers(
                                "/",
                                "/api",
                                "/api/",
                                "/api/health",
                                "/health",
                                "/error",
                                "/favicon.ico",
                                "/api/auth/**",
                                "/api/reminders/webhook/**",
                                "/api/reports/export/**",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/actuator/**"
                        ).permitAll()
                        // Admin only endpoints
                        .requestMatchers(HttpMethod.DELETE, "/api/rooms/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/students/**").hasRole("ADMIN")
                        .requestMatchers("/api/settings/**").hasRole("ADMIN")
                        .requestMatchers("/api/users/**").hasRole("ADMIN")
                        // All other API requests require authentication
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(requestLoggingFilter, org.springframework.security.web.context.SecurityContextHolderFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        List<String> originPatterns = new ArrayList<>();
        if (allowedOrigins != null && !allowedOrigins.trim().isEmpty()) {
            originPatterns.addAll(Arrays.stream(allowedOrigins.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList()));
        }

        // Loopback and Localhost on any port (5173, 3000, 4173, etc.)
        originPatterns.add("http://localhost:[*]");
        originPatterns.add("http://127.0.0.1:[*]");
        originPatterns.add("http://[::1]:[*]");
        originPatterns.add("http://localhost");
        originPatterns.add("http://127.0.0.1");

        // Wi-Fi and Local Network IPs on any port for mobile and tablet testing
        originPatterns.add("http://192.168.*.*:[*]");
        originPatterns.add("http://192.168.*.*");
        originPatterns.add("http://10.*.*.*:[*]");
        originPatterns.add("http://10.*.*.*");
        originPatterns.add("http://172.1[6-9].*.*:[*]");
        originPatterns.add("http://172.2[0-9].*.*:[*]");
        originPatterns.add("http://172.3[0-1].*.*:[*]");
        originPatterns.add("http://*.local:[*]");
        originPatterns.add("http://*.local");

        // Render and Cloud Production
        originPatterns.add("https://*.onrender.com");
        originPatterns.add("https://svbh-10.onrender.com");
        originPatterns.add("https://svbh-backend.onrender.com");

        // Universal wildcard fallback so mobile, dev servers, and proxies are never rejected by CORS
        originPatterns.add("*");

        configuration.setAllowedOriginPatterns(originPatterns);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "X-Trace-Id", "X-Request-Id", "Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
