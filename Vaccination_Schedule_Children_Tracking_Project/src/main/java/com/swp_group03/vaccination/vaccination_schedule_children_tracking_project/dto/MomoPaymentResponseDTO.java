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
public class MomoPaymentResponseDTO {
    private String partnerCode;
    private String orderId;
    private String requestId;
    private String amount;
    private String responseTime;
    private String message;
    private Integer resultCode;
    private String payUrl;
    private String qrCodeUrl;
    private String deeplink;
    private String deeplinkWebInApp;
    
    private String paymentUrl;
    private String transactionId;
    private BigDecimal amountDecimal;
} 