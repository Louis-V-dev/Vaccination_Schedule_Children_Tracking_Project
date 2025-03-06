package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoseIntervalRequest {
    
    @NotNull(message = "From dose is required")
    @Min(value = 1, message = "From dose must be at least 1")
    private Integer fromDose;
    
    @NotNull(message = "To dose is required")
    @Min(value = 1, message = "To dose must be at least 1")
    private Integer toDose;
    
    @NotNull(message = "Interval days is required")
    @Min(value = 0, message = "Interval days must be at least 0")
    private Integer intervalDays;
} 