package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Appointment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Child;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    /**
     * Find appointments by child
     */
    List<Appointment> findByChild(Child child);
    
    /**
     * Find appointments by child with pagination
     */
    Page<Appointment> findByChild(Child child, Pageable pageable);
    
    /**
     * Search appointments by various criteria
     */
    @Query("SELECT a FROM Appointment a WHERE " +
           "(:childId IS NULL OR a.child.child_id = :childId) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:startDate IS NULL OR a.appointmentDate >= :startDate) AND " +
           "(:endDate IS NULL OR a.appointmentDate <= :endDate)")
    List<Appointment> searchAppointments(
            @Param("childId") String childId,
            @Param("status") String status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
    
    /**
     * Search appointments by various criteria with pagination
     */
    @Query("SELECT a FROM Appointment a WHERE " +
           "(:childId IS NULL OR a.child.child_id = :childId) AND " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:startDate IS NULL OR a.appointmentDate >= :startDate) AND " +
           "(:endDate IS NULL OR a.appointmentDate <= :endDate)")
    Page<Appointment> searchAppointments(
            @Param("childId") String childId,
            @Param("status") String status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);
} 