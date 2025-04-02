package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.HealthRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HealthRecordRepository extends JpaRepository<HealthRecord, Long> {
    
    Optional<HealthRecord> findByAppointmentVaccineId(Long appointmentVaccineId);
    
    List<HealthRecord> findByDoctorAccountId(String doctorId);
    
    @Query("SELECT h FROM HealthRecord h WHERE h.doctor.accountId = :doctorId")
    List<HealthRecord> findByDoctorIdCustom(@Param("doctorId") String doctorId);
} 