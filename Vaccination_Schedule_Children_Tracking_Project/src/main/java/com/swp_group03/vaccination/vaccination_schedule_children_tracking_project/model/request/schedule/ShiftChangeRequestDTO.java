package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.schedule;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftChangeRequestDTO {
    @NotBlank(message = "Original schedule ID is required")
    private String originalScheduleId;

    @NotBlank(message = "Target schedule ID is required")
    private String targetScheduleId;

    @NotBlank(message = "Reason is required")
    private String reason;
} 