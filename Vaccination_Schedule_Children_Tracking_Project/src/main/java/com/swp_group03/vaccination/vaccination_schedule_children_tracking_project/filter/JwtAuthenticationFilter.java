package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.filter;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account.IntrospectRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.UserRepo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.AuthenticationService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.text.ParseException;
import java.util.List;
import java.util.stream.Collectors;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final AuthenticationService authenticationService;
    private final UserRepo userRepo;

    public JwtAuthenticationFilter(AuthenticationService authenticationService, UserRepo userRepo) {
        this.authenticationService = authenticationService;
        this.userRepo = userRepo;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                
                // Validate token
                var introspectRequest = IntrospectRequest.builder().token(token).build();
                var isValid = authenticationService.introspect(introspectRequest);
                
                if (isValid.isValid()) {
                    // Parse token to get username
                    SignedJWT signedJWT = SignedJWT.parse(token);
                    String username = signedJWT.getJWTClaimsSet().getSubject();
                    
                    // Get user and their roles
                    Account account = userRepo.findByUsername(username).orElse(null);
                    if (account != null) {
                        List<SimpleGrantedAuthority> authorities = account.getRoles().stream()
                            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRole_Name()))
                            .collect(Collectors.toList());
                        
                        // Create authentication token with authorities
                        UsernamePasswordAuthenticationToken authentication = 
                            new UsernamePasswordAuthenticationToken(username, null, authorities);
                        
                        // Set authentication in context
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            }
        } catch (JOSEException | ParseException e) {
            logger.error("Could not validate JWT token", e);
        }
        
        filterChain.doFilter(request, response);
    }
} 