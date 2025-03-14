package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.HealthRecord;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccinationEligibility;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.HealthRecordRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.HealthRecordResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.UserRepo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.HealthRecordService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/health-records")
@CrossOrigin("*")
public class HealthRecordController {

    @Autowired
    private HealthRecordService healthRecordService;
    
    @Autowired
    private UserRepo userRepo;
    
    /**
     * Create a new health record
     * @param request The health record request
     * @param authentication Authentication object
     * @return The created health record response
     */
    @PostMapping
    @PreAuthorize("hasRole('ROLE_DOCTOR')")
    public ResponseEntity<HealthRecordResponse> createHealthRecord(
            @RequestBody @Valid HealthRecordRequest request,
            Authentication authentication) {
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Account doctor = userRepo.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Doctor not found with username: " + userDetails.getUsername()));
        
        HealthRecord healthRecord = healthRecordService.createHealthRecord(request, doctor);
        return new ResponseEntity<>(healthRecordService.mapToResponse(healthRecord), HttpStatus.CREATED);
    }
    
    /**
     * Update an existing health record
     * @param id The ID of the health record to update
     * @param request The updated health record data
     * @return The updated health record response
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_DOCTOR')")
    public ResponseEntity<HealthRecordResponse> updateHealthRecord(
            @PathVariable Long id,
            @RequestBody @Valid HealthRecordRequest request) {
        
        HealthRecord healthRecord = healthRecordService.updateHealthRecord(id, request);
        return ResponseEntity.ok(healthRecordService.mapToResponse(healthRecord));
    }
    
    /**
     * Get a health record by ID
     * @param id The ID of the health record
     * @return The health record response
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_PARENT')")
    public ResponseEntity<HealthRecordResponse> getHealthRecordById(@PathVariable Long id) {
        HealthRecord healthRecord = healthRecordService.getHealthRecordById(id);
        return ResponseEntity.ok(healthRecordService.mapToResponse(healthRecord));
    }
    
    /**
     * Get health records for a specific child
     * @param childId The ID of the child
     * @param page The page number (optional, defaults to 0)
     * @param size The page size (optional, defaults to 10)
     * @return Page of health record responses
     */
    @GetMapping("/child/{childId}")
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_PARENT')")
    public ResponseEntity<Page<HealthRecordResponse>> getHealthRecordsByChildId(
            @PathVariable String childId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Page<HealthRecord> records = healthRecordService.getHealthRecordsByChildId(childId, PageRequest.of(page, size));
        return ResponseEntity.ok(healthRecordService.mapToResponsePage(records));
    }
    
    /**
     * Get a health record for a specific appointment
     * @param appointmentId The ID of the appointment
     * @return The health record response
     */
    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('ROLE_DOCTOR', 'ROLE_PARENT')")
    public ResponseEntity<HealthRecordResponse> getHealthRecordByAppointmentId(@PathVariable Long appointmentId) {
        HealthRecord healthRecord = healthRecordService.getHealthRecordByAppointmentId(appointmentId);
        return ResponseEntity.ok(healthRecordService.mapToResponse(healthRecord));
    }
    
    /**
     * Search health records based on multiple criteria
     * @param childId Optional child ID
     * @param doctorId Optional doctor ID
     * @param eligibility Optional eligibility status
     * @param startDate Optional start date for the search range
     * @param endDate Optional end date for the search range
     * @return List of matching health record responses
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('ROLE_DOCTOR')")
    public ResponseEntity<List<HealthRecordResponse>> searchHealthRecords(
            @RequestParam(required = false) String childId,
            @RequestParam(required = false) String doctorId,
            @RequestParam(required = false) VaccinationEligibility eligibility,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        List<HealthRecord> records = healthRecordService.searchHealthRecords(
                childId, doctorId, eligibility, startDate, endDate);
        return ResponseEntity.ok(healthRecordService.mapToResponseList(records));
    }
    
    /**
     * Get count of health records by eligibility status
     * @return Map of eligibility status to count
     */
    @GetMapping("/stats/eligibility")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Map<VaccinationEligibility, Long>> getEligibilityStats() {
        List<HealthRecord> allRecords = healthRecordService.searchHealthRecords(null, null, null, null, null);
        
        Map<VaccinationEligibility, Long> stats = allRecords.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        HealthRecord::getEligibility,
                        java.util.stream.Collectors.counting()
                ));
        
        return ResponseEntity.ok(stats);
    }
} 