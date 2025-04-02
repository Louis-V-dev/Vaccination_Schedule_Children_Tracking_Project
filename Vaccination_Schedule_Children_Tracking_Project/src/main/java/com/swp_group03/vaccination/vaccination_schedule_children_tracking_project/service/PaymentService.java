package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.PaymentMethodRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.PaymentRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.dto.PaymentStatisticsDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ResourceNotFoundException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.AppointmentRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.UserRepo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepo userRepo;
    private final PaymentMethodRepository paymentMethodRepository;
    
    @Value("${momo.payment.endpoint:https://test-payment.momo.vn}")
    private String momoPaymentEndpoint;
    
    @Value("${momo.partner.code:MOMOTEST}")
    private String momoPartnerCode;
    
    @Value("${momo.access.key:F8BBA842ECF85}")
    private String momoAccessKey;
    
    @Value("${momo.secret.key:K951B6PE1waDMi640GTZtD887MQU0zYV}")
    private String momoSecretKey;
    
    @Value("${app.return.url:http://localhost:8080/api/payment/momo/callback}")
    private String returnUrl;
    
    @Autowired
    public PaymentService(
        PaymentRepository paymentRepository,
        AppointmentRepository appointmentRepository,
        UserRepo userRepo,
        PaymentMethodRepository paymentMethodRepository) {
        
        this.paymentRepository = paymentRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepo = userRepo;
        this.paymentMethodRepository = paymentMethodRepository;
    }

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

    /**
     * Process a cash payment for an appointment
     */
    @Transactional
    public Payment processCashPayment(
        Appointment appointment,
        Double amountPaid,
        String receivedBy,
        String notes) {
        
        log.info("Processing cash payment for appointment ID: {} with amount: {}", 
            appointment.getId(), amountPaid);
        
        // Validate amount paid
        if (amountPaid < appointment.getTotalAmount()) {
            log.error("Amount paid {} is less than required amount {}", 
                amountPaid, appointment.getTotalAmount());
            throw new AppException(ErrorCode.INSUFFICIENT_PAYMENT, 
                "Amount paid must be at least equal to the total amount");
        }
        
        // Find the CASH payment method
        PaymentMethod cashPaymentMethod = paymentMethodRepository.findByType(PaymentMethodType.CASH)
            .orElseThrow(() -> new AppException(ErrorCode.INVALID_PAYMENT_METHOD, "Cash payment method not found"));
        
        // Create payment record with notes containing received by information
        String paymentNotes = "Received by: " + receivedBy;
        if (notes != null && !notes.isEmpty()) {
            paymentNotes += ". " + notes;
        }
        
        // Get user from appointment if available, or use default system account
        Account user = appointment.getChild().getAccount_Id();
        
        Payment payment = Payment.builder()
            .appointment(appointment)
            .user(user)
            .amount(BigDecimal.valueOf(appointment.getTotalAmount()))
            .totalAmount(BigDecimal.valueOf(appointment.getTotalAmount()))
            .paymentMethod(cashPaymentMethod)
            .paymentDate(LocalDateTime.now())
            .status(PaymentStatus.COMPLETED)
            .transactionId(generateTransactionId())
            .notes(paymentNotes)
            .build();
        
        // Save payment record
        payment = paymentRepository.save(payment);
        
        // Update appointment payment reference
        appointment.setPayment(payment);
        appointmentRepository.save(appointment);
        
        log.info("Cash payment processed successfully with transaction ID: {}", 
            payment.getTransactionId());
        
        return payment;
    }
    
    /**
     * Generate a MoMo payment URL for an appointment
     */
    public String generateMomoPaymentUrl(Appointment appointment) {
        log.info("Generating MoMo payment URL for appointment ID: {}", appointment.getId());
        
        String orderId = "ORDER_" + appointment.getId() + "_" + System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString();
        
        // In a real implementation, we would use the MoMo API to generate a payment URL
        // For demonstration, we'll just create a dummy URL
        String paymentUrl = momoPaymentEndpoint + 
            "/pay/app?partnerCode=" + momoPartnerCode +
            "&orderId=" + orderId +
            "&requestId=" + requestId +
            "&amount=" + appointment.getTotalAmount() +
            "&orderInfo=Payment for appointment " + appointment.getId() +
            "&returnUrl=" + returnUrl + "/success/" + appointment.getId() +
            "&notifyUrl=" + returnUrl + "/notify" +
            "&extraData=";
        
        log.info("Generated MoMo payment URL: {}", paymentUrl);
        
        // Find the MOMO payment method
        PaymentMethod momoPaymentMethod = paymentMethodRepository.findByType(PaymentMethodType.MOMO)
            .orElseThrow(() -> new AppException(ErrorCode.INVALID_PAYMENT_METHOD, "MoMo payment method not found"));
        
        // Get user from appointment if available, or use default system account
        Account user = appointment.getChild().getAccount_Id();
        
        // Create a pending payment record
        Payment payment = Payment.builder()
            .appointment(appointment)
            .user(user)
            .amount(BigDecimal.valueOf(appointment.getTotalAmount()))
            .totalAmount(BigDecimal.valueOf(appointment.getTotalAmount()))
            .paymentMethod(momoPaymentMethod)
            .paymentDate(LocalDateTime.now())
            .status(PaymentStatus.PENDING)
            .transactionId(orderId)
            .notes("MoMo payment initiated")
            .build();
        
        // Save payment record
        paymentRepository.save(payment);
        
        // Update appointment payment reference
        appointment.setPayment(payment);
        appointmentRepository.save(appointment);
        
        return paymentUrl;
    }
    
    /**
     * Process a successful MoMo payment callback
     */
    @Transactional
    public Payment processMomoPaymentCallback(
        String orderId,
        String transactionId,
        String amount) {
        
        log.info("Processing MoMo payment callback for order ID: {}", orderId);
        
        // Find the payment by transactionId
        Payment payment = paymentRepository.findByTransactionId(orderId)
            .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
        
        // Update payment status
        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setTransactionId(transactionId);
        payment.setNotes("MoMo payment completed");
        payment = paymentRepository.save(payment);
        
        // Get the appointment
        Appointment appointment = payment.getAppointment();
        
        // Update appointment status
        appointment.setStatus(AppointmentStatus.CHECKED_IN);
        appointment.setPaid(true);
        appointmentRepository.save(appointment);
        
        log.info("MoMo payment processed successfully with transaction ID: {}", transactionId);
        
        return payment;
    }
    
    /**
     * Generate a transaction ID for cash payments
     */
    private String generateTransactionId() {
        return "CASH_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase() + 
            "_" + System.currentTimeMillis();
    }
} 