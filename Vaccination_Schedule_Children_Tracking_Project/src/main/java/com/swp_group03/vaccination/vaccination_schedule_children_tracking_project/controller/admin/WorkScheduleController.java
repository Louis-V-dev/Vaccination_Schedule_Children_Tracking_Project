package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller.admin;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Role;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.WorkSchedule;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.mapper.ScheduleMapper;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account.WorkScheduleRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.EmployeeInfo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.WorkScheduleResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.UserService;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.WorkScheduleService;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/schedules")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@Tag(name = "Work Schedules", description = "Work schedule management APIs")
public class WorkScheduleController {
    private static final Logger logger = LoggerFactory.getLogger(WorkScheduleController.class);

    @Autowired
    private WorkScheduleService scheduleService;

    @Autowired
    private UserService userService;

    @Autowired
    private ScheduleMapper scheduleMapper;

    @GetMapping("/employees/by-role/{roleName}")
    @Operation(summary = "Get employees by role")
    public ApiResponse<List<EmployeeInfo>> getEmployeesByRole(@PathVariable String roleName) {
        List<Account> employees = scheduleService.getEmployeesByRole(roleName);
        List<EmployeeInfo> employeeInfos = employees.stream()
                .map(scheduleMapper::toEmployeeInfo)
                .collect(Collectors.toList());
        return new ApiResponse<>(100, "Employees retrieved successfully", employeeInfos);
    }

    @PostMapping
    @Operation(summary = "Create a new work schedule")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<WorkScheduleResponse>> createSchedule(@Valid @RequestBody WorkScheduleRequest request) {
        try {
            logger.info("Creating schedule with request: {}", request);
            
            // Validate request
            if (request.getEmployeeId() == null || request.getEmployeeId().isEmpty()) {
                return new ApiResponse<>(400, "Employee ID is required", null);
            }
            
            if (request.getWeeklySchedules() == null || request.getWeeklySchedules().isEmpty()) {
                return new ApiResponse<>(400, "Weekly schedules are required", null);
            }
            
            List<WorkSchedule> schedules = scheduleService.createSchedule(request);
            List<WorkScheduleResponse> responses = schedules.stream()
                    .map(scheduleMapper::toWorkScheduleResponse)
                    .collect(Collectors.toList());
            
            logger.info("Successfully created {} schedules", schedules.size());
            return new ApiResponse<>(100, "Schedules created successfully", responses);
        } catch (AppException e) {
            logger.error("Error creating schedule: {}", e.getMessage(), e);
            return new ApiResponse<>(e.getErrorCode().getCode(), e.getMessage(), null);
        } catch (Exception e) {
            logger.error("Unexpected error creating schedule: {}", e.getMessage(), e);
            return new ApiResponse<>(500, "Failed to create schedule: " + e.getMessage(), null);
        }
    }

    @GetMapping
    @Operation(summary = "Get schedules by date range")
    public ApiResponse<List<WorkScheduleResponse>> getSchedules(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<WorkSchedule> schedules = scheduleService.getSchedulesByDateRange(startDate, endDate);
        List<WorkScheduleResponse> responses = schedules.stream()
                .map(scheduleMapper::toWorkScheduleResponse)
                .collect(Collectors.toList());
        return new ApiResponse<>(100, "Schedules retrieved successfully", responses);
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get schedules by employee and date range")
    public ApiResponse<List<WorkScheduleResponse>> getSchedulesByEmployee(
            @PathVariable String employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<WorkSchedule> schedules = scheduleService.getSchedulesByEmployeeAndDateRange(employeeId, startDate, endDate);
        List<WorkScheduleResponse> responses = schedules.stream()
                .map(scheduleMapper::toWorkScheduleResponse)
                .collect(Collectors.toList());
        return new ApiResponse<>(100, "Employee schedules retrieved successfully", responses);
    }
} 