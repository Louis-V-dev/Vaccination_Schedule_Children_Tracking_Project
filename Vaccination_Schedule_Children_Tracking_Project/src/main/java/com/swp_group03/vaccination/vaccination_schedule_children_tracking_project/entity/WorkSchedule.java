package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "work_schedules")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WorkSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id")
    Account employee;

    @ManyToOne
    @JoinColumn(name = "shift_id")
    Shift shift;

    @Column(name = "work_date")
    LocalDate workDate;

    @Column(name = "week_number")
    Integer weekNumber;

    @Column(name = "day_of_week")
    Integer dayOfWeek;
    
    @ManyToOne
    @JoinColumn(name = "source_pattern_id")
    SchedulePattern sourcePattern;
    
    @Column(name = "generation_date")
    LocalDateTime generationDate;
    
    // New fields for vaccination appointment management
    @Column(name = "is_available")
    Boolean isAvailable = true;
    
    @Column(name = "booked_appointments")
    Integer bookedAppointments = 0;
    
    @Column(name = "max_appointments_per_day")
    Integer maxAppointmentsPerDay = 10;
} 