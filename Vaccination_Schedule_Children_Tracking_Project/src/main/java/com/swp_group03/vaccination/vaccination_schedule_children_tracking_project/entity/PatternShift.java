package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "pattern_shifts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PatternShift {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pattern_shift_id")
    Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pattern_id")
    SchedulePattern pattern;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "shift_id")
    Shift shift;
    
    @Column(name = "week_number")
    Integer weekNumber; // 1-4
    
    @Column(name = "day_of_week")
    Integer dayOfWeek; // 1-7 for Monday-Sunday
} 