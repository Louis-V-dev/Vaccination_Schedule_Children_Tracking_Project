package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.schedule;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatternRequestDTO {
    @NotBlank(message = "Pattern name is required")
    private String name;
    
    @NotBlank(message = "Employee ID is required")
    private String employeeId;
    
    @NotEmpty(message = "Pattern shifts are required")
    private List<PatternShiftDTO> shifts;
    
    private boolean regenerateSchedules;
} 