package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.dto.MomoPaymentRequestDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.dto.MomoPaymentResponseDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.MomoPaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/payments/momo")
@CrossOrigin(origins = "*")
public class MomoPaymentController {

    @Autowired
    private MomoPaymentService momoPaymentService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<MomoPaymentResponseDTO>> createPayment(@RequestBody MomoPaymentRequestDTO request) {
        MomoPaymentResponseDTO response = momoPaymentService.createPayment(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/status/{orderId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkPaymentStatus(@PathVariable String orderId) {
        try {
            System.out.println("MomoPaymentController: Received status check request for orderId: " + orderId);
            Map<String, Object> status = momoPaymentService.checkPaymentStatus(orderId);
            
            // If the result contains an error code, set appropriate HTTP status
            if (status.containsKey("resultCode")) {
                Object resultCodeObj = status.get("resultCode");
                int resultCode;
                
                // Handle different types of resultCode (Integer or String)
                if (resultCodeObj instanceof Integer) {
                    resultCode = (Integer) resultCodeObj;
                } else if (resultCodeObj instanceof String) {
                    // Try to parse the string as an integer
                    try {
                        resultCode = Integer.parseInt((String) resultCodeObj);
                    } catch (NumberFormatException e) {
                        // If parsing fails, consider it as an error
                        System.out.println("MomoPaymentController: Invalid resultCode format: " + resultCodeObj);
                        return ResponseEntity.ok(ApiResponse.error(400, "Invalid result code format"));
                    }
                } else {
                    // Unknown type or null
                    System.out.println("MomoPaymentController: Unknown resultCode type: " + 
                                      (resultCodeObj != null ? resultCodeObj.getClass().getName() : "null"));
                    return ResponseEntity.ok(ApiResponse.error(400, "Unknown result code type"));
                }
                
                // Now we have resultCode as an int
                if (resultCode != 0 && resultCode != 1006 && resultCode != 1005) {
                    // Log the error response
                    System.out.println("MomoPaymentController: Error in status check: " + status);
                    
                    // Get message from status, with null check
                    String errorMessage = "Error in payment";
                    if (status.containsKey("message") && status.get("message") != null) {
                        Object messageObj = status.get("message");
                        errorMessage = messageObj.toString();
                    }
                    
                    // Still return 200 OK but with error details in the payload
                    // This helps the frontend handle the error better
                    return ResponseEntity.ok(ApiResponse.error(resultCode, errorMessage));
                }
            }
            
            return ResponseEntity.ok(ApiResponse.success(status));
        } catch (Exception e) {
            System.err.println("MomoPaymentController: Exception in status check: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("orderId", orderId);
            errorResponse.put("resultCode", 9999);
            errorResponse.put("message", "Server error: " + e.getMessage());
            return ResponseEntity.ok(ApiResponse.error(9999, "Error checking payment status"));
        }
    }

    @PostMapping("/ipn")
    public ResponseEntity<String> handleIpnCallback(@RequestBody String requestBody) {
        try {
            Map<String, Object> requestMap = new ObjectMapper().readValue(requestBody, 
                new TypeReference<Map<String, Object>>() {});
            momoPaymentService.processIpnCallback(requestMap);
            return ResponseEntity.ok("{\"status\":\"ok\"}");
        } catch (Exception e) {
            System.err.println("Error processing IPN callback: " + e.getMessage());
            return ResponseEntity.badRequest().body("{\"status\":\"error\",\"code\":400,\"message\":\"" + e.getMessage() + "\"}");
        }
    }
} 