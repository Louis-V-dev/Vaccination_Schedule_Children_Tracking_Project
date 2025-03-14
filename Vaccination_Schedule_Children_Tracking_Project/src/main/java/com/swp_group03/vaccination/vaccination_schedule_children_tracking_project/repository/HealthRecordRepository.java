package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Appointment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Child;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.HealthRecord;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccinationEligibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface HealthRecordRepository extends JpaRepository<HealthRecord, Long> {
    
    /**
     * Find a health record by appointment ID
     * @param appointment The appointment
     * @return Optional health record
     */
    Optional<HealthRecord> findByAppointment(Appointment appointment);
    
    /**
     * Find all health records for a specific child
     * @param child The child
     * @return List of health records
     */
    List<HealthRecord> findByChild(Child child);
    
    /**
     * Find all health records for a specific child with pagination
     * @param child The child
     * @param pageable Pagination information
     * @return Page of health records
     */
    Page<HealthRecord> findByChild(Child child, Pageable pageable);
    
    /**
     * Find all health records created by a specific doctor
     * @param doctor The doctor
     * @return List of health records
     */
    List<HealthRecord> findByDoctor(Account doctor);
    
    /**
     * Find all health records created by a specific doctor with pagination
     * @param doctor The doctor
     * @param pageable Pagination information
     * @return Page of health records
     */
    Page<HealthRecord> findByDoctor(Account doctor, Pageable pageable);
    
    /**
     * Find all health records with a specific vaccination eligibility status
     * @param eligibility The eligibility status
     * @return List of health records
     */
    List<HealthRecord> findByEligibility(VaccinationEligibility eligibility);
    
    /**
     * Find all health records recorded between two dates
     * @param start The start date and time
     * @param end The end date and time
     * @return List of health records
     */
    List<HealthRecord> findByRecordedAtBetween(LocalDateTime start, LocalDateTime end);
    
    /**
     * Find health records for a specific child with a specific eligibility status
     * @param child The child
     * @param eligibility The eligibility status
     * @return List of health records
     */
    List<HealthRecord> findByChildAndEligibility(Child child, VaccinationEligibility eligibility);
    
    /**
     * Find health records scheduled for rescheduling on a specific date
     * @param date The rescheduled date
     * @return List of health records
     */
    List<HealthRecord> findByRescheduledDate(LocalDate date);
    
    /**
     * Search health records by multiple criteria
     * @param childId Optional child ID
     * @param doctorId Optional doctor ID
     * @param eligibility Optional eligibility status
     * @param startDate Optional start date for the search range
     * @param endDate Optional end date for the search range
     * @return List of matching health records
     */
    @Query("SELECT hr FROM HealthRecord hr WHERE " +
           "(:childId IS NULL OR hr.child.child_id = :childId) AND " +
           "(:doctorId IS NULL OR hr.doctor.accountId = :doctorId) AND " +
           "(:eligibility IS NULL OR hr.eligibility = :eligibility) AND " +
           "(:startDate IS NULL OR hr.recordedAt >= :startDate) AND " +
           "(:endDate IS NULL OR hr.recordedAt <= :endDate)")
    List<HealthRecord> searchHealthRecords(
            @Param("childId") String childId,
            @Param("doctorId") String doctorId,
            @Param("eligibility") VaccinationEligibility eligibility,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
} 