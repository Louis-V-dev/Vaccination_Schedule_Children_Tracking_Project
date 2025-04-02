package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.*;
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
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/receptionist")
@PreAuthorize("hasRole('RECEPTIONIST')")
public class ReceptionistController {

    private static final Logger log = LoggerFactory.getLogger(ReceptionistController.class);
    
    private final AppointmentService appointmentService;
    private final VaccinationService vaccinationService;
    
    @Autowired
    public ReceptionistController(AppointmentService appointmentService, VaccinationService vaccinationService) {
        this.appointmentService = appointmentService;
        this.vaccinationService = vaccinationService;
    }
    
    @GetMapping("/appointments")
    public ResponseEntity<ApiResponse> getAllAppointments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        
        try {
            List<Appointment> appointments;
            
            // If date is provided, get appointments for that date
            if (date != null) {
                appointments = appointmentService.findByAppointmentDate(date);
                log.info("Retrieved {} appointments for date: {}", appointments.size(), date);
            } else {
                // Otherwise get all appointments
                appointments = appointmentService.findAll();
                log.info("Retrieved all {} appointments", appointments.size());
            }
            
            // Filter by status if provided
            if (status != null && !status.isEmpty()) {
                try {
                    AppointmentStatus appointmentStatus = AppointmentStatus.valueOf(status.toUpperCase());
                    appointments = appointments.stream()
                        .filter(a -> appointmentStatus.equals(a.getStatus()))
                        .toList();
                    log.info("Filtered to {} appointments with status: {}", appointments.size(), status);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid status parameter: {}", status);
                    return ResponseEntity.badRequest()
                        .body(ApiResponse.builder()
                            .code(400)
                            .message("Invalid status parameter")
                            .result(null)
                            .build());
                }
            }
            
            // Filter by search term if provided (child name, parent name, or phone)
            if (search != null && !search.isEmpty()) {
                String searchLower = search.toLowerCase();
                appointments = appointments.stream()
                    .filter(a -> {
                        String childName = a.getChild().getChild_name().toLowerCase();
                        String parentName = a.getChild().getAccount_Id().getFullName().toLowerCase();
                        String phone = a.getChild().getAccount_Id().getPhoneNumber();
                        
                        return childName.contains(searchLower) || 
                               parentName.contains(searchLower) || 
                               (phone != null && phone.contains(search));
                    })
                    .toList();
                log.info("Filtered to {} appointments matching search: {}", appointments.size(), search);
            }
            
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Appointments retrieved successfully")
                .result(appointments)
                .build());
            
        } catch (Exception e) {
            log.error("Error retrieving appointments", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error retrieving appointments: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @GetMapping("/today-appointments")
    public ResponseEntity<ApiResponse> getTodayAppointments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        
        try {
            // Get today's date
            LocalDate today = LocalDate.now();
            log.info("Retrieving appointments for today: {}", today);
            
            // Call getAllAppointments with today's date
            return getAllAppointments(today, status, search);
            
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
    
    @PostMapping("/check-in/{id}")
    public ResponseEntity<ApiResponse> checkInAppointment(@PathVariable Long id) {
        try {
            Appointment appointment = appointmentService.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            // Verify appointment is for today
            LocalDate appointmentDate = appointment.getAppointmentTime().toLocalDate();
            LocalDate today = LocalDate.now();
            
            if (!appointmentDate.equals(today)) {
                log.warn("Attempted check-in for appointment {} not scheduled for today", id);
                return ResponseEntity.badRequest()
                    .body(ApiResponse.builder()
                        .code(400)
                        .message("Cannot check in appointment not scheduled for today")
                        .result(null)
                        .build());
            }
            
            // Check payment status
            boolean isPaid = appointment.isPaid();
            if (!isPaid) {
                // Update status to AWAITING_PAYMENT
                appointment.setStatus(AppointmentStatus.AWAITING_PAYMENT);
                appointmentService.saveAppointment(appointment);
                
                log.info("Updated appointment {} to AWAITING_PAYMENT status", id);
                return ResponseEntity.ok(ApiResponse.builder()
                    .code(100)
                    .message("Patient checked in but payment required. Status updated to AWAITING_PAYMENT.")
                    .result(appointment)
                    .build());
            } else {
                // If paid, update status to CHECKED_IN
                appointment.setStatus(AppointmentStatus.CHECKED_IN);
                appointmentService.saveAppointment(appointment);
                
                log.info("Updated appointment {} to CHECKED_IN status", id);
                return ResponseEntity.ok(ApiResponse.builder()
                    .code(100)
                    .message("Patient checked in successfully. Status updated to CHECKED_IN.")
                    .result(appointment)
                    .build());
            }
            
        } catch (AppException e) {
            log.warn("Appointment not found: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.builder()
                    .code(e.getErrorCode().getCode())
                    .message(e.getMessage())
                    .result(null)
                    .build());
        } catch (Exception e) {
            log.error("Error checking in appointment: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error checking in appointment: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @PostMapping("/assign-to-doctor/{appointmentId}/{doctorId}")
    public ResponseEntity<ApiResponse> assignToDoctor(
            @PathVariable Long appointmentId, 
            @PathVariable String doctorId) {
        
        try {
            Appointment appointment = appointmentService.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            // Verify appointment is CHECKED_IN
            AppointmentStatus currentStatus = appointment.getStatus();
            if (!AppointmentStatus.CHECKED_IN.equals(currentStatus)) {
                log.warn("Cannot assign appointment {} to doctor: appointment not in CHECKED_IN status", appointmentId);
                return ResponseEntity.badRequest()
                    .body(ApiResponse.builder()
                        .code(400)
                        .message("Appointment must be in CHECKED_IN status to assign to a doctor")
                        .result(null)
                        .build());
            }
            
            // Assign to doctor and change status
            appointment = vaccinationService.assignToDoctor(appointment, doctorId);
            
            log.info("Assigned appointment {} to doctor {}", appointmentId, doctorId);
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Appointment assigned to doctor successfully. Status updated to WITH_DOCTOR.")
                .result(appointment)
                .build());
            
        } catch (AppException e) {
            log.warn("Error assigning to doctor: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.builder()
                    .code(e.getErrorCode().getCode())
                    .message(e.getMessage())
                    .result(null)
                    .build());
        } catch (Exception e) {
            log.error("Error assigning appointment to doctor", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error assigning appointment to doctor: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
} 