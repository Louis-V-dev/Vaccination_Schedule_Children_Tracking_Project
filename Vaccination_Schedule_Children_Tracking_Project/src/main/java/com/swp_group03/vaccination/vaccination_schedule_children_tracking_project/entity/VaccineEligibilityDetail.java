package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Entity
@Table(name = "vaccine_eligibility_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VaccineEligibilityDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "detail_id")
    Long id;
    
    @ManyToOne
    @JoinColumn(name = "eligibility_check_id", nullable = false)
    MultiVaccineEligibilityCheck eligibilityCheck;
    
    @ManyToOne
    @JoinColumn(name = "vaccine_id", nullable = false)
    Vaccine vaccine;
    
    @ManyToOne
    @JoinColumn(name = "appointment_vaccine_id", nullable = false)
    AppointmentVaccine appointmentVaccine;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    VaccineEligibilityStatus status;
    
    @Column(name = "notes", length = 500)
    String notes;
    
    @Column(name = "recommended_reschedule_date")
    LocalDate recommendedRescheduleDate;
    
    @Column(name = "reschedule_reason", length = 500)
    String rescheduleReason;
} 