package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller.employee;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.ShiftChangeRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.WorkSchedule;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.mapper.ScheduleMapper;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.schedule.ShiftChangeRequestDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.EmployeeInfo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.ShiftChangeRequestResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.WorkScheduleResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.ShiftChangeRequestService;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.WorkScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/employee/schedules")
@PreAuthorize("isAuthenticated()")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@Tag(name = "Employee Schedule", description = "Employee schedule management APIs")
public class EmployeeScheduleController {

    @Autowired
    private WorkScheduleService workScheduleService;

    @Autowired
    private ShiftChangeRequestService shiftChangeRequestService;

    @Autowired
    private ScheduleMapper scheduleMapper;

    @GetMapping("/{employeeId}")
    @Operation(summary = "Get employee schedules by date range")
    public ApiResponse<List<WorkScheduleResponse>> getEmployeeSchedules(
            @PathVariable String employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<WorkSchedule> schedules = workScheduleService.getSchedulesByEmployeeAndDateRange(employeeId, startDate, endDate);
        List<WorkScheduleResponse> responses = schedules.stream()
                .map(scheduleMapper::toWorkScheduleResponse)
                .collect(Collectors.toList());
        return new ApiResponse<>(100, "Employee schedules retrieved successfully", responses);
    }

    @PostMapping("/shift-change-requests")
    @Operation(summary = "Create shift change request")
    public ApiResponse<ShiftChangeRequestResponse> createShiftChangeRequest(
            @Valid @RequestBody ShiftChangeRequestDTO request) {
        ShiftChangeRequest shiftChangeRequest = shiftChangeRequestService.createShiftChangeRequest(request);
        return new ApiResponse<>(100, "Shift change request created successfully", 
                scheduleMapper.toShiftChangeRequestResponse(shiftChangeRequest));
    }

    @GetMapping("/shift-change-requests/sent")
    @Operation(summary = "Get sent shift change requests")
    public ApiResponse<List<ShiftChangeRequestResponse>> getSentShiftChangeRequests(
            @RequestParam String employeeId) {
        List<ShiftChangeRequest> requests = shiftChangeRequestService.getSentShiftChangeRequests(employeeId);
        List<ShiftChangeRequestResponse> responses = requests.stream()
                .map(scheduleMapper::toShiftChangeRequestResponse)
                .collect(Collectors.toList());
        return new ApiResponse<>(100, "Sent shift change requests retrieved successfully", responses);
    }

    @GetMapping("/shift-change-requests/received")
    @Operation(summary = "Get received shift change requests")
    public ApiResponse<List<ShiftChangeRequestResponse>> getReceivedShiftChangeRequests(
            @RequestParam String employeeId) {
        List<ShiftChangeRequest> requests = shiftChangeRequestService.getReceivedShiftChangeRequests(employeeId);
        List<ShiftChangeRequestResponse> responses = requests.stream()
                .map(scheduleMapper::toShiftChangeRequestResponse)
                .collect(Collectors.toList());
        return new ApiResponse<>(100, "Received shift change requests retrieved successfully", responses);
    }

    @PatchMapping("/shift-change-requests/{requestId}/approve")
    @Operation(summary = "Approve shift change request")
    public ApiResponse<ShiftChangeRequestResponse> approveShiftChangeRequest(
            @PathVariable String requestId) {
        ShiftChangeRequest request = shiftChangeRequestService.approveShiftChangeRequest(requestId);
        return new ApiResponse<>(100, "Shift change request approved successfully",
                scheduleMapper.toShiftChangeRequestResponse(request));
    }

    @PatchMapping("/shift-change-requests/{requestId}/reject")
    @Operation(summary = "Reject shift change request")
    public ApiResponse<ShiftChangeRequestResponse> rejectShiftChangeRequest(
            @PathVariable String requestId,
            @RequestParam(required = false) String reason) {
        ShiftChangeRequest request = shiftChangeRequestService.rejectShiftChangeRequest(requestId, reason);
        return new ApiResponse<>(100, "Shift change request rejected successfully",
                scheduleMapper.toShiftChangeRequestResponse(request));
    }

    private EmployeeInfo mapToEmployeeInfo(Account employee) {
        return new EmployeeInfo(
            employee.getAccountId(),
            employee.getUsername(),
            employee.getFirstName() + " " + employee.getLastName(),
            employee.getRoles().stream()
                .map(role -> role.getRole_Name())
                .collect(Collectors.toList())
        );
    }
} 