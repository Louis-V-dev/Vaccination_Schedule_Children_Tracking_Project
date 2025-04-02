package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccinationRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VaccinationRecordRepository extends JpaRepository<VaccinationRecord, Long> {
    
    Optional<VaccinationRecord> findByAppointmentVaccineId(Long appointmentVaccineId);
    
    List<VaccinationRecord> findByNurseAccountId(String nurseId);
    
    @Query("SELECT v FROM VaccinationRecord v WHERE v.nurse.accountId = :nurseId")
    List<VaccinationRecord> findByNurseIdCustom(@Param("nurseId") String nurseId);
} 