package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.payment.CashPaymentRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.AppointmentService;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.PaymentService;
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
@RequestMapping("/api/cashier")
@PreAuthorize("hasRole('CASHIER')")
public class CashierController {

    private static final Logger log = LoggerFactory.getLogger(CashierController.class);
    
    private final AppointmentService appointmentService;
    private final PaymentService paymentService;
    
    @Autowired
    public CashierController(AppointmentService appointmentService, PaymentService paymentService) {
        this.appointmentService = appointmentService;
        this.paymentService = paymentService;
    }
    
    @GetMapping("/awaiting-payment")
    public ResponseEntity<ApiResponse> getAppointmentsAwaitingPayment(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String search) {
        
        try {
            List<Appointment> appointments;
            
            // If date is provided, get appointments for that date
            if (date != null) {
                appointments = appointmentService.findByAppointmentDateAndStatus(
                    date, AppointmentStatus.AWAITING_PAYMENT);
                log.info("Retrieved {} appointments awaiting payment for date: {}", appointments.size(), date);
            } else {
                // Otherwise get all appointments with AWAITING_PAYMENT status
                appointments = appointmentService.findByStatus(AppointmentStatus.AWAITING_PAYMENT);
                log.info("Retrieved all {} appointments awaiting payment", appointments.size());
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
                .message("Appointments awaiting payment retrieved successfully")
                .result(appointments)
                .build());
            
        } catch (Exception e) {
            log.error("Error retrieving appointments awaiting payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error retrieving appointments: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @GetMapping("/today-awaiting-payment")
    public ResponseEntity<ApiResponse> getTodayAppointmentsAwaitingPayment(
            @RequestParam(required = false) String search) {
        
        try {
            // Get today's date
            LocalDate today = LocalDate.now();
            log.info("Retrieving appointments awaiting payment for today: {}", today);
            
            // Reuse the existing method with today's date
            return getAppointmentsAwaitingPayment(today, search);
            
        } catch (Exception e) {
            log.error("Error retrieving today's appointments awaiting payment", e);
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
    
    @PostMapping("/process-cash-payment")
    public ResponseEntity<ApiResponse> processCashPayment(@RequestBody CashPaymentRequest request) {
        try {
            log.info("Processing cash payment for appointment ID: {}", request.getAppointmentId());
            
            // Find the appointment
            Appointment appointment = appointmentService.findById(request.getAppointmentId())
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            // Verify appointment is in AWAITING_PAYMENT status
            if (appointment.getStatus() != AppointmentStatus.AWAITING_PAYMENT) {
                log.warn("Cannot process payment for appointment {}: appointment not in AWAITING_PAYMENT status", 
                    request.getAppointmentId());
                return ResponseEntity.badRequest()
                    .body(ApiResponse.builder()
                        .code(400)
                        .message("Appointment must be in AWAITING_PAYMENT status to process payment")
                        .result(null)
                        .build());
            }
            
            // Process the payment
            Payment payment = paymentService.processCashPayment(
                appointment, 
                request.getAmountPaid(), 
                request.getReceivedBy(),
                request.getNotes());
            
            // Process vaccinations after payment
            appointmentService.processVaccinesAfterPayment(appointment.getId());
            
            // Update appointment status
            appointment.setStatus(AppointmentStatus.CHECKED_IN);
            appointment.setPaid(true);
            appointmentService.saveAppointment(appointment);
            
            log.info("Payment processed successfully for appointment ID: {}", request.getAppointmentId());
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("appointment", appointment);
            responseData.put("payment", payment);
            
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Payment processed successfully")
                .result(responseData)
                .build());
            
        } catch (AppException e) {
            log.warn("Error processing payment: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.builder()
                    .code(e.getErrorCode().getCode())
                    .message(e.getMessage())
                    .result(null)
                    .build());
        } catch (Exception e) {
            log.error("Error processing payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error processing payment: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @GetMapping("/generate-momo-payment/{id}")
    public ResponseEntity<ApiResponse> generateMomoPayment(@PathVariable Long id) {
        try {
            log.info("Generating MoMo payment for appointment ID: {}", id);
            
            // Find the appointment
            Appointment appointment = appointmentService.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            // Verify appointment is in AWAITING_PAYMENT status
            if (appointment.getStatus() != AppointmentStatus.AWAITING_PAYMENT) {
                log.warn("Cannot generate MoMo payment for appointment {}: appointment not in AWAITING_PAYMENT status", id);
                return ResponseEntity.badRequest()
                    .body(ApiResponse.builder()
                        .code(400)
                        .message("Appointment must be in AWAITING_PAYMENT status to generate payment")
                        .result(null)
                        .build());
            }
            
            // Generate MoMo payment URL
            String paymentUrl = paymentService.generateMomoPaymentUrl(appointment);
            
            log.info("Generated MoMo payment URL for appointment ID: {}", id);
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("paymentUrl", paymentUrl);
            responseData.put("appointmentId", id);
            
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("MoMo payment URL generated successfully")
                .result(responseData)
                .build());
            
        } catch (AppException e) {
            log.warn("Error generating MoMo payment: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.builder()
                    .code(e.getErrorCode().getCode())
                    .message(e.getMessage())
                    .result(null)
                    .build());
        } catch (Exception e) {
            log.error("Error generating MoMo payment", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error generating MoMo payment: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
} 