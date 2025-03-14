package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.config;
//
//
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.filter.JwtAuthenticationFilter;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.UserRepo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.AuthenticationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${jwt.secretKey}")
    private String jwtSecretKey;

    private final AuthenticationService authenticationService;
    private final UserRepo userRepo;

    public SecurityConfig(AuthenticationService authenticationService, UserRepo userRepo) {
        this.authenticationService = authenticationService;
        this.userRepo = userRepo;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/api/users/register").permitAll()
                .requestMatchers("/api/users/verify-email").permitAll()
                .requestMatchers("/api/users/resend-verification").permitAll()
                .requestMatchers("/api/users/request-reset").permitAll()
                .requestMatchers("/api/users/verify-reset-code").permitAll()
                .requestMatchers("/api/users/reset-password").permitAll()
                .requestMatchers("/api/vaccines/images/**").permitAll()
                .requestMatchers("/api/combo-categories/**").permitAll()
                .requestMatchers("/api/vaccine-combos/**").permitAll()
                .requestMatchers("/api/children/**").authenticated()
                .requestMatchers("/swagger-ui/**").permitAll()
                .requestMatchers("/swagger-ui.html").permitAll()
                .requestMatchers("/v3/api-docs/**").permitAll()
                .requestMatchers("/api-docs/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(Arrays.asList("Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter(authenticationService, userRepo);
    }
}

