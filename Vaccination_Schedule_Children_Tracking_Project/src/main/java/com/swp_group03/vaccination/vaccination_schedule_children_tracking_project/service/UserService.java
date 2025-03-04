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

import java.util.List;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private UserMapper userMapper;

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
        
        return userRepo.save(account);
    }

    public Account updateAccount(UserUpdate request, String accountId) {
        if (request == null || accountId == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        Account account = userRepo.findById(accountId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        userMapper.toUpdateUser(request, account);
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
}
