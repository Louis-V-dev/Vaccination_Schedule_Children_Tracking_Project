package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "post_vaccination_care")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostVaccinationCare {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "appointment_vaccine_id", nullable = false)
    private AppointmentVaccine appointmentVaccine;

    @ManyToOne
    @JoinColumn(name = "staff_id", nullable = false)
    private Account staff;

    @Column(name = "observation_start_time")
    private LocalDateTime observationStartTime;

    @Column(name = "observation_end_time")
    private LocalDateTime observationEndTime;

    @Column(name = "temperature")
    private Float temperature;

    @Column(name = "blood_pressure")
    private String bloodPressure;

    @Column(name = "heart_rate")
    private Integer heartRate;

    @Column(name = "immediate_reactions")
    private String immediateReactions;

    @Column(name = "treatment_provided")
    private String treatmentProvided;

    @Column(name = "staff_notes")
    private String staffNotes;

    @Column(name = "follow_up_needed")
    private Boolean followUpNeeded;

    @Column(name = "follow_up_instructions")
    private String followUpInstructions;

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