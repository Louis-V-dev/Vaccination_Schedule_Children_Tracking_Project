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
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Arrays;
import java.util.HashMap;
import java.util.ArrayList;

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

    @GetMapping("/available")
    @Operation(summary = "Get available dates for appointments")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<LocalDate>> getAvailableDates(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        if (startDate == null) {
            startDate = LocalDate.now();
        }
        if (endDate == null) {
            endDate = startDate.plusMonths(1);
        }

        // Get schedules only for doctors
        List<WorkSchedule> doctorSchedules = scheduleService.getDoctorSchedulesByDateRange(startDate, endDate);
        List<LocalDate> availableDates = doctorSchedules.stream()
                .filter(schedule -> schedule.getIsAvailable() 
                    && schedule.getBookedAppointments() < schedule.getMaxAppointmentsPerDay()
                    && schedule.getEmployee().getRoles().stream()
                        .anyMatch(role -> role.getRole_Name().equals("DOCTOR")))
                .map(WorkSchedule::getWorkDate)
                .distinct()
                .collect(Collectors.toList());

        return new ApiResponse<>(100, "Available dates retrieved successfully", availableDates);
    }

    @GetMapping("/available-slots")
    @Operation(summary = "Get available time slots for a specific date")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Map<String, Object>> getAvailableTimeSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String doctorId) {
        
        List<WorkSchedule> schedules;
        if (doctorId != null) {
            // Get schedule for specific doctor
            schedules = scheduleService.getDoctorSchedulesByDateRange(doctorId, date, date);
        } else {
            // Get schedules for all doctors
            schedules = scheduleService.getDoctorSchedulesByDateRange(date, date);
        }

        // Get available time slots for each schedule
        Map<String, List<String>> availableSlots = new HashMap<>();
        for (WorkSchedule schedule : schedules) {
            if (schedule.getIsAvailable() 
                && schedule.getBookedAppointments() < schedule.getMaxAppointmentsPerDay()
                && schedule.getEmployee().getRoles().stream()
                    .anyMatch(role -> role.getRole_Name().equals("DOCTOR"))) {
                
                // Use the shift's start and end times for slots
                List<String> slots = getAvailableTimeSlots(schedule);
                if (!slots.isEmpty()) {
                    String doctorName = schedule.getEmployee().getFirstName() + " " + schedule.getEmployee().getLastName();
                    availableSlots.put(doctorName, slots);
                }
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("availableSlots", availableSlots);
        response.put("doctorCount", schedules.size());

        return new ApiResponse<>(100, "Available time slots retrieved successfully", response);
    }

    private List<String> getAvailableTimeSlots(WorkSchedule schedule) {
        try {
            // Get the shift's start and end times directly as LocalTime objects
            LocalTime startTime = schedule.getShift().getStartTime();
            LocalTime endTime = schedule.getShift().getEndTime();
            
            // Generate hourly slots between start and end time
            List<String> slots = new ArrayList<>();
            LocalTime currentTime = startTime;
            
            while (currentTime.isBefore(endTime)) {
                LocalTime nextHour = currentTime.plusHours(1);
                // Format times as HH:mm
                String formattedStart = String.format("%02d:%02d", currentTime.getHour(), currentTime.getMinute());
                String formattedEnd = String.format("%02d:%02d", nextHour.getHour(), nextHour.getMinute());
                String slot = formattedStart + "-" + formattedEnd;
                
                if (isTimeSlotAvailable(schedule, slot)) {
                    slots.add(slot);
                }
                currentTime = nextHour;
            }
            
            return slots;
        } catch (Exception e) {
            logger.error("Error generating time slots for schedule: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private boolean isTimeSlotAvailable(WorkSchedule schedule, String timeSlot) {
        // For now, just check if the schedule is available and not fully booked
        return schedule.getIsAvailable() && schedule.getBookedAppointments() < schedule.getMaxAppointmentsPerDay();
    }
} 