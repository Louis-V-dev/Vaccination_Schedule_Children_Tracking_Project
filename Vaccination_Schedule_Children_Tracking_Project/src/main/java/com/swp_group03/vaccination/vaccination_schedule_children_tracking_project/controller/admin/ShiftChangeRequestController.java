package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller.admin;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.ShiftChangeRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.mapper.ScheduleMapper;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.ShiftChangeRequestResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.ShiftChangeRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/shift-change-requests")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@Tag(name = "Admin Shift Change Request", description = "Admin shift change request management APIs")
public class ShiftChangeRequestController {

    @Autowired
    private ShiftChangeRequestService shiftChangeRequestService;

    @Autowired
    private ScheduleMapper scheduleMapper;

    @GetMapping
    @Operation(summary = "Get all shift change requests")
    public ApiResponse<List<ShiftChangeRequestResponse>> getAllShiftChangeRequests() {
        List<ShiftChangeRequest> requests = shiftChangeRequestService.getAllShiftChangeRequests();
        List<ShiftChangeRequestResponse> responses = requests.stream()
                .map(scheduleMapper::toShiftChangeRequestResponse)
                .collect(Collectors.toList());
        return new ApiResponse<>(100, "Shift change requests retrieved successfully", responses);
    }

    @PatchMapping("/{requestId}/approve")
    @Operation(summary = "Admin approve shift change request")
    public ApiResponse<ShiftChangeRequestResponse> approveShiftChangeRequest(
            @PathVariable String requestId) {
        ShiftChangeRequest request = shiftChangeRequestService.adminApproveRequest(requestId);
        return new ApiResponse<>(100, "Shift change request approved successfully",
                scheduleMapper.toShiftChangeRequestResponse(request));
    }

    @PatchMapping("/{requestId}/reject")
    @Operation(summary = "Admin reject shift change request")
    public ApiResponse<ShiftChangeRequestResponse> rejectShiftChangeRequest(
            @PathVariable String requestId,
            @RequestParam(required = false) String reason) {
        ShiftChangeRequest request = shiftChangeRequestService.adminRejectRequest(requestId, reason);
        return new ApiResponse<>(100, "Shift change request rejected successfully",
                scheduleMapper.toShiftChangeRequestResponse(request));
    }
} 