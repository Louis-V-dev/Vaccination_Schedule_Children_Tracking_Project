package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_methods")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentMethod {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "method_id")
    Long id;
    
    @Column(name = "name", nullable = false)
    String name;
    
    @Column(name = "code", nullable = false, unique = true)
    String code;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    PaymentMethodType type;
    
    @Column(name = "description", length = 500)
    String description;
    
    @Column(name = "logo_url")
    String logoUrl;
    
    @Column(name = "api_endpoint")
    String apiEndpoint;
    
    @Column(name = "merchant_id")
    String merchantId;
    
    @Column(name = "public_key")
    String publicKey;
    
    @Column(name = "is_active", nullable = false)
    Boolean isActive = true;
    
    @Column(name = "is_online", nullable = false)
    Boolean isOnline = true;
    
    @Column(name = "display_order")
    Integer displayOrder = 0;
    
    @Column(name = "display_instructions", length = 1000)
    String displayInstructions;
    
    @Column(name = "created_at")
    LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

/**
 * Enum representing the various payment methods available for transactions
 */
