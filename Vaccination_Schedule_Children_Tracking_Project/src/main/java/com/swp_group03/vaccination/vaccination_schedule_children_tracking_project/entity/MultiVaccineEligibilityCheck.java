package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "multi_vaccine_eligibility_checks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MultiVaccineEligibilityCheck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "check_id")
    Long id;
    
    @OneToOne
    @JoinColumn(name = "appointment_id", nullable = false)
    Appointment appointment;
    
    @ManyToOne
    @JoinColumn(name = "child_id", nullable = false)
    Child child;
    
    @Column(name = "temperature")
    Float temperature;
    
    @Column(name = "weight")
    Float weight;
    
    @Column(name = "vital_signs", length = 500)
    String vitalSigns;
    
    @Column(name = "symptoms", length = 500)
    String symptoms;
    
    @Column(name = "is_eligible_for_all_vaccines", nullable = false)
    Boolean isEligibleForAllVaccines = false;
    
    @Column(name = "general_remarks", length = 1000)
    String generalRemarks;
    
    @OneToMany(mappedBy = "eligibilityCheck", cascade = CascadeType.ALL, orphanRemoval = true)
    List<VaccineEligibilityDetail> vaccineDetails = new ArrayList<>();
    
    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    Account doctor;
    
    @Column(name = "created_at")
    LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 