package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vaccine_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class VaccineRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "record_id")
    Long id;
    
    @ManyToOne
    @JoinColumn(name = "administration_batch_id")
    VaccineAdministrationBatch administrationBatch;
    
    @ManyToOne
    @JoinColumn(name = "child_id", nullable = false)
    @JsonIgnoreProperties({"vaccineRecords", "healthRecords", "appointments", "account_Id"})
    Child child;
    
    @ManyToOne
    @JoinColumn(name = "vaccine_id", nullable = false)
    @JsonIgnoreProperties({"vaccineRecords"})
    Vaccine vaccine;
    
    @ManyToOne
    @JoinColumn(name = "appointment_vaccine_id")
    AppointmentVaccine appointmentVaccine;
    
    @Column(name = "dose_number", nullable = false)
    Integer doseNumber;
    
    @Column(name = "batch_number")
    String batchNumber;
    
    @Column(name = "lot_number")
    String lotNumber;
    
    @Column(name = "expiration_date")
    LocalDate expirationDate;
    
    @Column(name = "manufacturer")
    String manufacturer;
    
    @ManyToOne
    @JoinColumn(name = "administered_by", nullable = false)
    Account administeredBy;
    
    @Column(name = "administration_site")
    String administrationSite;
    
    @Column(name = "administration_method")
    String administrationMethod;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    VaccineStatus status = VaccineStatus.ADMINISTERED;
    
    @Column(name = "administered_at")
    LocalDateTime administeredAt;
    
    @Column(name = "next_dose_date")
    LocalDate nextDoseDate;
    
    @Column(name = "notes", length = 500)
    String notes;
    
    @ManyToOne
    @JoinColumn(name = "vaccination_plan_id")
    @JsonIgnoreProperties({"vaccineRecords", "child", "parent"})
    VaccinationPlan vaccinationPlan;
    
    @Column(name = "created_at")
    LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        administeredAt = LocalDateTime.now();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = VaccineStatus.SCHEDULED;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 