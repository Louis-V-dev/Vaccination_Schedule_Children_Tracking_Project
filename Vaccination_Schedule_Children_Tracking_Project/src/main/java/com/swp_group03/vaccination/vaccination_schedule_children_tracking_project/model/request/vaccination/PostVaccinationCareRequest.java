package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.vaccination;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostVaccinationCareRequest {
    
    @NotNull(message = "Appointment vaccine ID is required")
    private Long appointmentVaccineId;
    
    private Float temperature;
    
    private String bloodPressure;
    
    private Integer heartRate;
    
    private String immediateReactions;
    
    private String treatmentProvided;
    
    private String staffNotes;
    
    @NotNull(message = "Follow-up needed status is required")
    private Boolean followUpNeeded;
    
    private String followUpInstructions;
} 