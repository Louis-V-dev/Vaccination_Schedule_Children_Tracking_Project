package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "work_schedules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WorkSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long id;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "workSchedules", "roles"})
    private Account employee;

    @ManyToOne
    @JoinColumn(name = "shift_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "workSchedules"})
    private Shift shift;

    @ManyToOne
    @JoinColumn(name = "source_pattern_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "workSchedules"})
    private SchedulePattern sourcePattern;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "day_of_week")
    private Integer dayOfWeek;

    @Column(name = "week_number")
    private Integer weekNumber;

    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable;

    @Column(name = "booked_appointments")
    private Integer bookedAppointments;

    @Column(name = "max_appointments_per_day")
    private Integer maxAppointmentsPerDay;

    @Column(name = "generation_date")
    private LocalDateTime generationDate;

    @OneToMany(mappedBy = "workSchedule")
    @JsonIgnoreProperties("workSchedule")
    private List<Appointment> appointments;
} 