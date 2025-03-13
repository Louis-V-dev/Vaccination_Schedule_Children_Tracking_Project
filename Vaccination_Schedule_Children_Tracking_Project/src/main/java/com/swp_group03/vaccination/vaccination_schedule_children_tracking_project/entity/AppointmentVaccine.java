package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Entity
@Table(name = "appointment_vaccines")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AppointmentVaccine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "appointment_vaccine_id")
    Long id;
    
    @ManyToOne
    @JoinColumn(name = "appointment_id", nullable = false)
    Appointment appointment;
    
    @ManyToOne
    @JoinColumn(name = "vaccine_id", nullable = false)
    Vaccine vaccine;
    
    @ManyToOne
    @JoinColumn(name = "dose_schedule_id")
    VaccineDoseSchedule doseSchedule;
    
    @Column(name = "dose_number")
    Integer doseNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "eligibility_status")
    VaccineEligibilityStatus eligibilityStatus;
    
    @Column(name = "eligibility_notes", length = 500)
    String eligibilityNotes;
    
    @Column(name = "reschedule_date")
    LocalDate rescheduleDate;
    
    @OneToOne
    @JoinColumn(name = "vaccine_record_id")
    VaccineRecord vaccineRecord;
    
    @Column(name = "is_administered")
    Boolean isAdministered = false;
} 