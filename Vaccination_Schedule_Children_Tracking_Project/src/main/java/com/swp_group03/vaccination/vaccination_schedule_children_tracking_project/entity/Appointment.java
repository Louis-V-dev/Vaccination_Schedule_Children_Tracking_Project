package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "appointments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "appointment_id")
    Long id;
    
    @ManyToOne
    @JoinColumn(name = "child_id", nullable = false)
    Child child;
    
    @ManyToOne
    @JoinColumn(name = "guardian_id", nullable = false)
    Account guardian;
    
    @ManyToOne
    @JoinColumn(name = "time_slot_id", nullable = false)
    TimeSlot timeSlot;
    
    @Column(name = "appointment_date", nullable = false)
    LocalDate appointmentDate;
    
    @ManyToOne
    @JoinColumn(name = "selected_doctor_id")
    Account doctor;
    
    @ManyToOne
    @JoinColumn(name = "assigned_doctor_id")
    Account assignedDoctor;
    
    @ManyToOne
    @JoinColumn(name = "assigned_nurse_id")
    Account assignedNurse;
    
    @ManyToOne
    @JoinColumn(name = "assigned_staff_id")
    Account assignedStaff;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    AppointmentStatus status = AppointmentStatus.BOOKED;
    
    @ManyToOne
    @JoinColumn(name = "payment_id")
    Payment payment;
    
    @OneToMany(mappedBy = "appointment", cascade = CascadeType.ALL, orphanRemoval = true)
    List<AppointmentVaccine> appointmentVaccines = new ArrayList<>();
    
    @Column(name = "total_vaccines")
    Integer totalVaccines = 0;
    
    @Column(name = "is_multi_vaccine_appointment")
    Boolean isMultiVaccineAppointment = false;
    
    @Column(name = "appointment_units")
    Integer appointmentUnits = 1;
    
    @Column(name = "all_vaccines_eligible")
    Boolean allVaccinesEligible;
    
    @Column(name = "notes", length = 500)
    String notes;
    
    @Column(name = "created_at")
    LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
    
    @Column(name = "status_updated_at")
    LocalDateTime statusUpdatedAt;
    
    @OneToOne(mappedBy = "appointment")
    HealthRecord healthRecord;
    
    @OneToOne(mappedBy = "appointment")
    VaccineAdministrationBatch administrationBatch;
    
    @OneToOne(mappedBy = "appointment")
    PostVaccinationMonitoring monitoring;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        statusUpdatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 