package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vaccine_payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VaccinePayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    Long id;
    
    @ManyToOne
    @JoinColumn(name = "payment_id", insertable = false, updatable = false)
    Payment payment;
    
    @ManyToOne
    @JoinColumn(name = "package_id")
    VaccinePackage vaccinePackage;
    
    @ManyToMany
    @JoinTable(
        name = "vaccine_payment_vaccines",
        joinColumns = @JoinColumn(name = "payment_id"),
        inverseJoinColumns = @JoinColumn(name = "vaccine_id")
    )
    List<Vaccine> individualVaccines = new ArrayList<>();
    
    @ManyToOne
    @JoinColumn(name = "child_id")
    Child child;
    
    @ManyToOne
    @JoinColumn(name = "guardian_id")
    Account guardian;
    
    @Column(name = "amount", precision = 10, scale = 2)
    BigDecimal amount;
    
    @Column(name = "is_package")
    Boolean isPackage = false;
    
    @OneToMany(mappedBy = "vaccinePayment")
    List<VaccineDoseSchedule> coveredDoses = new ArrayList<>();
    
    @Column(name = "created_at")
    LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 