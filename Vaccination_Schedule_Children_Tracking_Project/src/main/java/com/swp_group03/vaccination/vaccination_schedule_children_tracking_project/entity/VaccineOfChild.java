package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vaccine_of_child")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VaccineOfChild {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "child_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "vaccines", "appointments"})
    private Child child;

    @ManyToOne
    @JoinColumn(name = "vaccine_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Vaccine vaccine;

    @Column(name = "total_doses")
    private Integer totalDoses;

    @Column(name = "current_dose")
    private Integer currentDose;

    @Column(name = "is_completed")
    private Boolean isCompleted;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "completion_date")
    private LocalDateTime completionDate;

    @Column(name = "is_from_combo")
    private Boolean isFromCombo;

    @ManyToOne
    @JoinColumn(name = "combo_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "vaccineDetails"})
    private VaccineCombo vaccineCombo;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (currentDose == null) currentDose = 0;
        if (isCompleted == null) isCompleted = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 