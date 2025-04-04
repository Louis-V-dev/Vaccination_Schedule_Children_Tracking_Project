package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PendingVaccineRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PendingVaccineRequestRepository extends JpaRepository<PendingVaccineRequest, Long> {
    List<PendingVaccineRequest> findByAppointmentId(Long appointmentId);
    void deleteByAppointmentId(Long appointmentId);
} 