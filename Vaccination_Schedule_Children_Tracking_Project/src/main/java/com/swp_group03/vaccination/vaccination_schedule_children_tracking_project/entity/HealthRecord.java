package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "health_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "appointment_vaccine_id", nullable = false)
    private AppointmentVaccine appointmentVaccine;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private Account doctor;

    @Column(name = "pre_vaccination_health")
    private String preVaccinationHealth;

    @Column(name = "temperature")
    private Float temperature;

    @Column(name = "weight")
    private Float weight;

    @Column(name = "height")
    private Float height;

    @Column(name = "blood_pressure")
    private String bloodPressure;

    @Column(name = "heart_rate")
    private Integer heartRate;

    @Column(name = "allergies")
    private String allergies;

    @Column(name = "current_medications")
    private String currentMedications;

    @Column(name = "doctor_notes")
    private String doctorNotes;

    @Column(name = "vaccination_approved")
    private Boolean vaccinationApproved;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "next_appointment_recommendations")
    private String nextAppointmentRecommendations;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 