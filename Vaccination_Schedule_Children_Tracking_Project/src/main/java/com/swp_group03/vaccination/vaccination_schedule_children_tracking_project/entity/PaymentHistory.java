package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    Long id;
    
    @ManyToOne
    @JoinColumn(name = "payment_id", nullable = false)
    Payment payment;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status")
    PaymentStatus status;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false)
    PaymentStatus newStatus;
    
    @Column(name = "action_type", nullable = false)
    String actionType;
    
    @Column(name = "description", length = 1000)
    String description;
    
    @ManyToOne
    @JoinColumn(name = "performed_by")
    Account performedBy;
    
    @Column(name = "ip_address")
    String ipAddress;
    
    @Column(name = "user_agent", length = 500)
    String userAgent;
    
    @Column(name = "timestamp", nullable = false)
    LocalDateTime timestamp;
    
    @Column(name = "notes", length = 1000)
    String notes;
    
    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
} 