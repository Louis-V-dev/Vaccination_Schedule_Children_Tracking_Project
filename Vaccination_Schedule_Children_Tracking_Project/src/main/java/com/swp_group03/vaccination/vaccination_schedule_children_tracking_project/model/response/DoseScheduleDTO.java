package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoseScheduleDTO {
    private Long id;
    private VaccineOfChildDTO vaccineOfChild;
    private Integer doseNumber;
    private String status;
    private String scheduledDate;
} 