package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccinationEligibility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthRecordResponse {
    private Long id;
    private Long appointmentId;
    private ChildInfo child;
    private Float temperature;
    private Float weight;
    private Float height;
    private String bloodPressure;
    private String allergies;
    private String symptoms;
    private String diagnosis;
    private String recommendations;
    private VaccinationEligibility eligibility;
    private String eligibilityDescription;
    private String reasonIfNotEligible;
    private LocalDate rescheduledDate;
    private DoctorInfo doctor;
    private LocalDateTime recordedAt;
    private LocalDateTime updatedAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChildInfo {
        private String id;
        private String name;
        private String gender;
        private String bloodType;
        private String allergies;
        private String medicalConditions;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorInfo {
        private String id;
        private String firstName;
        private String lastName;
        private String specialization;
    }
} 