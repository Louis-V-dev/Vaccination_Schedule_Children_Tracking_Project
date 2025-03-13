package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller.admin;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PatternShift;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.SchedulePattern;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Shift;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.schedule.PatternRequestDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.PatternResponseDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.ShiftResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.WeekDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.UserRepo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.PatternService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/patterns")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@Tag(name = "Schedule Patterns", description = "Schedule pattern management APIs")
public class PatternController {
    @Autowired
    private PatternService patternService;
    
    @Autowired
    private UserRepo userRepo;
    
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    
    @GetMapping
    @Operation(summary = "Get all schedule patterns")
    public ApiResponse<List<PatternResponseDTO>> getAllPatterns() {
        List<SchedulePattern> patterns = patternService.getAllPatterns();
        return ApiResponse.success(patterns.stream().map(this::toPatternResponseDTO).collect(Collectors.toList()));
    }
    
    @GetMapping("/{patternId}")
    @Operation(summary = "Get pattern by ID")
    public ApiResponse<PatternResponseDTO> getPatternById(@PathVariable Long patternId) {
        SchedulePattern pattern = patternService.getPatternById(patternId);
        return ApiResponse.success(toPatternResponseDTO(pattern));
    }
    
    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get patterns by employee")
    public ApiResponse<List<PatternResponseDTO>> getPatternsByEmployee(@PathVariable String employeeId) {
        List<SchedulePattern> patterns = patternService.getPatternsByEmployee(employeeId);
        return ApiResponse.success(patterns.stream().map(this::toPatternResponseDTO).collect(Collectors.toList()));
    }
    
    @PostMapping
    @Operation(summary = "Create a new pattern")
    public ApiResponse<PatternResponseDTO> createPattern(@Valid @RequestBody PatternRequestDTO requestDTO) {
        SchedulePattern pattern = patternService.createPattern(requestDTO);
        return ApiResponse.success(toPatternResponseDTO(pattern));
    }
    
    @PutMapping("/{patternId}")
    @Operation(summary = "Update a pattern")
    public ApiResponse<PatternResponseDTO> updatePattern(
            @PathVariable Long patternId,
            @Valid @RequestBody PatternRequestDTO requestDTO) {
        SchedulePattern pattern = patternService.updatePattern(patternId, requestDTO);
        return ApiResponse.success(toPatternResponseDTO(pattern));
    }
    
    @PostMapping("/{patternId}/regenerate")
    @Operation(summary = "Regenerate schedules from pattern")
    public ApiResponse<Void> regenerateSchedules(
            @PathVariable Long patternId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate) {
        patternService.regenerateSchedules(patternId, startDate);
        return ApiResponse.success();
    }
    
    @PostMapping("/deactivate/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> deactivatePatterns(@PathVariable String employeeId) {
        try {
            Account employee = userRepo.findById(employeeId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            
            patternService.deactivatePatterns(employee);
            
            ApiResponse<String> response = new ApiResponse<>();
            response.setCode(100);
            response.setMessage("Patterns deactivated successfully");
            response.setResult("All patterns for employee " + employee.getFullName() + " have been deactivated");
            return response;
        } catch (AppException e) {
            ApiResponse<String> response = new ApiResponse<>();
            response.setCode(e.getErrorCode().getCode());
            response.setMessage(e.getErrorCode().getMessage());
            return response;
        }
    }
    
    @DeleteMapping("/{patternId}")
    @Operation(summary = "Delete a pattern")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> deletePattern(@PathVariable Long patternId) {
        try {
            patternService.deletePattern(patternId);
            return ApiResponse.success("Pattern deleted successfully");
        } catch (AppException e) {
            return new ApiResponse<>(e.getErrorCode().getCode(), e.getMessage(), null);
        }
    }
    
    private PatternResponseDTO toPatternResponseDTO(SchedulePattern pattern) {
        return PatternResponseDTO.builder()
                .id(pattern.getId())
                .name(pattern.getName())
                .employeeId(pattern.getEmployee().getAccountId())
                .employeeName(pattern.getEmployee().getFullName())
                .creationDate(pattern.getCreationDate())
                .lastModified(pattern.getLastModified())
                .active(pattern.isActive())
                .patternShifts(pattern.getShifts().stream()
                        .map(patternShift -> PatternResponseDTO.PatternShiftDTO.builder()
                                .id(patternShift.getId())
                                .weekNumber(patternShift.getWeekNumber())
                                .dayOfWeek(patternShift.getDayOfWeek())
                                .shift(ShiftResponse.fromEntity(patternShift.getShift()))
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
} 