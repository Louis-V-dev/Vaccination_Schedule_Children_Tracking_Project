package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PostVaccinationCare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostVaccinationCareRepository extends JpaRepository<PostVaccinationCare, Long> {
    
    Optional<PostVaccinationCare> findByAppointmentVaccineId(Long appointmentVaccineId);
    
    List<PostVaccinationCare> findByStaffAccountId(String staffId);
    
    @Query("SELECT p FROM PostVaccinationCare p WHERE p.staff.accountId = :staffId")
    List<PostVaccinationCare> findByStaffIdCustom(@Param("staffId") String staffId);
} 