package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "dose_interval")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoseInterval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vaccine_id", nullable = false)
    private Vaccine vaccine;

    @NotNull
    @Min(1)
    @Column(name = "from_dose", nullable = false)
    private Integer fromDose;

    @NotNull
    @Min(1)
    @Column(name = "to_dose", nullable = false)
    private Integer toDose;

    @NotNull
    @Min(0)
    @Column(name = "interval_days", nullable = false)
    private Integer intervalDays;
} 