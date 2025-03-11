package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.schedule;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatternShiftDTO {
    @NotNull(message = "Week number is required")
    @Min(value = 1, message = "Week number must be between 1 and 4")
    @Max(value = 4, message = "Week number must be between 1 and 4")
    private Integer weekNumber;
    
    @NotNull(message = "Day of week is required")
    @Min(value = 1, message = "Day of week must be between 1 and 7")
    @Max(value = 7, message = "Day of week must be between 1 and 7")
    private Integer dayOfWeek;
    
    @NotNull(message = "Shift ID is required")
    private Long shiftId;
} 