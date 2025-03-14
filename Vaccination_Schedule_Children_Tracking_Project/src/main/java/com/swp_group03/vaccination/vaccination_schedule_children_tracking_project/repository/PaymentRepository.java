package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Payment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    /**
     * Find all payments for a specific user
     * @param user The user to find payments for
     * @return List of payments for the user
     */
    List<Payment> findByUser(Account user);
    
    /**
     * Find all payments for a specific user with pagination
     * @param user The user to find payments for
     * @param pageable Pagination information
     * @return Page of payments for the user
     */
    Page<Payment> findByUser(Account user, Pageable pageable);
    
    /**
     * Find all payments with a specific status
     * @param status The payment status to filter by
     * @return List of payments with the specified status
     */
    List<Payment> findByStatus(PaymentStatus status);
    
    /**
     * Find all payments with a specific status with pagination
     * @param status The payment status to filter by
     * @param pageable Pagination information
     * @return Page of payments with the specified status
     */
    Page<Payment> findByStatus(PaymentStatus status, Pageable pageable);
    
    /**
     * Find all payments for a specific user with a specific status
     * @param user The user to find payments for
     * @param status The payment status to filter by
     * @return List of payments for the user with the specified status
     */
    List<Payment> findByUserAndStatus(Account user, PaymentStatus status);
    
    /**
     * Find all payments for a specific user with a specific status with pagination
     * @param user The user to find payments for
     * @param status The payment status to filter by
     * @param pageable Pagination information
     * @return Page of payments for the user with the specified status
     */
    Page<Payment> findByUserAndStatus(Account user, PaymentStatus status, Pageable pageable);
    
    /**
     * Find all payments created between two dates
     * @param startDate The start date
     * @param endDate The end date
     * @return List of payments created between the specified dates
     */
    List<Payment> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find all payments created between two dates with pagination
     * @param startDate The start date
     * @param endDate The end date
     * @param pageable Pagination information
     * @return Page of payments created between the specified dates
     */
    Page<Payment> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);
    
    /**
     * Find payment by transaction ID
     * @param transactionId The transaction ID to search for
     * @return Optional containing the payment if found
     */
    Optional<Payment> findByTransactionId(String transactionId);
    
    /**
     * Find payment by reference number
     * @param referenceNumber The reference number to search for
     * @return Optional containing the payment if found
     */
    Optional<Payment> findByReferenceNumber(String referenceNumber);
    
    /**
     * Find payment by receipt number
     * @param receiptNumber The receipt number to search for
     * @return Optional containing the payment if found
     */
    Optional<Payment> findByReceiptNumber(String receiptNumber);
    
    /**
     * Find all expired payments that are still in PENDING status
     * @param currentDateTime The current date and time
     * @return List of expired pending payments
     */
    @Query("SELECT p FROM Payment p WHERE p.status = 'PENDING' AND p.expirationDate < :currentDateTime")
    List<Payment> findExpiredPendingPayments(@Param("currentDateTime") LocalDateTime currentDateTime);
    
    /**
     * Count the number of payments by status
     * @param status The payment status to count
     * @return The number of payments with the specified status
     */
    long countByStatus(PaymentStatus status);
    
    /**
     * Find the most recent payments with pagination
     * @param pageable Pagination information
     * @return Page of payments ordered by creation date (descending)
     */
    Page<Payment> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /**
     * Find payments by user ID with pagination
     * @param userId The user ID to find payments for
     * @param pageable Pagination information
     * @return Page of payments for the specified user
     */
    Page<Payment> findByUser_AccountId(String userId, Pageable pageable);

    /**
     * Find payments by status and expiration date before a specific date with pagination
     * @param status The payment status to filter by
     * @param expirationDate The expiration date to compare against
     * @param pageable Pagination information
     * @return Page of payments matching the criteria
     */
    Page<Payment> findByStatusAndExpirationDateBefore(
            PaymentStatus status,
            LocalDateTime expirationDate,
            Pageable pageable
    );
} 