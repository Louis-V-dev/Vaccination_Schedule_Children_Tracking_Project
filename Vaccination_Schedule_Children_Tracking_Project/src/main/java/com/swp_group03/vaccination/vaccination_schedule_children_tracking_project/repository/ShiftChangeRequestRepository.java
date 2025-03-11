package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.ShiftChangeRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.WorkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShiftChangeRequestRepository extends JpaRepository<ShiftChangeRequest, String> {
    List<ShiftChangeRequest> findByRequester(Account requester);
    List<ShiftChangeRequest> findByTarget(Account target);
    List<ShiftChangeRequest> findByOriginalScheduleAndStatus(WorkSchedule schedule, String status);
    
    @Query("SELECT r FROM ShiftChangeRequest r WHERE r.targetStatus = 'APPROVED' AND r.adminStatus = 'PENDING'")
    List<ShiftChangeRequest> findPendingAdminApproval();
    
    @Query("SELECT r FROM ShiftChangeRequest r ORDER BY r.requestTime DESC")
    List<ShiftChangeRequest> findAllOrderByRequestTimeDesc();
} 