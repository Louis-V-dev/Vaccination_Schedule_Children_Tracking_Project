package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccinationEligibility;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthRecordRequest {
    
    @NotNull(message = "Appointment ID is required")
    private Long appointmentId;
    
    @NotNull(message = "Child ID is required")
    private String childId;
    
    private Float temperature;
    
    private Float weight;
    
    private Float height;
    
    private String bloodPressure;
    
    @Size(max = 500, message = "Allergies cannot exceed 500 characters")
    private String allergies;
    
    @Size(max = 500, message = "Symptoms cannot exceed 500 characters")
    private String symptoms;
    
    @Size(max = 1000, message = "Diagnosis cannot exceed 1000 characters")
    private String diagnosis;
    
    @Size(max = 1000, message = "Recommendations cannot exceed 1000 characters")
    private String recommendations;
    
    @NotNull(message = "Eligibility status is required")
    private VaccinationEligibility eligibility;
    
    @Size(max = 500, message = "Reason if not eligible cannot exceed 500 characters")
    private String reasonIfNotEligible;
    
    private LocalDate rescheduledDate;
} 