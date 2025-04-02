package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.vaccination;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VaccinationRecordRequest {
    
    @NotNull(message = "Appointment vaccine ID is required")
    private Long appointmentVaccineId;
    
    @NotBlank(message = "Vaccine batch number is required")
    private String vaccineBatchNumber;
    
    @NotNull(message = "Vaccine expiry date is required")
    private LocalDateTime vaccineExpiryDate;
    
    @NotBlank(message = "Injection site is required")
    private String injectionSite;
    
    @NotBlank(message = "Route of administration is required")
    private String routeOfAdministration;
    
    @NotBlank(message = "Dose amount is required")
    private String doseAmount;
    
    private String nurseNotes;
} 