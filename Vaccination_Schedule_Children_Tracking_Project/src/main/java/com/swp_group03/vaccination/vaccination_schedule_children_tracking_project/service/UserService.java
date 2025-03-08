package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.mapper.UserMapper;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account.UserRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account.UserUpdate;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.AccountResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private EmailService emailService;

    public Account findById(String accountId) {
        return userRepo.findById(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    public AccountResponse mapToAccountResponse(Account account) {
        return userMapper.toAccountResponse(account);
    }

    public Account createAccount(UserRequest request) {
        if (request == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        if (userRepo.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_ALREADY_EXIST);
        }

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        Account account = userMapper.toCreateUser(request);
        
        if (account == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        account.setPassword(passwordEncoder.encode(request.getPassword()));
        account.setStatus(true);
        account.setDateOfBirth(request.getDateOfBirth());
        
        // Generate and set verification code
        String verificationCode = generateVerificationCode();
        account.setVerificationCode(verificationCode);
        account.setVerificationCodeExpiry(LocalDateTime.now().plusMinutes(5));
        account.setEmailVerified(false);

        Account savedAccount = userRepo.save(account);
        
        // Send verification email
        emailService.sendVerificationCode(account.getEmail(), verificationCode);
        
        return savedAccount;
    }

    public Account updateAccount(UserUpdate request, String accountId) {
        if (request == null || accountId == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Account account = userRepo.findById(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        userMapper.toUpdateUser(request, account);
        
        if (request.getDateOfBirth() != null) {
            account.setDateOfBirth(request.getDateOfBirth());
        }
        
        return userRepo.save(account);
    }

    public List<AccountResponse> getAllAccount() {
        List<Account> accounts = userRepo.findAll();
        
        if (accounts == null || accounts.isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_USER);
        }

        List<AccountResponse> responses = userMapper.toAllAccountResponse(accounts);
        
        if (responses == null || responses.isEmpty()) {
            throw new AppException(ErrorCode.MAPPING_ERROR);
        }

        return responses;
    }

    public void verifyEmail(String email, String code) {
        Account account = userRepo.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (account.isEmailVerified()) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        if (account.getVerificationCodeExpiry().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.VERIFICATION_CODE_EXPIRED);
        }

        if (!account.getVerificationCode().equals(code)) {
            throw new AppException(ErrorCode.INVALID_VERIFICATION_CODE);
        }

        account.setEmailVerified(true);
        account.setVerificationCode(null);
        account.setVerificationCodeExpiry(null);
        userRepo.save(account);
    }

    private String generateVerificationCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // generates a number between 100000 and 999999
        return String.valueOf(code);
    }
}
