package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VaccineDataResponse {
    private List<VaccineDTO> availableVaccines;
    private List<VaccineOfChildDTO> existingVaccines;
    private List<DoseScheduleDTO> upcomingDoses;
} 