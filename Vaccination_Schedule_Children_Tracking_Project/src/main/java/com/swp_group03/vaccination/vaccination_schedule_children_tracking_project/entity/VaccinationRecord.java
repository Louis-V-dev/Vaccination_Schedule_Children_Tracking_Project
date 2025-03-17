package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vaccination_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VaccinationRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "appointment_vaccine_id", nullable = false)
    private AppointmentVaccine appointmentVaccine;

    @ManyToOne
    @JoinColumn(name = "nurse_id", nullable = false)
    private Account nurse;

    @Column(name = "vaccination_time")
    private LocalDateTime vaccinationTime;

    @Column(name = "vaccine_batch_number")
    private String vaccineBatchNumber;

    @Column(name = "vaccine_expiry_date")
    private LocalDateTime vaccineExpiryDate;

    @Column(name = "injection_site")
    private String injectionSite;

    @Column(name = "route_of_administration")
    private String routeOfAdministration;

    @Column(name = "dose_amount")
    private String doseAmount;

    @Column(name = "nurse_notes")
    private String nurseNotes;

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