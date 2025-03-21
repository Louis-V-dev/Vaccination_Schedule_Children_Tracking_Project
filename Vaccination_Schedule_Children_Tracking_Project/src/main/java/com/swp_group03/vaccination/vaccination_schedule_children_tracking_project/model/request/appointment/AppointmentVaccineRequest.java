package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.appointment;

import lombok.Data;

@Data
public class AppointmentVaccineRequest {
    private Long vaccineId;          // For new vaccines
    private Long vaccineOfChildId;   // For existing vaccines
    private Long doseScheduleId;     // For next doses
    private Integer comboId;         // For vaccine combos
    private Integer doseNumber;      // Required for new vaccines
    private String type;             // NEW_VACCINE, NEXT_DOSE, or VACCINE_COMBO
} 