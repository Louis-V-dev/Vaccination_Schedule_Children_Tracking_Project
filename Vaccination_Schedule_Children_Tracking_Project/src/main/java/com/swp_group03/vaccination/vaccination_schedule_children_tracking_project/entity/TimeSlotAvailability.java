package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Entity
@Table(name = "time_slot_availability")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TimeSlotAvailability {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "availability_id")
    Long id;
    
    @ManyToOne
    @JoinColumn(name = "time_slot_id", nullable = false)
    TimeSlot timeSlot;
    
    @Column(name = "date", nullable = false)
    LocalDate date;
    
    @Column(name = "max_appointments", nullable = false)
    Integer maxAppointments = 5;
    
    @Column(name = "booked_appointments")
    Integer bookedAppointments = 0;
    
    @Column(name = "available_appointments")
    Integer availableAppointments = 5;
    
    @Column(name = "available_appointment_units", nullable = false)
    Integer availableAppointmentUnits = 10;
    
    @Column(name = "booked_appointment_units")
    Integer bookedAppointmentUnits = 0;
} 