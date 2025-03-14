package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

/**
 * Enum representing the various states a payment can be in throughout its lifecycle
 */
public enum PaymentStatus {
    /**
     * Payment has been initiated but not yet processed
     */
    PENDING,
    
    /**
     * Payment is currently being processed by the payment gateway
     */
    PROCESSING,
    
    /**
     * Payment has been successfully completed
     */
    COMPLETED,
    
    /**
     * Payment was declined by the payment gateway or financial institution
     */
    DECLINED,
    
    /**
     * Payment was cancelled by the user before processing
     */
    CANCELLED,
    
    /**
     * Payment was refunded back to the user
     */
    REFUNDED,
    
    /**
     * Payment was partially refunded back to the user
     */
    PARTIALLY_REFUNDED,
    
    /**
     * Payment failed due to technical or other issues
     */
    FAILED,
    
    /**
     * Payment has expired (e.g., pending payment not completed within timeframe)
     */
    EXPIRED,
    
    /**
     * Payment is on hold pending review or additional verification
     */
    ON_HOLD,
    
    /**
     * Payment is disputed by the customer
     */
    DISPUTED
} 