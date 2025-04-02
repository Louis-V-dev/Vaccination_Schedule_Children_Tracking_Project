package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.vaccination.VaccinationRecordRequest;
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
@RequestMapping("/api/nurse")
@PreAuthorize("hasRole('NURSE')")
public class NurseController {

    private static final Logger log = LoggerFactory.getLogger(NurseController.class);
    
    private final AppointmentService appointmentService;
    private final VaccinationService vaccinationService;
    
    @Autowired
    public NurseController(AppointmentService appointmentService, VaccinationService vaccinationService) {
        this.appointmentService = appointmentService;
        this.vaccinationService = vaccinationService;
    }
    
    @GetMapping("/pending-vaccinations")
    public ResponseEntity<ApiResponse> getPendingVaccinations(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        try {
            List<Appointment> appointments;
            
            // If date is provided, get appointments for that date
            if (date != null) {
                appointments = appointmentService.findByAppointmentDateAndStatus(date, AppointmentStatus.WITH_NURSE);
                log.info("Retrieved {} appointments pending vaccination for date: {}", appointments.size(), date);
            } else {
                // Otherwise get all appointments with WITH_NURSE status
                appointments = appointmentService.findByStatus(AppointmentStatus.WITH_NURSE);
                log.info("Retrieved all {} appointments pending vaccination", appointments.size());
            }
            
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Pending vaccinations retrieved successfully")
                .result(appointments)
                .build());
            
        } catch (Exception e) {
            log.error("Error retrieving pending vaccinations", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error retrieving pending vaccinations: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @GetMapping("/today-pending-vaccinations")
    public ResponseEntity<ApiResponse> getTodayPendingVaccinations() {
        try {
            // Get today's date
            LocalDate today = LocalDate.now();
            log.info("Retrieving pending vaccinations for today: {}", today);
            
            // Reuse the existing method with today's date
            return getPendingVaccinations(today);
            
        } catch (Exception e) {
            log.error("Error retrieving today's pending vaccinations", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error retrieving today's pending vaccinations: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @GetMapping("/appointments/{id}")
    public ResponseEntity<ApiResponse> getAppointmentDetails(@PathVariable Long id) {
        try {
            Appointment appointment = appointmentService.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            // Verify that the appointment is in WITH_NURSE status
            if (appointment.getStatus() != AppointmentStatus.WITH_NURSE) {
                log.warn("Attempted to access appointment {} not in WITH_NURSE status", id);
                return ResponseEntity.badRequest()
                    .body(ApiResponse.builder()
                        .code(400)
                        .message("Appointment is not currently with nurse")
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
    
    @GetMapping("/approved-vaccines/{appointmentId}")
    public ResponseEntity<ApiResponse> getApprovedVaccinesForAppointment(@PathVariable Long appointmentId) {
        try {
            Appointment appointment = appointmentService.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            // Get only approved vaccines
            List<AppointmentVaccine> approvedVaccines = appointment.getAppointmentVaccines().stream()
                .filter(av -> av.getStatusEnum() == VaccinationStatus.APPROVED)
                .toList();
            
            log.info("Retrieved {} approved vaccines for appointment ID: {}", approvedVaccines.size(), appointmentId);
            
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Approved vaccines retrieved successfully")
                .result(approvedVaccines)
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
            log.error("Error retrieving approved vaccines for appointment ID: {}", appointmentId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error retrieving approved vaccines: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @PostMapping("/record-vaccination")
    public ResponseEntity<ApiResponse> recordVaccination(@Valid @RequestBody VaccinationRecordRequest request) {
        try {
            log.info("Recording vaccination for appointment vaccine ID: {}", request.getAppointmentVaccineId());
            
            // Get the current authenticated nurse
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String nurseId = authentication.getName();
            
            // Create the vaccination record
            VaccinationRecord vaccinationRecord = vaccinationService.recordVaccination(
                request.getAppointmentVaccineId(),
                nurseId,
                request.getVaccineBatchNumber(),
                request.getVaccineExpiryDate(),
                request.getInjectionSite(),
                request.getRouteOfAdministration(),
                request.getDoseAmount(),
                request.getNurseNotes()
            );
            
            // Update the status of the appointment vaccine
            AppointmentVaccine appointmentVaccine = vaccinationRecord.getAppointmentVaccine();
            appointmentVaccine.setStatus(VaccinationStatus.VACCINATED);
            
            // Update the dose schedule
            DoseSchedule doseSchedule = appointmentVaccine.getDoseSchedule();
            if (doseSchedule != null) {
                doseSchedule.setStatus(String.valueOf(DoseStatus.COMPLETED));
                
                // Update the VaccineOfChild's currentDose
                VaccineOfChild vaccineOfChild = doseSchedule.getVaccineOfChild();
                if (vaccineOfChild != null) {
                    // Increment the currentDose to match the dose number
                    vaccineOfChild.setCurrentDose(doseSchedule.getDoseNumber());
                    
                    // Check if all doses are completed
                    if (vaccineOfChild.getCurrentDose() >= vaccineOfChild.getTotalDoses()) {
                        vaccineOfChild.setIsCompleted(true);
                    }
                }
            }
            
            // Check if all approved vaccines have been administered
            Appointment appointment = appointmentVaccine.getAppointment();
            boolean allVaccinated = appointment.getAppointmentVaccines().stream()
                .filter(av -> av.getStatusEnum() == VaccinationStatus.APPROVED || 
                             av.getStatusEnum() == VaccinationStatus.VACCINATED)
                .allMatch(av -> av.getStatusEnum() == VaccinationStatus.VACCINATED);
            
            // If all have been vaccinated, update the appointment status to IN_OBSERVATION
            if (allVaccinated) {
                appointment.setStatus(AppointmentStatus.IN_OBSERVATION);
                appointmentService.saveAppointment(appointment);
                log.info("All approved vaccines administered. Moving appointment {} to IN_OBSERVATION status", 
                    appointment.getId());
            }
            
            log.info("Vaccination recorded successfully for appointment vaccine ID: {}", 
                request.getAppointmentVaccineId());
            
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Vaccination recorded successfully")
                .result(vaccinationRecord)
                .build());
            
        } catch (AppException e) {
            log.warn("Error recording vaccination: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.builder()
                    .code(e.getErrorCode().getCode())
                    .message(e.getMessage())
                    .result(null)
                    .build());
        } catch (Exception e) {
            log.error("Error recording vaccination", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error recording vaccination: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
} 