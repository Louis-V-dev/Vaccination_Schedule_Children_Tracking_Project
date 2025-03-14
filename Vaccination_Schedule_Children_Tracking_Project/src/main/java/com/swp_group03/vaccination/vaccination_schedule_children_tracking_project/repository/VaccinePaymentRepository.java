package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Child;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Payment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccinePackage;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccinePayment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VaccinePaymentRepository extends JpaRepository<VaccinePayment, Long> {
    
    /**
     * Find all vaccine payments for a specific child
     * @param child The child to find payments for
     * @return List of vaccine payments for the child
     */
    List<VaccinePayment> findByChild(Child child);
    
    /**
     * Find all vaccine payments for a specific child with pagination
     * @param child The child to find payments for
     * @param pageable Pagination information
     * @return Page of vaccine payments for the child
     */
    Page<VaccinePayment> findByChild(Child child, Pageable pageable);
    
    /**
     * Find all vaccine payments for a specific guardian
     * @param guardian The guardian to find payments for
     * @return List of vaccine payments for the guardian
     */
    List<VaccinePayment> findByGuardian(Account guardian);
    
    /**
     * Find all vaccine payments for a specific guardian with pagination
     * @param guardian The guardian to find payments for
     * @param pageable Pagination information
     * @return Page of vaccine payments for the guardian
     */
    Page<VaccinePayment> findByGuardian(Account guardian, Pageable pageable);
    
    /**
     * Find all vaccine payments for a specific payment
     * @param payment The payment to find vaccine payments for
     * @return List of vaccine payments for the payment
     */
    List<VaccinePayment> findByPayment(Payment payment);
    
    /**
     * Find all vaccine payments for a specific vaccine package
     * @param vaccinePackage The vaccine package to find payments for
     * @return List of vaccine payments for the vaccine package
     */
    List<VaccinePayment> findByVaccinePackage(VaccinePackage vaccinePackage);
    
    /**
     * Find all vaccine payments that are for packages
     * @return List of vaccine payments for packages
     */
    List<VaccinePayment> findByIsPackageTrue();
    
    /**
     * Find all vaccine payments that are for individual vaccines
     * @return List of vaccine payments for individual vaccines
     */
    List<VaccinePayment> findByIsPackageFalse();
} 