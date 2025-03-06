package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoseIntervalResponse {
    
    private Long id;
    private Long vaccineId;
    private Integer fromDose;
    private Integer toDose;
    private Integer intervalDays;
} 