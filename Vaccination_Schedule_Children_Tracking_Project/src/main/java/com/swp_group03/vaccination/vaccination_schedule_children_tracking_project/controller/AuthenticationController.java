package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.nimbusds.jose.JOSEException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account.AuthenticationRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account.IntrospectRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.AuthenticationResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.IntrospectResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.ParseException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class AuthenticationController {
    private static final Logger logger = LoggerFactory.getLogger(AuthenticationController.class);

    AuthenticationService authenticationService;

    @PostMapping("/login")
    ApiResponse<AuthenticationResponse> authenticate(@Valid @RequestBody AuthenticationRequest request) {
        try {
            logger.info("Login attempt for username: {}", request.getUsername());
            var isAuthen = authenticationService.authenticate(request);

            return ApiResponse.<AuthenticationResponse>builder()
                    .code(100)
                    .message("Login successful")
                    .result(isAuthen)
                    .build();
        } catch (AppException e) {
            logger.error("Login failed for username: {}, error: {}", request.getUsername(), e.getMessage());
            return ApiResponse.<AuthenticationResponse>builder()
                    .code(e.getErrorCode().getCode())
                    .message(e.getErrorCode().getMessage())
                    .build();
        } catch (Exception e) {
            logger.error("Unexpected error during login for username: {}", request.getUsername(), e);
            return ApiResponse.<AuthenticationResponse>builder()
                    .code(500)
                    .message("An unexpected error occurred")
                    .build();
        }
    }

    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> introspect(@Valid @RequestBody IntrospectRequest request) throws JOSEException, ParseException {
        var isValid = authenticationService.introspect(request);
        return ApiResponse.<IntrospectResponse>builder()
                .code(100)
                .message("Introspect successful")
                .result(isValid)
                .build();
    }
}




//        if(isAuthen) {
//            apiResponse.setCode(100);
//            apiResponse.setMessage("Login successfully: " +isAuthen);
//        } else {
//            throw new AppException(ErrorCode.WRONG_PASSWORD);
//        }