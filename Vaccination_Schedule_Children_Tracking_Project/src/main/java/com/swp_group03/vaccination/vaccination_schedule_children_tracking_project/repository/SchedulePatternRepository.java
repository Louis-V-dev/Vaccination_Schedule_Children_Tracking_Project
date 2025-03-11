package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.SchedulePattern;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SchedulePatternRepository extends JpaRepository<SchedulePattern, Long> {
    List<SchedulePattern> findByEmployee(Account employee);
    List<SchedulePattern> findByEmployeeAndActive(Account employee, boolean active);
    List<SchedulePattern> findByActive(boolean active);
} 