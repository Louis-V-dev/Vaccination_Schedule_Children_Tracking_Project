package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Payment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PaymentStatus;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PaymentHistory;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.PaymentRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.dto.PaymentStatisticsDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    public Page<Payment> getAllPayments(Pageable pageable) {
        return paymentRepository.findAllByOrderByCreatedAtDesc(pageable);
    }
    
    // New method that doesn't have built-in sorting
    public Page<Payment> getAllPaymentsPageable(Pageable pageable) {
        return paymentRepository.findAll(pageable);
    }

    public Page<Payment> getPaymentsByStatus(String status, Pageable pageable) {
        PaymentStatus paymentStatus = PaymentStatus.valueOf(status.toUpperCase());
        return paymentRepository.findByStatus(paymentStatus, pageable);
    }

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));
    }

    @Transactional
    public Payment updatePaymentStatus(Long id, String status) {
        Payment payment = getPaymentById(id);
        PaymentStatus newStatus = PaymentStatus.valueOf(status.toUpperCase());
        
        // Create payment history entry
        payment.addHistoryEntry(PaymentHistory.builder()
                .status(payment.getStatus())
                .newStatus(newStatus)
                .actionType("STATUS_UPDATE")
                .description("Payment status updated from " + payment.getStatus() + " to " + newStatus)
                .build());
        
        payment.setStatus(newStatus);
        return paymentRepository.save(payment);
    }

    public Page<Payment> getUserPayments(String userId, Pageable pageable) {
        return paymentRepository.findByUser_AccountId(userId, pageable);
    }
    
    // New method that doesn't have built-in sorting
    public Page<Payment> getUserPaymentsPageable(String userId, Pageable pageable) {
        return paymentRepository.findByUser_AccountId(userId, pageable);
    }

    public Page<Payment> getExpiredPayments(Pageable pageable) {
        return paymentRepository.findByStatusAndExpirationDateBefore(
                PaymentStatus.PENDING,
                LocalDateTime.now(),
                pageable
        );
    }
    
    // New method that doesn't have built-in sorting
    public Page<Payment> getExpiredPaymentsPageable(Pageable pageable) {
        return paymentRepository.findByStatusAndExpirationDateBefore(
                PaymentStatus.PENDING,
                LocalDateTime.now(),
                pageable
        );
    }

    public PaymentStatisticsDTO getPaymentStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        List<Payment> payments = paymentRepository.findByCreatedAtBetween(startDate, endDate);
        
        // Calculate basic statistics
        BigDecimal totalRevenue = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .map(Payment::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        long totalTransactions = payments.size();
        
        BigDecimal averageTransaction = totalTransactions > 0 
                ? totalRevenue.divide(BigDecimal.valueOf(totalTransactions), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Calculate status distribution
        Map<String, Long> statusDistribution = payments.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getStatus().toString(),
                        Collectors.counting()
                ));

        // Calculate payment method distribution
        Map<String, Long> methodDistribution = payments.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getPaymentMethod().getCode(),
                        Collectors.counting()
                ));

        // Calculate daily revenue
        Map<String, BigDecimal> dailyRevenue = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .collect(Collectors.groupingBy(
                        p -> p.getCreatedAt().format(DateTimeFormatter.ISO_DATE),
                        Collectors.mapping(
                                Payment::getTotalAmount,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                        )
                ));

        // Calculate monthly revenue
        Map<String, BigDecimal> monthlyRevenue = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .collect(Collectors.groupingBy(
                        p -> p.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.mapping(
                                Payment::getTotalAmount,
                                Collectors.reducing(BigDecimal.ZERO, BigDecimal::add)
                        )
                ));

        // Calculate additional metrics
        BigDecimal totalRefunded = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.REFUNDED)
                .map(Payment::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingTransactions = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING)
                .count();

        long completedTransactions = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.COMPLETED)
                .count();

        long failedTransactions = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.FAILED)
                .count();

        BigDecimal successRate = totalTransactions > 0
                ? BigDecimal.valueOf(completedTransactions)
                        .divide(BigDecimal.valueOf(totalTransactions), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        return PaymentStatisticsDTO.builder()
                .totalRevenue(totalRevenue)
                .totalTransactions(totalTransactions)
                .averageTransaction(averageTransaction)
                .statusDistribution(statusDistribution)
                .paymentMethodDistribution(methodDistribution)
                .dailyRevenue(dailyRevenue)
                .monthlyRevenue(monthlyRevenue)
                .totalRefunded(totalRefunded)
                .pendingTransactions(pendingTransactions)
                .completedTransactions(completedTransactions)
                .failedTransactions(failedTransactions)
                .successRate(successRate)
                .build();
    }
} 