package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vaccination_plans")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VaccinationPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id")
    Long id;
    
    @ManyToOne
    @JoinColumn(name = "child_id", nullable = false)
    Child child;
    
    @ManyToOne
    @JoinColumn(name = "vaccine_package_id")
    VaccinePackage vaccinePackage;
    
    @Column(name = "is_paid")
    Boolean isPaid = false;
    
    @Column(name = "payment_reference")
    String paymentReference;
    
    @Column(name = "start_date", nullable = false)
    LocalDate startDate;
    
    @Column(name = "completion_date")
    LocalDate completionDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    PlanStatus status = PlanStatus.ACTIVE;
    
    @OneToMany(mappedBy = "vaccinationPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    List<VaccineDoseSchedule> scheduledDoses = new ArrayList<>();
    
    @Column(name = "created_at")
    LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
    
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