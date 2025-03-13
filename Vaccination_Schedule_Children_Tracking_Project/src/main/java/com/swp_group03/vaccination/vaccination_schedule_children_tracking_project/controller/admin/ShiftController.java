package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller.admin;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Shift;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.schedule.ShiftRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.ShiftResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.ShiftService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/shifts")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@Tag(name = "Shift", description = "Shift management APIs")
public class ShiftController {

    @Autowired
    private ShiftService shiftService;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private ShiftResponse mapToShiftResponse(Shift shift) {
        return ShiftResponse.builder()
                .id(shift.getId())
                .name(shift.getName())
                .startTime(shift.getStartTime().format(TIME_FORMATTER))
                .endTime(shift.getEndTime().format(TIME_FORMATTER))
                .status(shift.isStatus())
                .build();
    }

    @PostMapping
    @Operation(summary = "Create a new shift")
    public ApiResponse<ShiftResponse> createShift(@Valid @RequestBody ShiftRequest request) {
        Shift shift = shiftService.createShift(request);
        return new ApiResponse<>(100, "Shift created successfully", mapToShiftResponse(shift));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update a shift")
    public ApiResponse<ShiftResponse> updateShift(@PathVariable String id, @Valid @RequestBody ShiftRequest request) {
        Shift shift = shiftService.updateShift(Long.valueOf(id), request);
        return new ApiResponse<>(100, "Shift updated successfully", mapToShiftResponse(shift));
    }

    @GetMapping
    @Operation(summary = "Get all shifts")
    public ApiResponse<List<ShiftResponse>> getAllShifts() {
        List<Shift> shifts = shiftService.getAllShifts();
        List<ShiftResponse> responses = shifts.stream()
                .map(this::mapToShiftResponse)
                .collect(Collectors.toList());
        return new ApiResponse<>(100, "All shifts retrieved", responses);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a shift by ID")
    public ApiResponse<ShiftResponse> getShiftById(@PathVariable String id) {
        Shift shift = shiftService.getShiftById(Long.valueOf(id));
        return new ApiResponse<>(100, "Shift retrieved successfully", mapToShiftResponse(shift));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a shift")
    public ApiResponse<Void> deleteShift(@PathVariable String id) {
        shiftService.deleteShift(Long.valueOf(id));
        return new ApiResponse<>(100, "Shift deleted successfully", null);
    }
} 