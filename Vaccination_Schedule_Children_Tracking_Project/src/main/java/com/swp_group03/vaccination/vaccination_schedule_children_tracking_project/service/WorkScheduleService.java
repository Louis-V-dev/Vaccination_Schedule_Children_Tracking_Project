package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Role;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.SchedulePattern;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Shift;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.WorkSchedule;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account.WorkScheduleRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.PatternShiftRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.SchedulePatternRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.UserRepo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.ShiftRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.WorkScheduleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class WorkScheduleService {
    private static final Logger logger = LoggerFactory.getLogger(WorkScheduleService.class);
    
    @Autowired
    private WorkScheduleRepository workScheduleRepository;
    
    @Autowired
    private UserRepo userRepo;
    
    @Autowired
    private ShiftService shiftService;
    
    @Autowired
    private SchedulePatternRepository patternRepository;
    
    @Autowired
    private PatternService patternService;
    
    public List<WorkSchedule> createSchedule(WorkScheduleRequest request) {
        try {
            logger.info("Creating schedule for employee: {}", request.getEmployeeId());
            
            Account employee = userRepo.findById(request.getEmployeeId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            
            List<WorkSchedule> schedules = new ArrayList<>();
            
            // Deactivate all existing patterns for this employee
            logger.info("Deactivating existing patterns for employee: {}", employee.getAccountId());
            List<SchedulePattern> existingPatterns = patternRepository.findByEmployeeAndActive(employee, true);
            for (SchedulePattern existingPattern : existingPatterns) {
                existingPattern.setActive(false);
                patternRepository.save(existingPattern);
            }
            
            // Create a new pattern for this schedule
            logger.info("Creating new pattern for employee: {}", employee.getAccountId());
            SchedulePattern pattern = SchedulePattern.builder()
                    .name("Pattern for " + employee.getFullName())
                    .employee(employee)
                    .creationDate(LocalDateTime.now())
                    .lastModified(LocalDateTime.now())
                    .active(true)
                    .build();
            
            SchedulePattern savedPattern = patternRepository.save(pattern);
            
            // Process each weekly schedule and apply it to all 4 weeks
            logger.info("Processing weekly schedules and applying to all 4 weeks");
            for (WorkScheduleRequest.WeeklySchedule weeklySchedule : request.getWeeklySchedules()) {
                for (WorkScheduleRequest.DailySchedule dailySchedule : weeklySchedule.getDailySchedules()) {
                    // Skip if no shift is assigned
                    if (dailySchedule.getShiftId() == null || dailySchedule.getShiftId().isEmpty()) {
                        continue;
                    }
                    
                    logger.debug("Processing shift {} for day {}", dailySchedule.getShiftId(), dailySchedule.getDayOfWeek());
                    Shift shift = shiftService.getShiftById(Long.valueOf(dailySchedule.getShiftId()));
                    
                    // Add to pattern for all 4 weeks
                    for (int weekNumber = 1; weekNumber <= 4; weekNumber++) {
                        patternService.addShiftToPattern(
                                savedPattern.getId(),
                                weekNumber,
                                dailySchedule.getDayOfWeek(),
                                shift.getId()
                        );
                    }
                }
            }
            
            // If applying from this week, create actual schedules
            if (Boolean.TRUE.equals(request.getApplyFromThisWeek())) {
                logger.info("Applying schedule from this week");
                LocalDate today = LocalDate.now();
                LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                
                // Always use 4 weeks for the initial pattern
                int numberOfWeeks = 4;
                LocalDate endOfPeriod = startOfWeek.plusWeeks(numberOfWeeks);
                
                // Delete existing schedules for this employee in the date range
                logger.info("Deleting existing schedules between {} and {}", startOfWeek, endOfPeriod);
                List<WorkSchedule> existingSchedules = workScheduleRepository.findByEmployeeAndWorkDateBetween(
                    employee, startOfWeek, endOfPeriod);
                if (!existingSchedules.isEmpty()) {
                    workScheduleRepository.deleteAll(existingSchedules);
                }
                
                // Generate new schedules
                logger.info("Generating new schedules for {} weeks", numberOfWeeks);
                schedules.addAll(patternService.generateSchedulesFromPattern(savedPattern, startOfWeek, numberOfWeeks));
            }
            
            logger.info("Successfully created {} schedules", schedules.size());
            return schedules;
            
        } catch (Exception e) {
            logger.error("Error creating schedule: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.SCHEDULE_CREATION_FAILED, e.getMessage());
        }
    }
    
    // This method is now handled by PatternService
    @Scheduled(cron = "0 0 0 * * MON") // Run at midnight every Monday
    public void cleanupOldSchedules() {
        // Delegate to PatternService
        LocalDate lastWeek = LocalDate.now().minusWeeks(1);
        List<WorkSchedule> oldSchedules = workScheduleRepository.findByWorkDateBefore(lastWeek);
        workScheduleRepository.deleteAll(oldSchedules);
    }
    
    // This method is now handled by PatternService
    @Scheduled(cron = "0 0 1 * * MON") // Run at 1 AM every Monday
    public void extendSchedules() {
        // Delegate to PatternService's extendSchedules method
        patternService.extendSchedules();
    }
    
    public List<Account> findEmployeesWithSameRoleAndShift(LocalDate date, Long shiftId, Set<Role> roles) {
        return userRepo.findByRolesIn(roles);
    }
    
    public List<Account> getEmployeesByRole(String role_Name) {
        return userRepo.findByRolesRole_Name(role_Name);
    }
    
    public List<WorkSchedule> getSchedulesByDateRange(LocalDate startDate, LocalDate endDate) {
        return workScheduleRepository.findByWorkDateBetween(startDate, endDate);
    }
    
    public List<WorkSchedule> getSchedulesByEmployeeAndDateRange(String employeeId, LocalDate startDate, LocalDate endDate) {
        return workScheduleRepository.findByEmployeeAccountIdAndWorkDateBetween(employeeId, startDate, endDate);
    }
    
    public boolean canRequestShiftChange(WorkSchedule schedule) {
        LocalDate today = LocalDate.now();
        return schedule.getWorkDate().isAfter(today.plusDays(6));
    }
} 