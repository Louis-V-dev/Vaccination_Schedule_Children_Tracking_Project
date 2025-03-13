package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "time_slots")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TimeSlot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "time_slot_id")
    Long id;
    
    @Column(name = "name", nullable = false)
    String name;
    
    @Column(name = "start_time", nullable = false)
    LocalTime startTime;
    
    @Column(name = "end_time", nullable = false)
    LocalTime endTime;
    
    @Column(name = "max_appointments", nullable = false)
    Integer maxAppointments = 5;
    
    @Column(name = "booked_appointments")
    Integer bookedAppointments = 0;
    
    @Column(name = "available_appointments")
    Integer availableAppointments = 5;
    
    @Column(name = "max_appointment_units", nullable = false)
    Integer maxAppointmentUnits = 10;
    
    @Column(name = "booked_appointment_units")
    Integer bookedAppointmentUnits = 0;
    
    @OneToMany(mappedBy = "timeSlot", cascade = CascadeType.ALL, orphanRemoval = true)
    List<TimeSlotAvailability> availabilityByDate = new ArrayList<>();
    
    @OneToMany(mappedBy = "timeSlot")
    List<Appointment> appointments = new ArrayList<>();
} 