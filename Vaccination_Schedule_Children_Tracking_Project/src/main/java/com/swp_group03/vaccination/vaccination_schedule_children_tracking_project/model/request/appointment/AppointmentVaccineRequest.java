package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.appointment;

import lombok.Data;

@Data
public class AppointmentVaccineRequest {
    private Long vaccineId;          // For new vaccines
    private Long vaccineOfChildId;   // For existing vaccines
    private Long doseScheduleId;     // For next doses
    private Integer doseNumber;      // Required for new vaccines
} 