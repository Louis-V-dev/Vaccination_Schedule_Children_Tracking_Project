package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
    
    /**
     * Find payment method by its unique code
     * @param code The payment method code
     * @return Optional containing the payment method if found
     */
    Optional<PaymentMethod> findByCode(String code);
    
    /**
     * Check if a payment method with the given code exists
     * @param code The payment method code to check
     * @return true if exists, false otherwise
     */
    boolean existsByCode(String code);
    
    /**
     * Find all active payment methods
     * @return List of active payment methods
     */
    List<PaymentMethod> findByIsActiveTrue();
    
    /**
     * Find all online payment methods
     * @return List of online payment methods
     */
    List<PaymentMethod> findByIsOnlineTrue();
    
    /**
     * Find all active and online payment methods
     * @return List of active and online payment methods
     */
    List<PaymentMethod> findByIsActiveTrueAndIsOnlineTrue();
    
    /**
     * Find all payment methods of a specific type
     * @param type The payment method type
     * @return List of payment methods of the specified type
     */
    List<PaymentMethod> findByType(String type);
    
    /**
     * Find all payment methods ordered by display order
     * @return List of payment methods ordered by display order
     */
    List<PaymentMethod> findAllByOrderByDisplayOrderAsc();
} 