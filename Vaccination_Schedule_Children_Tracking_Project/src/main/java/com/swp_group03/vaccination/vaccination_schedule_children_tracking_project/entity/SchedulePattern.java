package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "schedule_patterns")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SchedulePattern {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pattern_id")
    Long id;
    
    @Column(name = "pattern_name")
    String name;
    
    @ManyToOne
    @JoinColumn(name = "employee_id")
    Account employee;
    
    @Column(name = "creation_date")
    LocalDateTime creationDate;
    
    @Column(name = "last_modified")
    LocalDateTime lastModified;
    
    @Column(name = "is_active")
    boolean active;
    
    @OneToMany(mappedBy = "pattern", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<PatternShift> shifts = new ArrayList<>();
    
    // Helper methods
    public void addShift(PatternShift shift) {
        shifts.add(shift);
        shift.setPattern(this);
    }
    
    public void removeShift(PatternShift shift) {
        shifts.remove(shift);
        shift.setPattern(null);
    }
    
    public List<PatternShift> getShiftsForWeek(int weekNumber) {
        return shifts.stream()
                .filter(shift -> shift.getWeekNumber() == weekNumber)
                .collect(Collectors.toList());
    }
} 