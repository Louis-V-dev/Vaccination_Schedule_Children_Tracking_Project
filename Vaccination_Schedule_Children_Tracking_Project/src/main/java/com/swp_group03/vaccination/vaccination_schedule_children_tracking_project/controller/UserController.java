package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account.UserRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account.UserUpdate;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account.EmailVerificationRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.AccountResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.UserService;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.UserRepo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.mapper.UserMapper;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.AuthenticationService;
import com.nimbusds.jwt.SignedJWT;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
@Tag(name = "User", description = "User management")
public class UserController {

    @Autowired
    private UserService userService;
    
    @Autowired
    private UserRepo userRepo;
    
    @Autowired
    private UserMapper userMapper;
    
    @Autowired
    private AuthenticationService authenticationService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ApiResponse<Account> registerUser(@Valid @RequestBody UserRequest request) {
        ApiResponse<Account> apiResponse = new ApiResponse<>();
        apiResponse.setResult(userService.createAccount(request));
        apiResponse.setCode(100);
        apiResponse.setMessage("Registered Successfully");
        return apiResponse;
    }

    @PatchMapping("/{account_id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Account> updateUser(@PathVariable String account_id, @Validated @RequestBody UserUpdate request) {
        return ResponseEntity.ok(userService.updateAccount(request, account_id));
    }

    @GetMapping("/{account_id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AccountResponse> getUserProfile(@PathVariable String account_id) {
        Account account = userService.findById(account_id);
        AccountResponse response = userService.mapToAccountResponse(account);
        System.out.println("Account data: " + account.toString());
        System.out.println("Response data: " + response.toString());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/current")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AccountResponse> getCurrentUserProfile(@RequestHeader("Authorization") String token) throws ParseException {
        SignedJWT signedJWT = SignedJWT.parse(token.substring(7));
        String username = signedJWT.getJWTClaimsSet().getSubject();
        Account account = userRepo.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        AccountResponse response = userMapper.toAccountResponse(account);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ApiResponse<List<AccountResponse>> getAllAccount() {
        ApiResponse<List<AccountResponse>> apiResponse = new ApiResponse<>();
        List<AccountResponse> accounts = userService.getAllAccount();
        System.out.println("All accounts: " + accounts.toString());
        apiResponse.setResult(accounts);
        
        if (apiResponse.getResult().isEmpty()) {
            apiResponse.setCode(98);
            apiResponse.setMessage("No Account found");
            apiResponse.setResult(null);
            return apiResponse;
        }

        apiResponse.setCode(101);
        apiResponse.setMessage("All Account retrieved");
        return apiResponse;
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email with verification code")
    public ApiResponse<String> verifyEmail(@Valid @RequestBody EmailVerificationRequest request) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        userService.verifyEmail(request.getEmail(), request.getVerificationCode());
        apiResponse.setCode(100);
        apiResponse.setMessage("Email verified successfully");
        apiResponse.setResult("Email verification completed");
        return apiResponse;
    }
}
