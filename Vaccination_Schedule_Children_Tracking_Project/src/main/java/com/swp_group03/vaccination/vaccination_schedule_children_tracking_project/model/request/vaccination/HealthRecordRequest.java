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
public class HealthRecordRequest {
    
    @NotNull(message = "Appointment vaccine ID is required")
    private Long appointmentVaccineId;
    
    private String preVaccinationHealth;
    
    private Float temperature;
    
    private Float weight;
    
    private Float height;
    
    private String bloodPressure;
    
    private Integer heartRate;
    
    private String allergies;
    
    private String currentMedications;
    
    private String doctorNotes;
    
    @NotNull(message = "Vaccination approval status is required")
    private Boolean vaccinationApproved;
    
    private String rejectionReason;
    
    private String nextAppointmentRecommendations;
} 