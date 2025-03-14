package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "health_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class HealthRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "health_record_id")
    Long id;
    
    @OneToOne
    @JoinColumn(name = "appointment_id", nullable = false)
    @JsonIgnoreProperties({"healthRecord", "child", "guardian", "doctor"})
    Appointment appointment;
    
    @ManyToOne
    @JoinColumn(name = "child_id", nullable = false)
    @JsonIgnoreProperties({"healthRecords", "vaccineRecords", "appointments", "account_Id"})
    Child child;
    
    @Column(name = "temperature")
    Float temperature;
    
    @Column(name = "weight")
    Float weight;
    
    @Column(name = "height")
    Float height;
    
    @Column(name = "blood_pressure")
    String bloodPressure;
    
    @Column(name = "allergies", length = 500)
    String allergies;
    
    @Column(name = "symptoms", length = 500)
    String symptoms;
    
    @Column(name = "diagnosis", length = 1000)
    String diagnosis;
    
    @Column(name = "recommendations", length = 1000)
    String recommendations;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "eligibility")
    VaccinationEligibility eligibility;
    
    @Column(name = "reason_if_not_eligible", length = 500)
    String reasonIfNotEligible;
    
    @Column(name = "rescheduled_date")
    LocalDate rescheduledDate;
    
    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    @JsonIgnoreProperties({"healthRecords", "password", "roles", "verificationCode", "verificationCodeExpiry"})
    Account doctor;
    
    @Column(name = "recorded_at")
    LocalDateTime recordedAt;
    
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        recordedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 