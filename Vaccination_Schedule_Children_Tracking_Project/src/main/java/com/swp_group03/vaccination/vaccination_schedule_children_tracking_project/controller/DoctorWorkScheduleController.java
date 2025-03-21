package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.WorkSchedule;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.WorkScheduleRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class DoctorWorkScheduleController {
    private final WorkScheduleRepository workScheduleRepository;
    private final AppointmentService appointmentService;

    /**
     * Doctor-first approach: Get available dates that a specific doctor works
     */
    @GetMapping("/api/doctors/{doctorId}/available-dates")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getDoctorAvailableDates(
            @PathVariable String doctorId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        try {
            // Default to current date and next 30 days if not specified
            if (startDate == null) {
                startDate = LocalDate.now();
            }
            if (endDate == null) {
                endDate = startDate.plusDays(30);
            }
            
            // Get all dates where this doctor has a work schedule
            List<LocalDate> availableDates = workScheduleRepository
                .findWorkDatesByEmployeeIdAndDateRange(doctorId, startDate, endDate);
            
            Map<String, Object> response = new HashMap<>();
            response.put("doctorId", doctorId);
            response.put("availableDates", availableDates);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching available dates for doctor {}", doctorId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Doctor-first approach: Get all schedules for a doctor in a date range
     */
    @GetMapping("/api/work-schedules/doctor/{doctorId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getDoctorSchedules(
            @PathVariable String doctorId,
            @RequestParam LocalDate startDate,
            @RequestParam LocalDate endDate) {
        try {
            List<WorkSchedule> schedules = workScheduleRepository
                .findByEmployeeAccountIdAndWorkDateBetween(doctorId, startDate, endDate);
            
            // Process schedules to get time slots
            Map<LocalDate, List<Map<String, Object>>> availableDateSlots = new HashMap<>();
            
            for (WorkSchedule schedule : schedules) {
                LocalDate date = schedule.getWorkDate();
                
                // Get available hourly time slots based on shift
                List<String> hourlySlots = getTimeSlotsBasedOnShift(schedule);
                
                if (!hourlySlots.isEmpty()) {
                    if (!availableDateSlots.containsKey(date)) {
                        availableDateSlots.put(date, new ArrayList<>());
                    }
                    
                    for (String slot : hourlySlots) {
                        Map<String, Object> slotDetails = new HashMap<>();
                        slotDetails.put("timeSlot", slot);
                        slotDetails.put("formattedTimeSlot", formatTimeSlot(slot));
                        slotDetails.put("availableAppointments", 
                            5 - appointmentService.countActiveAppointmentsInTimeSlot(schedule, slot));
                        availableDateSlots.get(date).add(slotDetails);
                    }
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("doctorId", doctorId);
            response.put("schedules", availableDateSlots);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching schedules for doctor {}", doctorId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Doctor-first approach: Get time slots for a specific doctor on a specific date
     */
    @GetMapping("/api/doctors/{doctorId}/time-slots")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getDoctorTimeSlots(
            @PathVariable String doctorId,
            @RequestParam LocalDate date) {
        try {
            // Get the doctor's schedule for this date
            WorkSchedule schedule = workScheduleRepository
                .findByEmployeeIdAndWorkDate(doctorId, date)
                .orElse(null);
            
            List<Map<String, Object>> timeSlots = new ArrayList<>();
            
            if (schedule != null) {
                // Get available time slots based on the doctor's shift
                List<String> availableSlots = getTimeSlotsBasedOnShift(schedule);
                
                for (String slot : availableSlots) {
                    int availableAppointments = 5 - appointmentService
                        .countActiveAppointmentsInTimeSlot(schedule, slot);
                    
                    Map<String, Object> slotDetails = new HashMap<>();
                    slotDetails.put("id", slot);
                    slotDetails.put("time", formatTimeSlot(slot));
                    slotDetails.put("available", availableAppointments > 0);
                    slotDetails.put("availableCount", availableAppointments);
                    
                    timeSlots.add(slotDetails);
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("doctorId", doctorId);
            response.put("date", date.toString());
            response.put("timeSlots", timeSlots);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching time slots for doctor {} on date {}", doctorId, date, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Date-first approach: Get all available time slots for a given date - consolidated view from all doctors
     */
    @GetMapping("/api/schedules/available-slots")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getAvailableSlots(
            @RequestParam LocalDate date) {
        try {
            // Get all work schedules for the specified date
            List<WorkSchedule> schedules = workScheduleRepository
                .findByWorkDate(date);
            
            // Collect all unique time slots from all doctors' schedules
            Set<String> allUniqueTimeSlots = new HashSet<>();
            Map<String, Set<String>> timeSlotToDoctors = new HashMap<>();
            Map<String, Map<String, Object>> consolidatedTimeSlots = new HashMap<>();
            
            // Process each schedule to extract time slots and associate with doctors
            for (WorkSchedule schedule : schedules) {
                String doctorId = schedule.getEmployee() != null ? 
                    schedule.getEmployee().getAccountId() : null;
                if (doctorId == null) continue;
                
                // Get doctor name for reference
                String doctorName = schedule.getEmployee().getFirstName() != null && 
                                   schedule.getEmployee().getLastName() != null ?
                    schedule.getEmployee().getFirstName() + " " + schedule.getEmployee().getLastName() : "";
                String doctorKey = doctorId + (doctorName.isEmpty() ? "" : " - " + doctorName);
                
                // Get time slots for this doctor based on shift
                List<String> doctorSlots = getTimeSlotsBasedOnShift(schedule);
                
                log.info("Doctor: {}, Shift: {}, Available slots: {}", 
                    doctorKey, 
                    schedule.getShift() != null ? schedule.getShift().getName() : "UNKNOWN",
                    doctorSlots);
                
                // Add to the combined set of slots and map slots to doctors
                for (String slot : doctorSlots) {
                    allUniqueTimeSlots.add(slot);
                    
                    if (!timeSlotToDoctors.containsKey(slot)) {
                        timeSlotToDoctors.put(slot, new HashSet<>());
                    }
                    timeSlotToDoctors.get(slot).add(doctorKey);
                    
                    // Track availability for this slot
                    if (!consolidatedTimeSlots.containsKey(slot)) {
                        Map<String, Object> slotDetails = new HashMap<>();
                        slotDetails.put("id", slot);
                        slotDetails.put("time", formatTimeSlot(slot));
                        slotDetails.put("available", true);
                        slotDetails.put("availableCount", 5); // Start with max count
                        consolidatedTimeSlots.put(slot, slotDetails);
                    }
                    
                    // Update availability count (maximum of all doctors, capped at 5)
                    int currentCount = (int) consolidatedTimeSlots.get(slot).get("availableCount");
                    int doctorCount = 5 - appointmentService.countActiveAppointmentsInTimeSlot(schedule, slot);
                    int finalCount = Math.max(currentCount, doctorCount);
                    consolidatedTimeSlots.get(slot).put("availableCount", finalCount);
                }
            }
            
            // Sort time slots for consistent display
            List<String> sortedTimeSlots = new ArrayList<>(allUniqueTimeSlots);
            sortedTimeSlots.sort((a, b) -> {
                int timeA = Integer.parseInt(a.split("-")[0]);
                int timeB = Integer.parseInt(b.split("-")[0]);
                return Integer.compare(timeA, timeB);
            });
            
            // Build the final response with consolidated slots
            List<Map<String, Object>> timeSlots = new ArrayList<>();
            for (String slot : sortedTimeSlots) {
                Map<String, Object> slotDetails = consolidatedTimeSlots.get(slot);
                slotDetails.put("doctors", new ArrayList<>(timeSlotToDoctors.get(slot)));
                timeSlots.add(slotDetails);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("date", date.toString());
            response.put("timeSlots", timeSlots);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching available slots", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    /**
     * Date-first approach: Get doctors available for a specific date and time slot
     */
    @GetMapping("/api/schedules/available-doctors")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getAvailableDoctorsForTimeSlot(
            @RequestParam LocalDate date,
            @RequestParam String timeSlot) {
        try {
            List<WorkSchedule> schedules = workScheduleRepository
                .findByWorkDate(date);
            
            List<Map<String, Object>> availableDoctors = new ArrayList<>();
            
            for (WorkSchedule schedule : schedules) {
                if (schedule.getEmployee() == null) continue;
                
                // Get available time slots for this doctor
                List<String> doctorSlots = getTimeSlotsBasedOnShift(schedule);
                
                // Check if the requested time slot is available for this doctor
                if (doctorSlots.contains(timeSlot)) {
                    int availableAppointments = 5 - appointmentService
                        .countActiveAppointmentsInTimeSlot(schedule, timeSlot);
                    
                    if (availableAppointments > 0) {
                        Map<String, Object> doctorInfo = new HashMap<>();
                        doctorInfo.put("id", schedule.getEmployee().getAccountId());
                        doctorInfo.put("name", 
                            (schedule.getEmployee().getFirstName() != null ? schedule.getEmployee().getFirstName() : "") + 
                            " " + 
                            (schedule.getEmployee().getLastName() != null ? schedule.getEmployee().getLastName() : ""));
                        doctorInfo.put("availableAppointments", availableAppointments);
                        availableDoctors.add(doctorInfo);
                    }
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("date", date.toString());
            response.put("timeSlot", timeSlot);
            response.put("formattedTimeSlot", formatTimeSlot(timeSlot));
            response.put("doctors", availableDoctors);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching available doctors for time slot", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    private List<String> getAvailableHourlyTimeSlots(WorkSchedule schedule) {
        List<String> allHourlySlots = Arrays.asList(
            "8-9", "9-10", "10-11", "11-12", "13-14", "14-15", "15-16", "16-17"
        );
        
        return allHourlySlots.stream()
            .filter(slot -> {
                int currentAppointments = appointmentService
                    .countActiveAppointmentsInTimeSlot(schedule, slot);
                return currentAppointments < 5; // Maximum 5 appointments per slot
            })
            .collect(Collectors.toList());
    }
    
    private List<String> getTimeSlotsBasedOnShift(WorkSchedule schedule) {
        // Get shift information
        String shiftName = "UNKNOWN";
        if (schedule.getShift() != null) {
            shiftName = schedule.getShift().getName().toUpperCase();
            log.debug("Shift name from database: {}", shiftName);
        }
        
        List<String> morningSlots = Arrays.asList("8-9", "9-10", "10-11", "11-12");
        List<String> afternoonSlots = Arrays.asList("13-14", "14-15", "15-16", "16-17");
        List<String> availableSlots;
        
        if (shiftName.contains("MORNING")) {
            log.debug("Using morning slots for shift: {}", shiftName);
            availableSlots = new ArrayList<>(morningSlots);
        } else if (shiftName.contains("AFTERNOON")) {
            log.debug("Using afternoon slots for shift: {}", shiftName);
            availableSlots = new ArrayList<>(afternoonSlots);
        } else {
            // FULL_TIME or any other
            log.debug("Using full day slots for shift: {}", shiftName);
            availableSlots = new ArrayList<>();
            availableSlots.addAll(morningSlots);
            availableSlots.addAll(afternoonSlots);
        }
        
        // Filter slots that still have availability
        return availableSlots.stream()
            .filter(slot -> {
                int currentAppointments = appointmentService
                    .countActiveAppointmentsInTimeSlot(schedule, slot);
                return currentAppointments < 5; // Maximum 5 appointments per slot
            })
            .collect(Collectors.toList());
    }
    
    /**
     * Format a time slot like "8-9" to "08:00-09:00"
     */
    private String formatTimeSlot(String timeSlot) {
        try {
            String[] parts = timeSlot.split("-");
            int startHour = Integer.parseInt(parts[0]);
            int endHour = Integer.parseInt(parts[1]);
            
            return String.format("%02d:00-%02d:00", startHour, endHour);
        } catch (Exception e) {
            return timeSlot; // Return as-is if there's any parsing issue
        }
    }
} 