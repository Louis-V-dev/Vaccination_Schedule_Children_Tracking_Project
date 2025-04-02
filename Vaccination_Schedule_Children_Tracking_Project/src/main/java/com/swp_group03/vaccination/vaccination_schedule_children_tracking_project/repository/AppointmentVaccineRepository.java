package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.AppointmentVaccine;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccinationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentVaccineRepository extends JpaRepository<AppointmentVaccine, Long> {
    
    List<AppointmentVaccine> findByAppointmentId(Long appointmentId);
    
    List<AppointmentVaccine> findByAppointmentIdAndStatus(Long appointmentId, VaccinationStatus status);
} 