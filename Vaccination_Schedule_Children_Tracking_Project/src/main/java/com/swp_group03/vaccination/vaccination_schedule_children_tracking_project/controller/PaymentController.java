package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Payment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.PaymentService;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.dto.PaymentStatisticsDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

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
} 