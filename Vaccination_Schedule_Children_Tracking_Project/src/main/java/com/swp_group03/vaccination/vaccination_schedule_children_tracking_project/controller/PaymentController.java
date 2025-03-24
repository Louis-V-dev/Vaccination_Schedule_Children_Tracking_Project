package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.dto.MomoPaymentRequestDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.dto.MomoPaymentResponseDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.AccountRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.AppointmentRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.PaymentRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.MomoPaymentService;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.PaymentService;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.dto.PaymentStatisticsDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.AppointmentService;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.PaymentMethodRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final AppointmentRepository appointmentRepository;
    private final MomoPaymentService momoPaymentService;
    private final PaymentRepository paymentRepository;
    private final AccountRepository accountRepository;
    private final AppointmentService appointmentService;
    private final PaymentMethodRepository paymentMethodRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<Payment>>> getAllPayments(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "created_at") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            Pageable pageable) {
        
        try {
            // Log the incoming parameters for debugging
            System.out.println("Payment API Parameters - Page: " + page + ", Size: " + size + 
                               ", SortBy: " + sortBy + ", Direction: " + direction);
            
            // Handle pagination and sorting explicitly to avoid issues with Spring Data's default handling
            org.springframework.data.domain.Sort sort;
            
            // Map database column names to entity property names
            if (sortBy.equals("created_at")) {
                sortBy = "createdAt";
            } else if (sortBy.equals("updated_at")) {
                sortBy = "updatedAt";
            } else if (sortBy.contains("_")) {
                // For any other properties with underscores, convert to camelCase
                String[] parts = sortBy.split("_");
                StringBuilder camelCase = new StringBuilder(parts[0]);
                for (int i = 1; i < parts.length; i++) {
                    if (parts[i].length() > 0) {
                        camelCase.append(Character.toUpperCase(parts[i].charAt(0)));
                        if (parts[i].length() > 1) {
                            camelCase.append(parts[i].substring(1));
                        }
                    }
                }
                sortBy = camelCase.toString();
            }
            
            if (direction.equalsIgnoreCase("asc")) {
                sort = org.springframework.data.domain.Sort.by(sortBy).ascending();
            } else {
                sort = org.springframework.data.domain.Sort.by(sortBy).descending();
            }
            
            pageable = org.springframework.data.domain.PageRequest.of(page, size, sort);
            
            Page<Payment> payments = status != null ?
                    paymentService.getPaymentsByStatus(status, pageable) :
                    paymentService.getAllPaymentsPageable(pageable);
            
            return ResponseEntity.ok(ApiResponse.success(payments));
        } catch (Exception e) {
            // Log the error for debugging
            System.err.println("Error in getAllPayments: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ApiResponse<Payment>> getPaymentById(@PathVariable Long id) {
        Payment payment = paymentService.getPaymentById(id);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Payment>> updatePaymentStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        Payment updatedPayment = paymentService.updatePaymentStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(updatedPayment));
    }

    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaymentStatisticsDTO>> getPaymentStatistics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        PaymentStatisticsDTO statistics = paymentService.getPaymentStatistics(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(statistics));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    public ResponseEntity<ApiResponse<Page<Payment>>> getUserPayments(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "created_at") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            Pageable pageable) {
        
        try {
            // Handle pagination and sorting explicitly to avoid issues with Spring Data's default handling
            org.springframework.data.domain.Sort sort;
            
            // Map database column names to entity property names
            if (sortBy.equals("created_at")) {
                sortBy = "createdAt";
            } else if (sortBy.equals("updated_at")) {
                sortBy = "updatedAt";
            } else if (sortBy.contains("_")) {
                // For any other properties with underscores, convert to camelCase
                String[] parts = sortBy.split("_");
                StringBuilder camelCase = new StringBuilder(parts[0]);
                for (int i = 1; i < parts.length; i++) {
                    if (parts[i].length() > 0) {
                        camelCase.append(Character.toUpperCase(parts[i].charAt(0)));
                        if (parts[i].length() > 1) {
                            camelCase.append(parts[i].substring(1));
                        }
                    }
                }
                sortBy = camelCase.toString();
            }
            
            if (direction.equalsIgnoreCase("asc")) {
                sort = org.springframework.data.domain.Sort.by(sortBy).ascending();
            } else {
                sort = org.springframework.data.domain.Sort.by(sortBy).descending();
            }
            
            pageable = org.springframework.data.domain.PageRequest.of(page, size, sort);
            
            Page<Payment> payments = paymentService.getUserPaymentsPageable(userId, pageable);
            return ResponseEntity.ok(ApiResponse.success(payments));
        } catch (Exception e) {
            // Log the error for debugging
            System.err.println("Error in getUserPayments: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping("/expired")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<Payment>>> getExpiredPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "created_at") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            Pageable pageable) {
        
        try {
            // Handle pagination and sorting explicitly to avoid issues with Spring Data's default handling
            org.springframework.data.domain.Sort sort;
            
            // Map database column names to entity property names
            if (sortBy.equals("created_at")) {
                sortBy = "createdAt";
            } else if (sortBy.equals("updated_at")) {
                sortBy = "updatedAt";
            } else if (sortBy.contains("_")) {
                // For any other properties with underscores, convert to camelCase
                String[] parts = sortBy.split("_");
                StringBuilder camelCase = new StringBuilder(parts[0]);
                for (int i = 1; i < parts.length; i++) {
                    if (parts[i].length() > 0) {
                        camelCase.append(Character.toUpperCase(parts[i].charAt(0)));
                        if (parts[i].length() > 1) {
                            camelCase.append(parts[i].substring(1));
                        }
                    }
                }
                sortBy = camelCase.toString();
            }
            
            if (direction.equalsIgnoreCase("asc")) {
                sort = org.springframework.data.domain.Sort.by(sortBy).ascending();
            } else {
                sort = org.springframework.data.domain.Sort.by(sortBy).descending();
            }
            
            pageable = org.springframework.data.domain.PageRequest.of(page, size, sort);
            
            Page<Payment> expiredPayments = paymentService.getExpiredPaymentsPageable(pageable);
            return ResponseEntity.ok(ApiResponse.success(expiredPayments));
        } catch (Exception e) {
            // Log the error for debugging
            System.err.println("Error in getExpiredPayments: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PostMapping("/create/{appointmentId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createPayment(
            @PathVariable Long appointmentId,
            @RequestParam(required = false) String returnUrl,
            @RequestParam(required = false) String cancelUrl,
            @RequestParam(required = false) String requestType) {
        try {
            System.out.println("Creating payment for appointment: " + appointmentId);
            
            // Find the appointment
            Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            if (appointment.isPaid()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Appointment is already paid"
                ));
            }
            
            // Create payment using MoMo service
            MomoPaymentRequestDTO requestDTO = new MomoPaymentRequestDTO();
            requestDTO.setAppointmentId(appointmentId);
            requestDTO.setAmount(BigDecimal.valueOf(appointment.getTotalAmount()));
            
            // Set optional parameters if provided
            if (returnUrl != null && !returnUrl.isEmpty()) {
                requestDTO.setReturnUrl(returnUrl);
            }
            
            if (cancelUrl != null && !cancelUrl.isEmpty()) {
                // MoMo API doesn't directly support cancelUrl, but we'll store it as part of extraData
                // The frontend can handle cancellation based on query parameters
                requestDTO.setExtraData(appointmentId + "|" + cancelUrl);
            } else {
                requestDTO.setExtraData(String.valueOf(appointmentId));
            }
            
            if (requestType != null && !requestType.isEmpty()) {
                requestDTO.setRequestType(requestType);
            }
            
            MomoPaymentResponseDTO responseDTO = momoPaymentService.createPayment(requestDTO);
            System.out.println("Payment created successfully with URL: " + responseDTO.getPaymentUrl());
            
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            System.err.println("Error creating payment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to create payment: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/record")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> recordPayment(@RequestBody Map<String, Object> paymentData) {
        try {
            System.out.println("Recording payment: " + paymentData);
            
            // Extract appointment ID from paymentData or orderInfo
            Long appointmentId = null;
            if (paymentData.containsKey("appointmentId")) {
                try {
                    appointmentId = Long.parseLong(paymentData.get("appointmentId").toString());
                    System.out.println("Using directly provided appointmentId: " + appointmentId);
                } catch (NumberFormatException e) {
                    System.err.println("Invalid appointmentId format in direct data: " + paymentData.get("appointmentId"));
                }
            }
            
            // If appointmentId wasn't provided directly, try to extract from orderInfo
            if (appointmentId == null) {
                String orderInfo = (String) paymentData.getOrDefault("orderInfo", "");
                appointmentId = extractAppointmentId(orderInfo);
                System.out.println("Extracted appointmentId from orderInfo: " + appointmentId);
            }
            
            if (appointmentId == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid orderInfo format, cannot extract appointment ID"
                ));
            }
            
            // Find the appointment
            Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElse(null);
                
            if (appointment == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Appointment not found with ID: " + appointmentId
                ));
            }
            
            Payment payment = null;
            boolean isExistingPayment = false;
            
            // First, check if the appointment already has a payment
            if (appointment.getPayment() != null) {
                payment = appointment.getPayment();
                isExistingPayment = true;
                System.out.println("Appointment already has payment with ID: " + payment.getId() + ", current status: " + payment.getStatus());
            }
            
            // If no payment is associated with the appointment, try to find by transaction ID
            if (payment == null) {
                // Check if a transaction ID was provided directly
                String providedTransactionId = (String) paymentData.getOrDefault("transId", "");
                if (providedTransactionId != null && !providedTransactionId.isEmpty()) {
                    System.out.println("Looking for payment with transaction ID: " + providedTransactionId);
                    Optional<Payment> paymentOpt = paymentRepository.findByTransactionId(providedTransactionId);
                    
                    if (paymentOpt.isPresent()) {
                        payment = paymentOpt.get();
                        isExistingPayment = true;
                        System.out.println("Found payment by transaction ID: " + payment.getId());
                    }
                }
                
                // If still no payment found, try with standard order reference
                if (payment == null) {
                    System.out.println("Looking for any payment for appointment ID: " + appointmentId);
                    // Try to find the most recent payment for this appointment
                    List<Payment> payments = appointment.getPayments();
                    if (payments != null && !payments.isEmpty()) {
                        // Get the most recent payment (assuming list is sorted by creation date)
                        payment = payments.get(payments.size() - 1);
                        isExistingPayment = true;
                        System.out.println("Found most recent payment for appointment: " + payment.getId());
                    } else {
                        String orderRef = "Payment for appointment #" + appointmentId;
                        payment = paymentRepository.findFirstByTransactionIdContainingOrderByCreatedAtDesc(orderRef);
                        
                        if (payment != null) {
                            isExistingPayment = true;
                            System.out.println("Found payment by order reference: " + payment.getId());
                        }
                    }
                }
            }
            
            // Check the result code to determine status
            Integer resultCode = (Integer) paymentData.getOrDefault("resultCode", -1);
            boolean isSuccess = (resultCode != null && resultCode == 0);
            
            if (isExistingPayment && payment != null) {
                System.out.println("Updating existing payment: " + payment.getId() + ", current status: " + payment.getStatus());
                
                if (isSuccess) {
                    // Success case
                    payment.setStatus(PaymentStatus.COMPLETED);
                    payment.setPaymentDate(LocalDateTime.now());
                    
                    // Update transaction details if provided
                    String transactionId = (String) paymentData.getOrDefault("transId", "");
                    if (transactionId != null && !transactionId.isEmpty()) {
                        // Always update the transaction ID to the latest one
                        payment.setGatewayTransactionId(transactionId);
                        System.out.println("Updated gateway transaction ID to: " + transactionId);
                    }
                    
                    payment = paymentRepository.save(payment);
                    System.out.println("Payment updated to COMPLETED: " + payment.getId());
                    
                    // Always associate payment with appointment
                    appointment.setPayment(payment);
                    appointment.setPaid(true);
                    appointment.setStatus(AppointmentStatus.PAID);
                    appointmentRepository.save(appointment);
                    System.out.println("Appointment marked as paid: " + appointmentId);
                    
                    // Process vaccines after payment - use appointmentService instead
                    appointmentService.processVaccinesAfterPayment(appointmentId);
                    System.out.println("Processed vaccines after payment for appointment: " + appointmentId);
                    
                } else {
                    // Failed case
                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setGatewayResponse("Payment failed with code: " + resultCode);
                    paymentRepository.save(payment);
                    System.out.println("Payment marked as FAILED: " + payment.getId());
                }
            } else {
                // Create a new payment record if none exists
                System.out.println("Creating new payment record for appointment: " + appointmentId);
                
                // Extract amount from payment data or use appointment total
                Double amount = null;
                try {
                    amount = Double.parseDouble(paymentData.getOrDefault("amount", "0").toString());
                } catch (Exception e) {
                    amount = appointment.getTotalAmount();
                }
                
                // Get transaction ID from request or generate one
                String transactionId = (String) paymentData.getOrDefault("transId", "");
                if (transactionId == null || transactionId.isEmpty()) {
                    transactionId = "Payment for appointment #" + appointmentId;
                }
                
                PaymentStatus status = isSuccess ? PaymentStatus.COMPLETED : PaymentStatus.PENDING;
                
                Payment newPayment = Payment.builder()
                    .user(appointment.getChild().getAccount_Id())
                    .amount(BigDecimal.valueOf(amount))
                    .totalAmount(BigDecimal.valueOf(amount))
                    .status(status)
                    .paymentDate(isSuccess ? LocalDateTime.now() : null)
                    .transactionId(transactionId)
                    .gatewayTransactionId(isSuccess ? transactionId : null)
                    .build();
                
                // Get default payment method (MOMO)
                Optional<PaymentMethod> defaultMethod = paymentMethodRepository.findByCode("MOMO");
                if (defaultMethod.isPresent()) {
                    newPayment.setPaymentMethod(defaultMethod.get());
                }
                
                payment = paymentRepository.save(newPayment);
                System.out.println("Created new payment with ID: " + payment.getId());
                
                if (isSuccess) {
                    // Associate payment with appointment for successful payments
                    appointment.setPayment(payment);
                    appointment.setPaid(true);
                    appointment.setStatus(AppointmentStatus.PAID);
                    appointmentRepository.save(appointment);
                    System.out.println("Appointment marked as paid: " + appointmentId);
                    
                    // Process vaccines after payment
                    appointmentService.processVaccinesAfterPayment(appointmentId);
                    System.out.println("Processed vaccines after payment for appointment: " + appointmentId);
                }
            }
            
            // Return success response
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", isSuccess ? "Payment completed successfully" : "Payment recorded successfully",
                "paymentId", payment.getId(),
                "status", payment.getStatus().toString(),
                "appointmentId", appointmentId
            ));
        } catch (Exception e) {
            System.err.println("Error recording payment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to record payment: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/status/{orderId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> checkPaymentStatus(@PathVariable String orderId) {
        try {
            System.out.println("Checking payment status for order: " + orderId);
            
            Map<String, Object> statusResponse = momoPaymentService.checkPaymentStatus(orderId);
            return ResponseEntity.ok(statusResponse);
        } catch (Exception e) {
            System.err.println("Error checking payment status: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to check payment status: " + e.getMessage()
            ));
        }
    }

    /**
     * Extract appointment ID from order info string
     * Format example: "Payment for appointment #123"
     */
    private Long extractAppointmentId(String orderInfo) {
        if (orderInfo == null || orderInfo.trim().isEmpty()) {
            return null;
        }
        
        try {
            // Use regex to extract the number after "#"
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("#(\\d+)");
            java.util.regex.Matcher matcher = pattern.matcher(orderInfo);
            
            if (matcher.find()) {
                return Long.parseLong(matcher.group(1));
            }
        } catch (Exception e) {
            System.err.println("Error extracting appointment ID from orderInfo: " + e.getMessage());
        }
        
        return null;
    }
} 