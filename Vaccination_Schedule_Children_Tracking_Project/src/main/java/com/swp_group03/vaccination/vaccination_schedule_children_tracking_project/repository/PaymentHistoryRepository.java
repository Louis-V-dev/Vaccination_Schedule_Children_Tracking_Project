package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Payment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PaymentHistory;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentHistoryRepository extends JpaRepository<PaymentHistory, Long> {
    
    /**
     * Find all history entries for a specific payment
     * @param payment The payment to find history for
     * @return List of history entries for the payment
     */
    List<PaymentHistory> findByPayment(Payment payment);
    
    /**
     * Find all history entries for a specific payment with pagination
     * @param payment The payment to find history for
     * @param pageable Pagination information
     * @return Page of history entries for the payment
     */
    Page<PaymentHistory> findByPayment(Payment payment, Pageable pageable);
    
    /**
     * Find all history entries for a specific payment ordered by timestamp (descending)
     * @param payment The payment to find history for
     * @return List of history entries for the payment ordered by timestamp
     */
    List<PaymentHistory> findByPaymentOrderByTimestampDesc(Payment payment);
    
    /**
     * Find all history entries for a specific payment ordered by timestamp (descending) with pagination
     * @param payment The payment to find history for
     * @param pageable Pagination information
     * @return Page of history entries for the payment ordered by timestamp
     */
    Page<PaymentHistory> findByPaymentOrderByTimestampDesc(Payment payment, Pageable pageable);
    
    /**
     * Find all history entries with a specific new status
     * @param newStatus The new status to filter by
     * @return List of history entries with the specified new status
     */
    List<PaymentHistory> findByNewStatus(PaymentStatus newStatus);
    
    /**
     * Find all history entries with a specific previous status
     * @param status The previous status to filter by
     * @return List of history entries with the specified previous status
     */
    List<PaymentHistory> findByStatus(PaymentStatus status);
    
    /**
     * Find all history entries with a specific action type
     * @param actionType The action type to filter by
     * @return List of history entries with the specified action type
     */
    List<PaymentHistory> findByActionType(String actionType);
    
    /**
     * Find all history entries created between two dates
     * @param startDate The start date
     * @param endDate The end date
     * @return List of history entries created between the specified dates
     */
    List<PaymentHistory> findByTimestampBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find all history entries created between two dates with pagination
     * @param startDate The start date
     * @param endDate The end date
     * @param pageable Pagination information
     * @return Page of history entries created between the specified dates
     */
    Page<PaymentHistory> findByTimestampBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
} 