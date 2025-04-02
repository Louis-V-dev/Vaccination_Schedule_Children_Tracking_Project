package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointment_vaccines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentVaccine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "appointment_id", nullable = false)
    @JsonBackReference
    private Appointment appointment;

    @ManyToOne
    @JoinColumn(name = "vaccine_of_child_id", nullable = true)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "appointmentVaccines"})
    private VaccineOfChild vaccineOfChild;

    @ManyToOne
    @JoinColumn(name = "vaccine_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Vaccine vaccine;

    @ManyToOne
    @JoinColumn(name = "vaccine_combo_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private VaccineCombo vaccineCombo;

    @ManyToOne
    @JoinColumn(name = "dose_schedule_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "appointmentVaccines"})
    private DoseSchedule doseSchedule;

    @Column(nullable = false)
    private Integer doseNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VaccinationStatus status;

    @Column(name = "from_combo")
    private Boolean fromCombo;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = VaccinationStatus.PENDING;
        if (fromCombo == null) fromCombo = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void setStatus(String status) {
        this.status = VaccinationStatus.valueOf(status);
    }

    public void setStatus(VaccinationStatus status) {
        this.status = status;
    }

    public String getStatus() {
        return status != null ? status.name() : null;
    }

    public VaccinationStatus getStatusEnum() {
        return this.status;
    }
} 