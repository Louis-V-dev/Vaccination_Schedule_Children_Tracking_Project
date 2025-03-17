package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VaccineOfChildDTO {
    private Long id;
    private VaccineDTO vaccine;
    private Integer totalDoses;
    private Integer currentDose;
    private Boolean isCompleted;
    private Boolean isFromCombo;
} 