package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Entity
@Table(name = "vaccine_dose_schedules")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VaccineDoseSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dose_schedule_id")
    Long id;
    
    @ManyToOne
    @JoinColumn(name = "vaccination_plan_id", nullable = false)
    VaccinationPlan vaccinationPlan;
    
    @ManyToOne
    @JoinColumn(name = "child_id", nullable = false)
    Child child;
    
    @ManyToOne
    @JoinColumn(name = "vaccine_id", nullable = false)
    Vaccine vaccine;
    
    @Column(name = "dose_number", nullable = false)
    Integer doseNumber;
    
    @Column(name = "scheduled_date", nullable = false)
    LocalDate scheduledDate;
    
    @Column(name = "recommended_date_min")
    LocalDate recommendedDateMin;
    
    @Column(name = "recommended_date_max")
    LocalDate recommendedDateMax;
    
    @OneToOne
    @JoinColumn(name = "appointment_id")
    Appointment appointment;
    
    @OneToOne
    @JoinColumn(name = "vaccine_record_id")
    VaccineRecord vaccineRecord;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    DoseStatus status = DoseStatus.SCHEDULED;
    
    @Column(name = "is_paid")
    Boolean isPaid = false;
    
    @Column(name = "payment_reference")
    String paymentReference;
    
    @ManyToOne
    @JoinColumn(name = "vaccine_payment_id")
    VaccinePayment vaccinePayment;
    
    @Column(name = "notes", length = 500)
    String notes;
} 