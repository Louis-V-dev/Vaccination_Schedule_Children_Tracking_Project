package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    Account user;
    

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    BigDecimal amount;
    
    @Column(name = "discount_amount", precision = 10, scale = 2)
    BigDecimal discountAmount;
    
    @Column(name = "tax_amount", precision = 10, scale = 2)
    BigDecimal taxAmount;
    
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    BigDecimal totalAmount;
    
    @ManyToOne
    @JoinColumn(name = "payment_method_id")
    PaymentMethod paymentMethod;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    PaymentStatus status;
    
    @Column(name = "transaction_id")
    String transactionId;
    
    @Column(name = "reference_number")
    String referenceNumber;
    
    @Column(name = "receipt_number")
    String receiptNumber;
    
    @Column(name = "gateway_response", length = 1000)
    String gatewayResponse;
    
    @Column(name = "gateway_transaction_id")
    String gatewayTransactionId;
    
    @ManyToOne
    @JoinColumn(name = "recorded_by")
    Account recordedBy;
    
    @OneToMany(mappedBy = "payment", cascade = CascadeType.ALL, orphanRemoval = true)
    List<PaymentHistory> history = new ArrayList<>();
    
    @Column(name = "payment_date")
    LocalDateTime paymentDate;
    
    @Column(name = "expiration_date")
    LocalDateTime expirationDate;
    
    @Column(name = "notes", length = 1000)
    String notes;
    
    @Column(name = "created_at")
    LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        
        if (status == null) {
            status = PaymentStatus.PENDING;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    

    
    /**
     * Add a payment history entry to this payment
     * @param historyEntry The history entry to add
     */
    public void addHistoryEntry(PaymentHistory historyEntry) {
        history.add(historyEntry);
        historyEntry.setPayment(this);
    }
} 