package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "dose_schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoseSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "vaccine_of_child_id", nullable = false)
    private VaccineOfChild vaccineOfChild;

    @Column(nullable = false)
    private Integer doseNumber;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "actual_date")
    private LocalDateTime actualDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DoseStatus status;

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
        if (status == null) status = DoseStatus.UNSCHEDULED;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void setStatus(String status) {
        this.status = DoseStatus.valueOf(status);
    }

    public String getStatus() {
        return status != null ? status.name() : null;
    }
} 