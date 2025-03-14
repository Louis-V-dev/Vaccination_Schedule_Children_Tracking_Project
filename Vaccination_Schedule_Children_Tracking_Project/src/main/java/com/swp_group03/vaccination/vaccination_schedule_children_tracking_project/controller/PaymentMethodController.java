package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PaymentMethod;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.PaymentMethodService;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment-methods")
@CrossOrigin(origins = "*")
public class PaymentMethodController {

    @Autowired
    private PaymentMethodService paymentMethodService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentMethod>>> getAllPaymentMethods() {
        List<PaymentMethod> methods = paymentMethodService.getAllPaymentMethods();
        return ResponseEntity.ok(ApiResponse.success(methods));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentMethod>> getPaymentMethodById(@PathVariable Long id) {
        PaymentMethod method = paymentMethodService.getPaymentMethodById(id);
        return ResponseEntity.ok(ApiResponse.success(method));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaymentMethod>> createPaymentMethod(@RequestBody PaymentMethod paymentMethod) {
        PaymentMethod createdMethod = paymentMethodService.createPaymentMethod(paymentMethod);
        return ResponseEntity.ok(ApiResponse.success(createdMethod));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaymentMethod>> updatePaymentMethod(
            @PathVariable Long id,
            @RequestBody PaymentMethod paymentMethod) {
        PaymentMethod updatedMethod = paymentMethodService.updatePaymentMethod(id, paymentMethod);
        return ResponseEntity.ok(ApiResponse.success(updatedMethod));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePaymentMethod(@PathVariable Long id) {
        paymentMethodService.deletePaymentMethod(id);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<PaymentMethod>>> getActivePaymentMethods() {
        List<PaymentMethod> activeMethods = paymentMethodService.getActivePaymentMethods();
        return ResponseEntity.ok(ApiResponse.success(activeMethods));
    }

    @GetMapping("/online")
    public ResponseEntity<ApiResponse<List<PaymentMethod>>> getOnlinePaymentMethods() {
        List<PaymentMethod> onlineMethods = paymentMethodService.getOnlinePaymentMethods();
        return ResponseEntity.ok(ApiResponse.success(onlineMethods));
    }
} 