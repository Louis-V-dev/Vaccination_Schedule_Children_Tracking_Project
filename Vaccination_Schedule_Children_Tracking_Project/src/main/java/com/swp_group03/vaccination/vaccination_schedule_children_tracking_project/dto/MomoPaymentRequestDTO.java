package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MomoPaymentRequestDTO {
    private Long appointmentId;
    private BigDecimal amount;
    private String orderInfo;
    private String orderId; // Optional - will be generated if not provided
    private String returnUrl; // URL to redirect after payment
    private String notifyUrl; // IPN URL
    private String extraData; // Additional data in JSON
    private String requestType; // Payment method: captureWallet, payWithATM, payWithCC, payWithMoMo
} 