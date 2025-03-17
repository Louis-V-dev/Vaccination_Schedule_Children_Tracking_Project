package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.ShiftChangeRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.WorkSchedule;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.mapper.ScheduleMapper;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.schedule.ShiftChangeRequestDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.ShiftChangeRequestResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.ShiftChangeRequestRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.UserRepo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.WorkScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ShiftChangeRequestService {

    @Autowired
    private ShiftChangeRequestRepository shiftChangeRequestRepository;

    @Autowired
    private WorkScheduleRepository workScheduleRepository;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private WorkScheduleService workScheduleService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ScheduleMapper scheduleMapper;

    public ShiftChangeRequestResponse createRequest(Account requester, ShiftChangeRequestDTO dto) {
        WorkSchedule originalSchedule = workScheduleRepository.findById(Long.parseLong(dto.getOriginalScheduleId()))
            .orElseThrow(() -> new AppException(ErrorCode.SCHEDULE_NOT_FOUND));
            
        WorkSchedule targetSchedule = workScheduleRepository.findById(Long.parseLong(dto.getTargetScheduleId()))
            .orElseThrow(() -> new AppException(ErrorCode.SCHEDULE_NOT_FOUND));

        // Validate requester owns the original schedule
        if (!originalSchedule.getEmployee().getAccountId().equals(requester.getAccountId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_REQUEST);
        }

        // Validate 7-day rule
        if (!workScheduleService.canRequestShiftChange(originalSchedule)) {
            throw new AppException(ErrorCode.REQUEST_TOO_LATE);
        }

        // Validate roles match
        if (!hasMatchingRole(requester, targetSchedule.getEmployee())) {
            throw new AppException(ErrorCode.ROLE_MISMATCH);
        }

        ShiftChangeRequest request = new ShiftChangeRequest();
        request.setRequester(requester);
        request.setTarget(targetSchedule.getEmployee());
        request.setOriginalSchedule(originalSchedule);
        request.setTargetSchedule(targetSchedule);
        request.setReason(dto.getReason());
        request.setRequestTime(LocalDateTime.now());

        request = shiftChangeRequestRepository.save(request);
        
        // Send email notification to target employee
        emailService.sendShiftChangeRequest(request);

        return scheduleMapper.toShiftChangeRequestResponse(request);
    }

    public ShiftChangeRequestResponse approveByTarget(String requestId, Account target, String message) {
        ShiftChangeRequest request = getAndValidateRequest(requestId, target, true);
        
        request.setTargetStatus("APPROVED");
        request.setTargetResponseMessage(message);
        request.setTargetResponseTime(LocalDateTime.now());
        
        updateOverallStatus(request);
        request = shiftChangeRequestRepository.save(request);
        
        // Send email notifications
        emailService.sendShiftChangeRequestUpdate(request, "APPROVED");

        return scheduleMapper.toShiftChangeRequestResponse(request);
    }

    public ShiftChangeRequestResponse approveByAdmin(String requestId, String message) {
        ShiftChangeRequest request = shiftChangeRequestRepository.findById(requestId)
            .orElseThrow(() -> new AppException(ErrorCode.REQUEST_NOT_FOUND));
            
        if (!"APPROVED".equals(request.getTargetStatus())) {
            throw new AppException(ErrorCode.TARGET_NOT_APPROVED);
        }

        request.setAdminStatus("APPROVED");
        request.setAdminResponseMessage(message);
        request.setAdminResponseTime(LocalDateTime.now());
        
        updateOverallStatus(request);
        
        if ("APPROVED".equals(request.getStatus())) {
            swapSchedules(request);
        }
        
        request = shiftChangeRequestRepository.save(request);
        
        // Send email notifications
        emailService.sendShiftChangeRequestUpdate(request, "APPROVED");

        return scheduleMapper.toShiftChangeRequestResponse(request);
    }

    public ShiftChangeRequestResponse rejectByTarget(String requestId, Account target, String message) {
        ShiftChangeRequest request = getAndValidateRequest(requestId, target, true);
        
        request.setTargetStatus("REJECTED");
        request.setTargetResponseMessage(message);
        request.setTargetResponseTime(LocalDateTime.now());
        
        updateOverallStatus(request);
        request = shiftChangeRequestRepository.save(request);
        
        // Send email notifications
        emailService.sendShiftChangeRequestUpdate(request, "REJECTED");

        return scheduleMapper.toShiftChangeRequestResponse(request);
    }

    public ShiftChangeRequestResponse rejectByAdmin(String requestId, String message) {
        ShiftChangeRequest request = shiftChangeRequestRepository.findById(requestId)
            .orElseThrow(() -> new AppException(ErrorCode.REQUEST_NOT_FOUND));

        request.setAdminStatus("REJECTED");
        request.setAdminResponseMessage(message);
        request.setAdminResponseTime(LocalDateTime.now());
        
        updateOverallStatus(request);
        request = shiftChangeRequestRepository.save(request);
        
        // Send email notifications
        emailService.sendShiftChangeRequestUpdate(request, "REJECTED");

        return scheduleMapper.toShiftChangeRequestResponse(request);
    }

    public List<ShiftChangeRequestResponse> getRequestsByRequester(Account requester) {
        List<ShiftChangeRequest> requests = shiftChangeRequestRepository.findByRequester(requester);
        return scheduleMapper.toShiftChangeRequestResponseList(requests);
    }

    public List<ShiftChangeRequestResponse> getRequestsByTarget(Account target) {
        List<ShiftChangeRequest> requests = shiftChangeRequestRepository.findByTarget(target);
        return scheduleMapper.toShiftChangeRequestResponseList(requests);
    }

    public List<ShiftChangeRequestResponse> getPendingAdminApproval() {
        List<ShiftChangeRequest> requests = shiftChangeRequestRepository.findPendingAdminApproval();
        return scheduleMapper.toShiftChangeRequestResponseList(requests);
    }

    private ShiftChangeRequest getAndValidateRequest(String requestId, Account user, boolean isTarget) {
        ShiftChangeRequest request = shiftChangeRequestRepository.findById(requestId)
            .orElseThrow(() -> new AppException(ErrorCode.REQUEST_NOT_FOUND));
            
        if (isTarget && !request.getTarget().getAccountId().equals(user.getAccountId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_REQUEST);
        }
        
        if (!isTarget && !request.getRequester().getAccountId().equals(user.getAccountId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_REQUEST);
        }
        
        return request;
    }

    private void updateOverallStatus(ShiftChangeRequest request) {
        if ("REJECTED".equals(request.getTargetStatus()) || "REJECTED".equals(request.getAdminStatus())) {
            request.setStatus("REJECTED");
        } else if ("APPROVED".equals(request.getTargetStatus()) && "APPROVED".equals(request.getAdminStatus())) {
            request.setStatus("APPROVED");
        } else {
            request.setStatus("PENDING");
        }
    }

    private void swapSchedules(ShiftChangeRequest request) {
        WorkSchedule originalSchedule = request.getOriginalSchedule();
        WorkSchedule targetSchedule = request.getTargetSchedule();
        
        Account tempEmployee = originalSchedule.getEmployee();
        originalSchedule.setEmployee(targetSchedule.getEmployee());
        targetSchedule.setEmployee(tempEmployee);
        
        workScheduleRepository.save(originalSchedule);
        workScheduleRepository.save(targetSchedule);
    }

    private boolean hasMatchingRole(Account requester, Account target) {
        return requester.getRoles().stream()
            .anyMatch(requesterRole -> 
                target.getRoles().stream()
                    .anyMatch(targetRole -> 
                        targetRole.getRole_Name().equals(requesterRole.getRole_Name())
                    )
            );
    }

    public ShiftChangeRequest createShiftChangeRequest(ShiftChangeRequestDTO requestDTO) {
        WorkSchedule originalSchedule = workScheduleRepository.findById(Long.parseLong(requestDTO.getOriginalScheduleId()))
                .orElseThrow(() -> new AppException(ErrorCode.SCHEDULE_NOT_FOUND));

        WorkSchedule targetSchedule = workScheduleRepository.findById(Long.parseLong(requestDTO.getTargetScheduleId()))
                .orElseThrow(() -> new AppException(ErrorCode.SCHEDULE_NOT_FOUND));

        if (!canRequestShiftChange(originalSchedule)) {
            throw new AppException(ErrorCode.SHIFT_CHANGE_REQUEST_NOT_ALLOWED);
        }

        ShiftChangeRequest request = ShiftChangeRequest.builder()
                .requester(originalSchedule.getEmployee())
                .target(targetSchedule.getEmployee())
                .originalSchedule(originalSchedule)
                .targetSchedule(targetSchedule)
                .reason(requestDTO.getReason())
                .requestTime(LocalDateTime.now())
                .status("PENDING")
                .targetStatus("PENDING")
                .adminStatus("PENDING")
                .build();

        ShiftChangeRequest savedRequest = shiftChangeRequestRepository.save(request);
        emailService.sendShiftChangeRequest(savedRequest);
        return savedRequest;
    }

    public boolean canRequestShiftChange(WorkSchedule schedule) {
        // Check if the schedule is in the future
        if (schedule.getWorkDate().isBefore(LocalDateTime.now().toLocalDate())) {
            return false;
        }

        // Check if there are any pending requests for this schedule
        List<ShiftChangeRequest> existingRequests = shiftChangeRequestRepository.findByOriginalScheduleAndStatus(
                schedule, "PENDING");
        
        return existingRequests.isEmpty();
    }

    public List<ShiftChangeRequest> getSentShiftChangeRequests(String employeeId) {
        System.out.println("Attempting to find user with ID: " + employeeId);
        // First check if ID is valid
        if (employeeId == null || employeeId.trim().isEmpty()) {
            System.out.println("Employee ID is null or empty");
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        
        try {
            Account employee = userRepo.findById(employeeId)
                    .orElseThrow(() -> {
                        System.out.println("User not found with ID: " + employeeId);
                        return new AppException(ErrorCode.USER_NOT_FOUND);
                    });
            System.out.println("Found user: " + employee.getUsername() + " with ID: " + employee.getAccountId());
            return shiftChangeRequestRepository.findByRequester(employee);
        } catch (Exception e) {
            System.out.println("Error finding user: " + e.getMessage());
            throw e;
        }
    }

    public List<ShiftChangeRequest> getReceivedShiftChangeRequests(String employeeId) {
        System.out.println("Attempting to find user with ID: " + employeeId);
        // First check if ID is valid
        if (employeeId == null || employeeId.trim().isEmpty()) {
            System.out.println("Employee ID is null or empty");
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        
        try {
            Account employee = userRepo.findById(employeeId)
                    .orElseThrow(() -> {
                        System.out.println("User not found with ID: " + employeeId);
                        return new AppException(ErrorCode.USER_NOT_FOUND);
                    });
            System.out.println("Found user: " + employee.getUsername() + " with ID: " + employee.getAccountId());
            return shiftChangeRequestRepository.findByTarget(employee);
        } catch (Exception e) {
            System.out.println("Error finding user: " + e.getMessage());
            throw e;
        }
    }

    public ShiftChangeRequest approveShiftChangeRequest(String requestId) {
        ShiftChangeRequest request = shiftChangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.REQUEST_NOT_FOUND));

        if (!"PENDING".equals(request.getTargetStatus())) {
            throw new AppException(ErrorCode.REQUEST_ALREADY_PROCESSED);
        }

        request.setTargetStatus("APPROVED");
        request.setTargetResponseTime(LocalDateTime.now());
        
        // If target approves, notify admin for final approval
        emailService.sendShiftChangeRequestUpdate(request, "APPROVED");
        
        return shiftChangeRequestRepository.save(request);
    }

    public ShiftChangeRequest rejectShiftChangeRequest(String requestId, String reason) {
        ShiftChangeRequest request = shiftChangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.REQUEST_NOT_FOUND));

        if (!"PENDING".equals(request.getTargetStatus())) {
            throw new AppException(ErrorCode.REQUEST_ALREADY_PROCESSED);
        }

        request.setTargetStatus("REJECTED");
        request.setStatus("REJECTED");
        request.setTargetResponseTime(LocalDateTime.now());
        request.setTargetResponseMessage(reason);
        
        emailService.sendShiftChangeRequestUpdate(request, "REJECTED");
        
        return shiftChangeRequestRepository.save(request);
    }

    public ShiftChangeRequest adminApproveRequest(String requestId) {
        ShiftChangeRequest request = shiftChangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.REQUEST_NOT_FOUND));

        if (!"APPROVED".equals(request.getTargetStatus())) {
            throw new AppException(ErrorCode.TARGET_NOT_APPROVED);
        }

        if (!"PENDING".equals(request.getAdminStatus())) {
            throw new AppException(ErrorCode.REQUEST_ALREADY_PROCESSED);
        }

        // Swap the employees in the schedules
        WorkSchedule originalSchedule = request.getOriginalSchedule();
        WorkSchedule targetSchedule = request.getTargetSchedule();
        
        Account requester = originalSchedule.getEmployee();
        Account target = targetSchedule.getEmployee();
        
        originalSchedule.setEmployee(target);
        targetSchedule.setEmployee(requester);
        
        workScheduleRepository.save(originalSchedule);
        workScheduleRepository.save(targetSchedule);

        request.setAdminStatus("APPROVED");
        request.setStatus("APPROVED");
        request.setAdminResponseTime(LocalDateTime.now());
        
        emailService.sendShiftChangeRequestUpdate(request, "APPROVED");
        
        return shiftChangeRequestRepository.save(request);
    }

    public ShiftChangeRequest adminRejectRequest(String requestId, String reason) {
        ShiftChangeRequest request = shiftChangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new AppException(ErrorCode.REQUEST_NOT_FOUND));

        if (!"PENDING".equals(request.getAdminStatus())) {
            throw new AppException(ErrorCode.REQUEST_ALREADY_PROCESSED);
        }

        request.setAdminStatus("REJECTED");
        request.setStatus("REJECTED");
        request.setAdminResponseTime(LocalDateTime.now());
        request.setAdminResponseMessage(reason);
        
        emailService.sendShiftChangeRequestUpdate(request, "REJECTED");
        
        return shiftChangeRequestRepository.save(request);
    }

    public List<ShiftChangeRequest> getAllShiftChangeRequests() {
        return shiftChangeRequestRepository.findAllOrderByRequestTimeDesc();
    }
} 