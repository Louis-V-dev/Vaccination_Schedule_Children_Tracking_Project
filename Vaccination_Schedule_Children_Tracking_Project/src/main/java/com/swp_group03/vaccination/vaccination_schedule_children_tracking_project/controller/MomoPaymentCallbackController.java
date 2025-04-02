package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.AppointmentService;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.PaymentService;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/payment/momo/callback")
public class MomoPaymentCallbackController {

    private static final Logger log = LoggerFactory.getLogger(MomoPaymentCallbackController.class);
    
    private final PaymentService paymentService;
    private final AppointmentService appointmentService;
    
    @Autowired
    public MomoPaymentCallbackController(PaymentService paymentService, AppointmentService appointmentService) {
        this.paymentService = paymentService;
        this.appointmentService = appointmentService;
    }
    
    @GetMapping("/success/{appointmentId}")
    public ResponseEntity<ApiResponse> handleSuccessCallback(
            @PathVariable Long appointmentId,
            @RequestParam String orderId,
            @RequestParam String transId,
            @RequestParam String amount) {
        
        try {
            log.info("Received MoMo payment success callback for appointment ID: {}", appointmentId);
            
            // Process the payment
            Payment payment = paymentService.processMomoPaymentCallback(orderId, transId, amount);
            
            // Process the vaccines after payment
            appointmentService.processVaccinesAfterPayment(appointmentId);
            
            log.info("Payment processed successfully for appointment ID: {}", appointmentId);
            
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("payment", payment);
            responseData.put("message", "Payment processed successfully");
            
            return ResponseEntity.ok(ApiResponse.builder()
                .code(100)
                .message("Payment processed successfully")
                .result(responseData)
                .build());
            
        } catch (AppException e) {
            log.error("Error processing MoMo payment callback: {}", e.getMessage());
            return ResponseEntity.badRequest()
                .body(ApiResponse.builder()
                    .code(e.getErrorCode().getCode())
                    .message(e.getMessage())
                    .result(null)
                    .build());
        } catch (Exception e) {
            log.error("Error processing MoMo payment callback", e);
            return ResponseEntity.internalServerError()
                .body(ApiResponse.builder()
                    .code(500)
                    .message("Error processing payment: " + e.getMessage())
                    .result(null)
                    .build());
        }
    }
    
    @PostMapping("/notify")
    public ResponseEntity<String> handleNotifyCallback(@RequestBody Map<String, String> payload) {
        try {
            log.info("Received MoMo payment notification: {}", payload);
            
            String orderId = payload.get("orderId");
            String transId = payload.get("transId");
            String amount = payload.get("amount");
            String resultCode = payload.get("resultCode");
            
            // Check if payment was successful
            if ("0".equals(resultCode)) {
                // Process the payment
                paymentService.processMomoPaymentCallback(orderId, transId, amount);
                
                log.info("Payment notification processed successfully for order ID: {}", orderId);
                
                return ResponseEntity.ok("Payment processed successfully");
            } else {
                log.warn("Payment failed with result code: {}", resultCode);
                
                return ResponseEntity.badRequest().body("Payment failed");
            }
            
        } catch (Exception e) {
            log.error("Error processing MoMo payment notification", e);
            return ResponseEntity.internalServerError().body("Error processing payment notification");
        }
    }
} 