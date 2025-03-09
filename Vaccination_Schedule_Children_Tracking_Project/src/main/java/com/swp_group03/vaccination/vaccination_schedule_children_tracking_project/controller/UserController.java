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
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.EmailService;
import com.nimbusds.jwt.SignedJWT;
import com.nimbusds.jwt.JWTClaimsSet;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@Tag(name = "User", description = "User management APIs")
public class UserController {

    @Autowired
    private UserService userService;
    
    @Autowired
    private UserRepo userRepo;
    
    @Autowired
    private UserMapper userMapper;
    
    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    private EmailService emailService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ApiResponse<Account> registerUser(@Valid @RequestBody UserRequest request) {
        try {
            ApiResponse<Account> apiResponse = new ApiResponse<>();
            apiResponse.setResult(userService.createAccount(request));
            apiResponse.setCode(100);
            apiResponse.setMessage("Registered Successfully");
            return apiResponse;
        } catch (AppException e) {
            ApiResponse<Account> errorResponse = new ApiResponse<>();
            errorResponse.setCode(e.getErrorCode().getCode());
            errorResponse.setMessage(e.getErrorCode().getMessage());
            return errorResponse;
        }
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

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend verification code to email")
    public ApiResponse<String> resendVerificationCode(@Valid @RequestBody Map<String, String> request) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        String email = request.get("email");
        
        if (email == null || email.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_EMAIL);
        }
        
        // Find account by email
        Account account = userRepo.findByEmail(email)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        // Check if email is already verified
        if (account.isEmailVerified()) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }
        
        // Generate new verification code
        String verificationCode = generateVerificationCode();
        account.setVerificationCode(verificationCode);
        account.setVerificationCodeExpiry(LocalDateTime.now().plusHours(24));
        userRepo.save(account);
        
        // Send verification email
        emailService.sendVerificationCode(email, verificationCode);
        
        apiResponse.setCode(100);
        apiResponse.setMessage("Verification code sent successfully");
        apiResponse.setResult("Please check your email for the verification code");
        return apiResponse;
    }
    
    @PostMapping("/request-reset")
    @Operation(summary = "Request password reset code")
    public ApiResponse<String> requestPasswordReset(@Valid @RequestBody Map<String, String> request) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        String email = request.get("email");
        
        if (email == null || email.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_EMAIL);
        }
        
        // Find account by email
        Account account = userRepo.findByEmail(email)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        // Generate new verification code
        String resetCode = generateVerificationCode();
        account.setVerificationCode(resetCode);
        account.setVerificationCodeExpiry(LocalDateTime.now().plusHours(1)); // Shorter expiry for password reset
        userRepo.save(account);
        
        // Send reset email
        emailService.sendPasswordResetCode(email, resetCode);
        
        apiResponse.setCode(100);
        apiResponse.setMessage("Password reset code sent successfully");
        apiResponse.setResult("Please check your email for the reset code");
        return apiResponse;
    }
    
    @PostMapping("/verify-reset-code")
    @Operation(summary = "Verify password reset code without changing password")
    public ApiResponse<String> verifyResetCode(@Valid @RequestBody Map<String, String> request) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        String email = request.get("email");
        String resetCode = request.get("resetCode");
        
        if (email == null || email.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_EMAIL);
        }
        
        if (resetCode == null || resetCode.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_VERIFICATION_CODE);
        }
        
        // Find account by email
        Account account = userRepo.findByEmail(email)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        // Verify code
        if (!resetCode.equals(account.getVerificationCode())) {
            throw new AppException(ErrorCode.INVALID_VERIFICATION_CODE);
        }
        
        // Check if code is expired
        if (account.getVerificationCodeExpiry() == null || 
            account.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VERIFICATION_CODE_EXPIRED);
        }
        
        apiResponse.setCode(100);
        apiResponse.setMessage("Reset code verified successfully");
        apiResponse.setResult("You can now reset your password");
        return apiResponse;
    }
    
    @PostMapping("/reset-password")
    @Operation(summary = "Reset password with verification code")
    public ApiResponse<String> resetPassword(@Valid @RequestBody Map<String, String> request) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        String email = request.get("email");
        String resetCode = request.get("resetCode");
        String newPassword = request.get("newPassword");
        
        if (email == null || email.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_EMAIL);
        }
        
        if (resetCode == null || resetCode.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_VERIFICATION_CODE);
        }
        
        if (newPassword == null || newPassword.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }
        
        if (newPassword.length() < 3 || newPassword.length() > 16) {
            throw new AppException(ErrorCode.PASSWORD_INVALID);
        }
        
        // Find account by email
        Account account = userRepo.findByEmail(email)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        // Verify code
        if (!resetCode.equals(account.getVerificationCode())) {
            throw new AppException(ErrorCode.INVALID_VERIFICATION_CODE);
        }
        
        // Check if code is expired
        if (account.getVerificationCodeExpiry() == null || 
            account.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VERIFICATION_CODE_EXPIRED);
        }
        
        // Update password
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        account.setPassword(passwordEncoder.encode(newPassword));
        
        // Clear verification code
        account.setVerificationCode(null);
        account.setVerificationCodeExpiry(null);
        
        userRepo.save(account);
        
        apiResponse.setCode(100);
        apiResponse.setMessage("Password reset successfully");
        apiResponse.setResult("You can now log in with your new password");
        return apiResponse;
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change password for authenticated user")
    public ApiResponse<String> changePassword(@Valid @RequestBody Map<String, String> request, 
                                              @RequestHeader("Authorization") String token) throws ParseException {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        
        // Extract current and new passwords from request
        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");
        
        if (currentPassword == null || currentPassword.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }
        
        if (newPassword == null || newPassword.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_PASSWORD);
        }
        
        if (newPassword.length() < 3 || newPassword.length() > 16) {
            throw new AppException(ErrorCode.PASSWORD_INVALID);
        }
        
        // Extract username from token
        String username = null;
        try {
            // Remove "Bearer " prefix
            token = token.substring(7);
            // Parse the JWT
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWTClaimsSet claimsSet = signedJWT.getJWTClaimsSet();
            username = claimsSet.getSubject();
        } catch (Exception e) {
            throw new AppException(ErrorCode.INVALID_TOKEN);
        }
        
        // Find account by username
        Account account = userRepo.findByUsername(username)
            .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        // Verify current password
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        if (!passwordEncoder.matches(currentPassword, account.getPassword())) {
            throw new AppException(ErrorCode.INVALID_PASSWORD, "Current password is incorrect");
        }
        
        // Update password
        account.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(account);
        
        apiResponse.setCode(100);
        apiResponse.setMessage("Password changed successfully");
        apiResponse.setResult("Your password has been updated");
        return apiResponse;
    }
    
    private String generateVerificationCode() {
        return String.format("%06d", new Random().nextInt(999999));
    }
}
