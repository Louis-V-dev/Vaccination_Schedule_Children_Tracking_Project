package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.SchedulePattern;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.WorkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, String> {
    List<WorkSchedule> findByWorkDateBetween(LocalDate startDate, LocalDate endDate);
    
    List<WorkSchedule> findByEmployeeAccountIdAndWorkDateBetween(String employeeId, LocalDate startDate, LocalDate endDate);
    
    List<WorkSchedule> findByWorkDateBefore(LocalDate date);
    
    List<WorkSchedule> findBySourcePatternIsNotNullAndWeekNumber(int weekNumber);
    
    List<WorkSchedule> findByEmployee(Account employee);
    
    List<WorkSchedule> findByEmployeeAndWorkDateBetween(Account employee, LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT ws FROM WorkSchedule ws WHERE ws.sourcePattern IS NOT NULL AND ws.weekNumber = ?1")
    List<WorkSchedule> findPatternsByWeekNumber(Integer weekNumber);
    
    @Query("SELECT ws FROM WorkSchedule ws WHERE ws.workDate < ?1")
    List<WorkSchedule> findOldSchedules(LocalDate date);
    
    boolean existsByEmployeeAndWorkDate(Account employee, LocalDate workDate);
    
    List<WorkSchedule> findByWorkDateAndShiftId(LocalDate workDate, Long shiftId);
    
    @Query("SELECT ws FROM WorkSchedule ws WHERE ws.workDate = ?1 AND ws.shift.id = ?2 AND ws.employee.accountId <> ?3")
    List<WorkSchedule> findPotentialShiftSwaps(LocalDate workDate, Long shiftId, String excludeEmployeeId);
    
    // New methods for pattern management
    List<WorkSchedule> findBySourcePattern(SchedulePattern pattern);
    
    List<WorkSchedule> findBySourcePatternAndWorkDateGreaterThanEqual(SchedulePattern pattern, LocalDate date);
} 