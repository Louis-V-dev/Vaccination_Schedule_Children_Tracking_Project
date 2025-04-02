package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.vaccination.PostVaccinationCareRequest;
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
import java.time.LocalDateTime;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/observation-staff")
@PreAuthorize("hasRole('STAFF')")
public class ObservationStaffController {

    private static final Logger log = LoggerFactory.getLogger(ObservationStaffController.class);
    
    private final AppointmentService appointmentService;
    private final VaccinationService vaccinationService;
    
    @Autowired
    public ObservationStaffController(AppointmentService appointmentService, VaccinationService vaccinationService) {
        this.appointmentService = appointmentService;
        this.vaccinationService = vaccinationService;
    }
    
    @GetMapping("/in-observation")
    public ResponseEntity<ApiResponse> getAppointmentsInObservation(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        try {
            List<Appointment> appointments;
            
            // If date is provided, get appointments for that date
            if (date != null) {
                appointments = appointmentService.findByAppointmentDateAndStatus(date, AppointmentStatus.IN_OBSERVATION);
                log.info("Retrieved {} appointments in observation for date: {}", appointments.size(), date);
            } else {
                // Otherwise get all appointments with IN_OBSERVATION status
                appointments = appointmentService.findByStatus(AppointmentStatus.IN_OBSERVATION);
                log.info("Retrieved all {} appointments in observation", appointments.size());
            }
            
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Appointments in observation retrieved successfully")
                .result(appointments)
                .build());
            
        } catch (Exception e) {
            log.error("Error retrieving appointments in observation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error retrieving appointments: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @GetMapping("/today-in-observation")
    public ResponseEntity<ApiResponse> getTodayAppointmentsInObservation() {
        try {
            // Get today's date
            LocalDate today = LocalDate.now();
            log.info("Retrieving appointments in observation for today: {}", today);
            
            // Reuse the existing method with today's date
            return getAppointmentsInObservation(today);
            
        } catch (Exception e) {
            log.error("Error retrieving today's appointments in observation", e);
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
            
            // Verify that the appointment is in IN_OBSERVATION status
            if (appointment.getStatus() != AppointmentStatus.IN_OBSERVATION) {
                log.warn("Attempted to access appointment {} not in IN_OBSERVATION status", id);
                return ResponseEntity.badRequest()
                    .body(ApiResponse.builder()
                        .code(400)
                        .message("Appointment is not currently in observation")
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
    
    @GetMapping("/vaccinated-vaccines/{appointmentId}")
    public ResponseEntity<ApiResponse> getVaccinatedVaccinesForAppointment(@PathVariable Long appointmentId) {
        try {
            Appointment appointment = appointmentService.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            // Get only vaccinated vaccines
            List<AppointmentVaccine> vaccinatedVaccines = appointment.getAppointmentVaccines().stream()
                .filter(av -> av.getStatusEnum() == VaccinationStatus.VACCINATED)
                .toList();
            
            log.info("Retrieved {} vaccinated vaccines for appointment ID: {}", vaccinatedVaccines.size(), appointmentId);
            
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Vaccinated vaccines retrieved successfully")
                .result(vaccinatedVaccines)
                .build());
            
        } catch (AppException e) {
            log.warn("Appointment not found: {}", appointmentId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.builder()
                    .code(e.getErrorCode().getCode())
                    .message(e.getMessage())
                    .result(null)
                    .build());
        } catch (Exception e) {
            log.error("Error retrieving vaccinated vaccines for appointment ID: {}", appointmentId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error retrieving vaccinated vaccines: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @PostMapping("/start-observation/{appointmentId}")
    public ResponseEntity<ApiResponse> startObservation(@PathVariable Long appointmentId) {
        try {
            log.info("Starting observation for appointment ID: {}", appointmentId);
            
            Appointment appointment = appointmentService.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            // Verify that the appointment is in IN_OBSERVATION status
            if (appointment.getStatus() != AppointmentStatus.IN_OBSERVATION) {
                log.warn("Cannot start observation for appointment {}: not in IN_OBSERVATION status", appointmentId);
                return ResponseEntity.badRequest()
                    .body(ApiResponse.builder()
                        .code(400)
                        .message("Appointment must be in IN_OBSERVATION status to start observation")
                        .result(null)
                        .build());
            }
            
            // Get the current authenticated staff
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String staffId = authentication.getName();
            
            // Record observation start time for each vaccinated vaccine
            LocalDateTime now = LocalDateTime.now();
            List<PostVaccinationCare> startedObservations = new ArrayList<>();
            
            for (AppointmentVaccine av : appointment.getAppointmentVaccines()) {
                if (av.getStatusEnum() == VaccinationStatus.VACCINATED) {
                    // Create post-vaccination care record with start time
                    PostVaccinationCare careRecord = vaccinationService.startPostVaccinationCare(
                        av.getId(), staffId, now);
                    startedObservations.add(careRecord);
                }
            }
            
            log.info("Started observation for {} vaccinated vaccines in appointment ID: {}", 
                startedObservations.size(), appointmentId);
            
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Observation started successfully")
                .result(startedObservations)
                .build());
            
        } catch (AppException e) {
            log.warn("Error starting observation: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.builder()
                    .code(e.getErrorCode().getCode())
                    .message(e.getMessage())
                    .result(null)
                    .build());
        } catch (Exception e) {
            log.error("Error starting observation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error starting observation: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @PostMapping("/record-post-vaccination-care")
    public ResponseEntity<ApiResponse> recordPostVaccinationCare(@Valid @RequestBody PostVaccinationCareRequest request) {
        try {
            log.info("Recording post-vaccination care for appointment vaccine ID: {}", request.getAppointmentVaccineId());
            
            // Get the current authenticated staff
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String staffId = authentication.getName();
            
            // Complete the post-vaccination care record
            PostVaccinationCare careRecord = vaccinationService.completePostVaccinationCare(
                request.getAppointmentVaccineId(),
                staffId,
                request.getTemperature(),
                request.getBloodPressure(),
                request.getHeartRate(),
                request.getImmediateReactions(),
                request.getTreatmentProvided(),
                request.getStaffNotes(),
                request.getFollowUpNeeded(),
                request.getFollowUpInstructions()
            );
            
            // Get the appointment to check if all vaccines have been observed
            AppointmentVaccine appointmentVaccine = careRecord.getAppointmentVaccine();
            Appointment appointment = appointmentVaccine.getAppointment();
            
            // Check if all vaccinated vaccines have post-vaccination care records completed
            boolean allObserved = appointment.getAppointmentVaccines().stream()
                .filter(av -> av.getStatusEnum() == VaccinationStatus.VACCINATED)
                .allMatch(av -> vaccinationService.isPostVaccinationCareCompleted(av.getId()));
            
            // If all have been observed, update the appointment status to COMPLETED
            if (allObserved) {
                appointment.setStatus(AppointmentStatus.COMPLETED);
                appointmentService.saveAppointment(appointment);
                log.info("All vaccinated vaccines observed. Moving appointment {} to COMPLETED status", 
                    appointment.getId());
            }
            
            log.info("Post-vaccination care recorded successfully for appointment vaccine ID: {}", 
                request.getAppointmentVaccineId());
            
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Post-vaccination care recorded successfully")
                .result(careRecord)
                .build());
            
        } catch (AppException e) {
            log.warn("Error recording post-vaccination care: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.builder()
                    .code(e.getErrorCode().getCode())
                    .message(e.getMessage())
                    .result(null)
                    .build());
        } catch (Exception e) {
            log.error("Error recording post-vaccination care", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error recording post-vaccination care: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @PostMapping("/complete-appointment/{appointmentId}")
    public ResponseEntity<ApiResponse> completeAppointment(@PathVariable Long appointmentId) {
        try {
            log.info("Completing appointment ID: {}", appointmentId);
            
            Appointment appointment = appointmentService.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            // Verify that the appointment is in IN_OBSERVATION status
            if (appointment.getStatus() != AppointmentStatus.IN_OBSERVATION) {
                log.warn("Cannot complete appointment {}: not in IN_OBSERVATION status", appointmentId);
                return ResponseEntity.badRequest()
                    .body(ApiResponse.builder()
                        .code(400)
                        .message("Appointment must be in IN_OBSERVATION status to complete")
                        .result(null)
                        .build());
            }
            
            // Update appointment status to COMPLETED
            appointment.setStatus(AppointmentStatus.COMPLETED);
            appointmentService.saveAppointment(appointment);
            
            log.info("Appointment {} completed successfully", appointmentId);
            
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Appointment completed successfully")
                .result(appointment)
                .build());
            
        } catch (AppException e) {
            log.warn("Error completing appointment: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.builder()
                    .code(e.getErrorCode().getCode())
                    .message(e.getMessage())
                    .result(null)
                    .build());
        } catch (Exception e) {
            log.error("Error completing appointment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error completing appointment: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
}