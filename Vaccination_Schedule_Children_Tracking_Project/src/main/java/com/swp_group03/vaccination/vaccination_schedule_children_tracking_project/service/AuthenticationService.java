package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
//import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.config.JwtConfig;
import com.nimbusds.jwt.SignedJWT;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller.AuthenticationController;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account.AuthenticationRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account.IntrospectRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.AuthenticationResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.IntrospectResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.UserRepo;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
@Slf4j
public class AuthenticationService {
    UserRepo userRepo;

    @NonFinal
    @Value("${jwt.secretKey}")
    protected String SIGNER_KEY;

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

        var account = userRepo.findByUsername(request.getUsername())
            .orElseThrow(() -> new AppException(ErrorCode.USERNAME_NOT_EXIT));

        boolean authenticated = passwordEncoder.matches(request.getPassword(), account.getPassword());

        if(!authenticated) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        var token = generateToken(account);

        return AuthenticationResponse.builder()
                .token(token)
                .authenticated(authenticated)
                .build();
    }

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        var token = request.getToken();

        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(request.getToken());

        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

        var verifed = signedJWT.verify(verifier);

        return IntrospectResponse.builder()
                .valid(verifed && expiryTime.after(new Date()))
                .build();
    }

    private String generateToken(Account account) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);

        Set<String> roles = account.getRoles().stream()
            .map(role -> role.getRole_Name())
            .collect(Collectors.toSet());

        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(account.getUsername())
                .issuer("swp_group3.com")
                .issueTime(new Date())
                .expirationTime(new Date(Instant.now().plus(1, ChronoUnit.HOURS).toEpochMilli()))
                .claim("roles", roles)
                .build();

        Payload payload = new Payload(claimsSet.toJSONObject());

        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            log.error("Cannot create Token", e);
            throw new RuntimeException(e);
        }
    }
}
