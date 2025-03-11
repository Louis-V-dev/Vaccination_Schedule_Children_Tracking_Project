package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PatternShift;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.SchedulePattern;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatternShiftRepository extends JpaRepository<PatternShift, Long> {
    List<PatternShift> findByPattern(SchedulePattern pattern);
    List<PatternShift> findByPatternAndWeekNumber(SchedulePattern pattern, int weekNumber);
    List<PatternShift> findByPatternAndWeekNumberAndDayOfWeek(SchedulePattern pattern, int weekNumber, int dayOfWeek);
} 