package com.srivenkateswarahostel.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter that establishes distributed trace IDs, injects them into MDC and response headers,
 * and logs the full HTTP request lifecycle (entry, execution time, HTTP status, and issues).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    public static final String TRACE_HEADER = "X-Trace-Id";
    public static final String MDC_TRACE_KEY = "traceId";
    public static final String MDC_USER_KEY = "userId";

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        long startTime = System.currentTimeMillis();

        // 1. Resolve or generate Trace ID
        String traceId = request.getHeader(TRACE_HEADER);
        if (!StringUtils.hasText(traceId)) {
            traceId = request.getHeader("X-Request-Id");
        }
        if (!StringUtils.hasText(traceId)) {
            traceId = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        }

        MDC.put(MDC_TRACE_KEY, traceId);
        response.setHeader(TRACE_HEADER, traceId);

        String method = request.getMethod();
        String uri = request.getRequestURI();
        String query = request.getQueryString();
        String fullPath = query != null ? uri + "?" + query : uri;
        String clientIp = getClientIp(request);

        boolean isApiRequest = uri.startsWith("/api");

        if (isApiRequest) {
            log.info("--> [{}] {} (client: {})", method, fullPath, clientIp);
        } else {
            log.debug("--> [{}] {} (client: {})", method, fullPath, clientIp);
        }

        try {
            filterChain.doFilter(request, response);
        } catch (Exception ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("<-- [{}] {} FAILED with exception after {}ms: {}", method, fullPath, duration, ex.getMessage(), ex);
            throw ex;
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            int status = response.getStatus();

            // Capture authenticated user if present after security filters
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName()))
                    ? auth.getName()
                    : "anonymous";

            if (status >= 500) {
                log.error("<-- [{}] {} [{}] (user: {}, duration: {}ms) - Server Error", method, fullPath, status, username, duration);
            } else if (status >= 400) {
                log.warn("<-- [{}] {} [{}] (user: {}, duration: {}ms) - Client Error", method, fullPath, status, username, duration);
            } else if (isApiRequest) {
                log.info("<-- [{}] {} [{}] (user: {}, duration: {}ms)", method, fullPath, status, username, duration);
            } else {
                log.debug("<-- [{}] {} [{}] (took {}ms)", method, fullPath, status, duration);
            }

            MDC.clear();
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(xf)) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
