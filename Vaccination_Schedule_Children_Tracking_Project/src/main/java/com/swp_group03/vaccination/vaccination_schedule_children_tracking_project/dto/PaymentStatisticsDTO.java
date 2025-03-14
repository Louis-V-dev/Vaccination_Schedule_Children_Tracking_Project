package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatisticsDTO {
    private BigDecimal totalRevenue;
    private Long totalTransactions;
    private BigDecimal averageTransaction;
    private Map<String, Long> statusDistribution;
    private Map<String, Long> paymentMethodDistribution;
    private Map<String, BigDecimal> dailyRevenue;
    private Map<String, BigDecimal> monthlyRevenue;
    private BigDecimal totalRefunded;
    private Long pendingTransactions;
    private Long completedTransactions;
    private Long failedTransactions;
    private BigDecimal successRate;
} 