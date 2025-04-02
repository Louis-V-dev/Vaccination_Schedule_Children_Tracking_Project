package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.vaccination.HealthRecordRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.AppointmentService;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.VaccinationService;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/doctor/vaccination")
@PreAuthorize("hasRole('DOCTOR')")
public class DoctorVaccinationController {

    private static final Logger log = LoggerFactory.getLogger(DoctorVaccinationController.class);
    
    private final AppointmentService appointmentService;
    private final VaccinationService vaccinationService;
    
    @Autowired
    public DoctorVaccinationController(AppointmentService appointmentService, VaccinationService vaccinationService) {
        this.appointmentService = appointmentService;
        this.vaccinationService = vaccinationService;
    }
    
    @GetMapping("/assigned-appointments")
    public ResponseEntity<ApiResponse> getAssignedAppointments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        try {
            // Get the current authenticated doctor
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String doctorId = authentication.getName();
            
            log.info("Retrieving appointments assigned to doctor ID: {}", doctorId);
            
            List<Appointment> appointments;
            
            // If date is provided, get appointments for that date
            if (date != null) {
                appointments = appointmentService.findByDoctorAndAppointmentDate(doctorId, date);
                log.info("Retrieved {} appointments for doctor {} on date: {}", 
                    appointments.size(), doctorId, date);
            } else {
                // Otherwise get all appointments assigned to this doctor
                appointments = appointmentService.findByDoctor(doctorId);
                log.info("Retrieved all {} appointments for doctor {}", appointments.size(), doctorId);
            }
            
            // Filter to only include appointments with WITH_DOCTOR status
            appointments = appointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.WITH_DOCTOR)
                .toList();
            
            log.info("Filtered to {} appointments with WITH_DOCTOR status", appointments.size());
            
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Appointments retrieved successfully")
                .result(appointments)
                .build());
            
        } catch (Exception e) {
            log.error("Error retrieving assigned appointments", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error retrieving assigned appointments: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @GetMapping("/today-appointments")
    public ResponseEntity<ApiResponse> getTodayAppointments() {
        try {
            // Get today's date
            LocalDate today = LocalDate.now();
            log.info("Retrieving today's appointments: {}", today);
            
            // Reuse the existing method with today's date
            return getAssignedAppointments(today);
            
        } catch (Exception e) {
            log.error("Error retrieving today's appointments", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error retrieving today's appointments: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @GetMapping("/appointments/{id}")
    public ResponseEntity<ApiResponse> getAppointmentDetails(@PathVariable Long id) {
        try {
            Appointment appointment = appointmentService.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            // Get the current authenticated doctor
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String doctorId = authentication.getName();
            
            // Verify that the appointment is assigned to this doctor
            if (appointment.getDoctor() == null || !appointment.getDoctor().getAccountId().equals(doctorId)) {
                log.warn("Doctor {} attempted to access appointment {} assigned to different doctor", 
                    doctorId, id);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.builder()
                        .code(403)
                        .message("You are not authorized to view this appointment")
                        .result(null)
                        .build());
            }
            
            log.info("Retrieved appointment details for ID: {}", id);
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Appointment details retrieved successfully")
                .result(appointment)
                .build());
            
        } catch (AppException e) {
            log.warn("Appointment not found: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.builder()
                    .code(e.getErrorCode().getCode())
                    .message(e.getMessage())
                    .result(null)
                    .build());
        } catch (Exception e) {
            log.error("Error retrieving appointment details for ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error retrieving appointment details: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @PostMapping("/create-health-record")
    public ResponseEntity<ApiResponse> createHealthRecord(@Valid @RequestBody HealthRecordRequest request) {
        try {
            log.info("Creating health record for appointment vaccine ID: {}", request.getAppointmentVaccineId());
            
            // Get the current authenticated doctor
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String doctorId = authentication.getName();
            
            // Create the health record
            HealthRecord healthRecord = vaccinationService.createHealthRecord(
                request.getAppointmentVaccineId(),
                doctorId,
                request.getPreVaccinationHealth(),
                request.getTemperature(),
                request.getWeight(),
                request.getHeight(),
                request.getBloodPressure(),
                request.getHeartRate(),
                request.getAllergies(),
                request.getCurrentMedications(),
                request.getDoctorNotes(),
                request.getVaccinationApproved(),
                request.getRejectionReason(),
                request.getNextAppointmentRecommendations()
            );
            
            // Update the status of the appointment vaccine based on approval
            AppointmentVaccine appointmentVaccine = healthRecord.getAppointmentVaccine();
            if (Boolean.TRUE.equals(request.getVaccinationApproved())) {
                appointmentVaccine.setStatus(VaccinationStatus.APPROVED);
                log.info("Vaccination approved for appointment vaccine ID: {}", request.getAppointmentVaccineId());
            } else {
                appointmentVaccine.setStatus(VaccinationStatus.REJECTED);
                log.info("Vaccination rejected for appointment vaccine ID: {}", request.getAppointmentVaccineId());
            }
            
            // Check if all appointment vaccines have been processed
            Appointment appointment = appointmentVaccine.getAppointment();
            boolean allProcessed = appointment.getAppointmentVaccines().stream()
                .allMatch(av -> av.getStatusEnum() == VaccinationStatus.APPROVED || 
                               av.getStatusEnum() == VaccinationStatus.REJECTED);
            
            // If all have been processed, update the appointment status
            if (allProcessed) {
                boolean anyApproved = appointment.getAppointmentVaccines().stream()
                    .anyMatch(av -> av.getStatusEnum() == VaccinationStatus.APPROVED);
                
                if (anyApproved) {
                    // If any vaccines were approved, move to nurse
                    appointment.setStatus(AppointmentStatus.WITH_NURSE);
                    log.info("All vaccines processed. Moving appointment {} to WITH_NURSE status", appointment.getId());
                } else {
                    // If all were rejected, complete the appointment
                    appointment.setStatus(AppointmentStatus.COMPLETED);
                    log.info("All vaccines rejected. Moving appointment {} to COMPLETED status", appointment.getId());
                }
                
                appointmentService.saveAppointment(appointment);
            }
            
            log.info("Health record created successfully for appointment vaccine ID: {}", request.getAppointmentVaccineId());
            
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Health record created successfully")
                .result(healthRecord)
                .build());
            
        } catch (AppException e) {
            log.warn("Error creating health record: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.builder()
                    .code(e.getErrorCode().getCode())
                    .message(e.getMessage())
                    .result(null)
                    .build());
        } catch (Exception e) {
            log.error("Error creating health record", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error creating health record: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @PostMapping("/reschedule-dose/{doseScheduleId}")
    public ResponseEntity<ApiResponse> rescheduleDose(
            @PathVariable Long doseScheduleId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate newDate) {
        
        try {
            log.info("Rescheduling dose ID: {} to new date: {}", doseScheduleId, newDate);
            
            // Reschedule the dose
            DoseSchedule updatedDoseSchedule = vaccinationService.rescheduleDose(doseScheduleId, newDate);
            
            log.info("Dose rescheduled successfully");
            
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Dose rescheduled successfully")
                .result(updatedDoseSchedule)
                .build());
            
        } catch (AppException e) {
            log.warn("Error rescheduling dose: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.builder()
                    .code(e.getErrorCode().getCode())
                    .message(e.getMessage())
                    .result(null)
                    .build());
        } catch (Exception e) {
            log.error("Error rescheduling dose", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error rescheduling dose: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
} 