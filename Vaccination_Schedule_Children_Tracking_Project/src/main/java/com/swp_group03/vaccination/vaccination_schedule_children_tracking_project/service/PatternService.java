package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.schedule.PatternRequestDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.schedule.PatternShiftDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.PatternShiftRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.SchedulePatternRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.UserRepo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.WorkScheduleRepository;
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

@Service
@Transactional
public class PatternService {
    @Autowired
    private SchedulePatternRepository patternRepository;
    
    @Autowired
    private PatternShiftRepository patternShiftRepository;
    
    @Autowired
    private WorkScheduleRepository workScheduleRepository;
    
    @Autowired
    private UserRepo userRepo;
    
    @Autowired
    private ShiftService shiftService;
    
    public List<SchedulePattern> getAllPatterns() {
        return patternRepository.findAll();
    }
    
    public SchedulePattern getPatternById(Long id) {
        return patternRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PATTERN_NOT_FOUND));
    }
    
    public List<SchedulePattern> getPatternsByEmployee(String employeeId) {
        Account employee = userRepo.findById(employeeId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return patternRepository.findByEmployee(employee);
    }
    
    public SchedulePattern createPattern(PatternRequestDTO requestDTO) {
        Account employee = userRepo.findById(requestDTO.getEmployeeId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        // Create new pattern
        SchedulePattern pattern = SchedulePattern.builder()
                .name(requestDTO.getName())
                .employee(employee)
                .creationDate(LocalDateTime.now())
                .lastModified(LocalDateTime.now())
                .active(true)
                .build();
        
        SchedulePattern savedPattern = patternRepository.save(pattern);
        
        // Add shifts to pattern
        for (PatternShiftDTO shiftDTO : requestDTO.getShifts()) {
            Shift shift = shiftService.getShiftById(shiftDTO.getShiftId());
            
            PatternShift patternShift = PatternShift.builder()
                    .pattern(savedPattern)
                    .shift(shift)
                    .weekNumber(shiftDTO.getWeekNumber())
                    .dayOfWeek(shiftDTO.getDayOfWeek())
                    .build();
            
            patternShiftRepository.save(patternShift);
        }
        
        return patternRepository.findById(savedPattern.getId()).orElseThrow();
    }
    
    public SchedulePattern updatePattern(Long patternId, PatternRequestDTO requestDTO) {
        SchedulePattern pattern = patternRepository.findById(patternId)
                .orElseThrow(() -> new AppException(ErrorCode.PATTERN_NOT_FOUND));
        
        pattern.setName(requestDTO.getName());
        pattern.setLastModified(LocalDateTime.now());
        
        // Clear existing shifts
        List<PatternShift> existingShifts = patternShiftRepository.findByPattern(pattern);
        patternShiftRepository.deleteAll(existingShifts);
        
        // Add new shifts
        for (PatternShiftDTO shiftDTO : requestDTO.getShifts()) {
            Shift shift = shiftService.getShiftById(shiftDTO.getShiftId());
            
            PatternShift patternShift = PatternShift.builder()
                    .pattern(pattern)
                    .shift(shift)
                    .weekNumber(shiftDTO.getWeekNumber())
                    .dayOfWeek(shiftDTO.getDayOfWeek())
                    .build();
            
            patternShiftRepository.save(patternShift);
        }
        
        // Regenerate schedules if requested
        if (requestDTO.isRegenerateSchedules()) {
            regenerateSchedules(pattern.getId(), LocalDate.now());
        }
        
        return patternRepository.findById(patternId).orElseThrow();
    }
    
    public void regenerateSchedules(Long patternId, LocalDate startDate) {
        SchedulePattern pattern = patternRepository.findById(patternId)
                .orElseThrow(() -> new AppException(ErrorCode.PATTERN_NOT_FOUND));
        
        // Delete future schedules from this pattern
        List<WorkSchedule> existingSchedules = workScheduleRepository.findBySourcePatternAndWorkDateGreaterThanEqual(
                pattern, startDate);
        workScheduleRepository.deleteAll(existingSchedules);
        
        // Generate new schedules
        generateSchedulesFromPattern(pattern, startDate, 4);
    }
    
    @Transactional
    public void deletePattern(Long patternId) {
        SchedulePattern pattern = patternRepository.findById(patternId)
                .orElseThrow(() -> new AppException(ErrorCode.PATTERN_NOT_FOUND));

        // Check if pattern is being used in future schedules
        List<WorkSchedule> futureSchedules = workScheduleRepository
                .findBySourcePatternAndWorkDateGreaterThanEqual(pattern, LocalDate.now());
        
        if (!futureSchedules.isEmpty()) {
            // Delete future schedules first
            workScheduleRepository.deleteAll(futureSchedules);
        }

        // Delete pattern shifts
        List<PatternShift> patternShifts = patternShiftRepository.findByPattern(pattern);
        patternShiftRepository.deleteAll(patternShifts);

        // Finally delete the pattern
        patternRepository.delete(pattern);
    }
    
    public List<WorkSchedule> generateSchedulesFromPattern(SchedulePattern pattern, LocalDate startDate, int weeks) {
        List<WorkSchedule> generatedSchedules = new ArrayList<>();
        
        // Adjust to start from Monday of the week
        LocalDate currentMonday = startDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        
        for (int week = 0; week < weeks; week++) {
            // Get the pattern week (1-4)
            int patternWeek = (week % 4) + 1;
            
            // Get shifts for this pattern week
            List<PatternShift> weekShifts = patternShiftRepository.findByPatternAndWeekNumber(pattern, patternWeek);
            
            for (PatternShift patternShift : weekShifts) {
                // Calculate actual date
                LocalDate shiftDate = currentMonday.plusDays(patternShift.getDayOfWeek() - 1).plusWeeks(week);
                
                WorkSchedule schedule = WorkSchedule.builder()
                        .employee(pattern.getEmployee())
                        .shift(patternShift.getShift())
                        .workDate(shiftDate)
                        .weekNumber(patternWeek)
                        .dayOfWeek(patternShift.getDayOfWeek())
                        .sourcePattern(pattern)
                        .generationDate(LocalDateTime.now())
                        .build();
                
                generatedSchedules.add(workScheduleRepository.save(schedule));
            }
        }
        
        return generatedSchedules;
    }
    
    @Scheduled(cron = "0 0 1 * * MON") // Run at 1 AM every Monday
    public void extendSchedules() {
        LocalDate today = LocalDate.now();
        LocalDate lastWeekMonday = today.minusWeeks(1).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate nextExtensionDate = today.plusWeeks(3).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        
        // Get all active patterns
        List<SchedulePattern> activePatterns = patternRepository.findByActive(true);
        
        for (SchedulePattern pattern : activePatterns) {
            // Generate one more week of schedules
            generateSchedulesFromPattern(pattern, nextExtensionDate, 1);
        }
        
        // Clean up old schedules
        List<WorkSchedule> oldSchedules = workScheduleRepository.findByWorkDateBefore(lastWeekMonday);
        workScheduleRepository.deleteAll(oldSchedules);
    }
    
    public void addShiftToPattern(Long patternId, int weekNumber, int dayOfWeek, Long shiftId) {
        SchedulePattern pattern = patternRepository.findById(patternId)
                .orElseThrow(() -> new AppException(ErrorCode.PATTERN_NOT_FOUND));
        
        Shift shift = shiftService.getShiftById(shiftId);
        
        // Check if there's already a shift for this day/week
        List<PatternShift> existingShifts = patternShiftRepository.findByPatternAndWeekNumberAndDayOfWeek(
                pattern, weekNumber, dayOfWeek);
        
        // Remove existing shifts for this day/week
        if (!existingShifts.isEmpty()) {
            patternShiftRepository.deleteAll(existingShifts);
        }
        
        // Add new shift
        PatternShift patternShift = PatternShift.builder()
                .pattern(pattern)
                .shift(shift)
                .weekNumber(weekNumber)
                .dayOfWeek(dayOfWeek)
                .build();
        
        patternShiftRepository.save(patternShift);
        
        // Update last modified date
        pattern.setLastModified(LocalDateTime.now());
        patternRepository.save(pattern);
    }
    
    public void deactivatePatterns(Account employee) {
        List<SchedulePattern> existingPatterns = patternRepository.findByEmployeeAndActive(employee, true);
        for (SchedulePattern pattern : existingPatterns) {
            pattern.setActive(false);
            pattern.setLastModified(LocalDateTime.now());
            patternRepository.save(pattern);
        }
    }
} 