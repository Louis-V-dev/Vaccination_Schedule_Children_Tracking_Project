package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Appointment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.WorkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.workSchedule = :workSchedule AND a.timeSlot = :timeSlot AND a.status NOT IN ('CANCELLED', 'COMPLETED', 'NO_SHOW')")
    int countActiveAppointmentsInTimeSlot(WorkSchedule workSchedule, String timeSlot);
    
    List<Appointment> findByWorkScheduleAndStatusNotIn(WorkSchedule workSchedule, List<String> excludedStatuses);
    
    @Query("SELECT a FROM Appointment a WHERE a.appointmentTime >= :startTime AND a.appointmentTime < :endTime AND a.status NOT IN ('CANCELLED', 'COMPLETED', 'NO_SHOW')")
    List<Appointment> findActiveAppointmentsForDay(LocalDateTime startTime, LocalDateTime endTime);
} 