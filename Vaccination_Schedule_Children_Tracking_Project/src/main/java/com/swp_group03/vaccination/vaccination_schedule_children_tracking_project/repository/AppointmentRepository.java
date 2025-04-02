package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Appointment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Child;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Payment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.WorkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.AppointmentStatus;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByChild(Child child);
    
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.workSchedule = :schedule AND a.timeSlot = :timeSlot AND a.status NOT IN ('CANCELLED', 'NO_SHOW')")
    int countActiveAppointmentsInTimeSlot(@Param("schedule") WorkSchedule schedule, @Param("timeSlot") String timeSlot);
    
    List<Appointment> findByPayment(Payment payment);
    
    List<Appointment> findByWorkScheduleAndStatusNotIn(WorkSchedule workSchedule, List<String> excludedStatuses);
    
    @Query("SELECT a FROM Appointment a WHERE a.appointmentTime >= :startTime AND a.appointmentTime < :endTime AND a.status NOT IN ('CANCELLED', 'COMPLETED', 'NO_SHOW')")
    List<Appointment> findActiveAppointmentsForDay(LocalDateTime startTime, LocalDateTime endTime);

    List<Appointment> findByStatus(AppointmentStatus status);

    @Query("SELECT a FROM Appointment a WHERE DATE(a.appointmentTime) = :date AND a.status = :status")
    List<Appointment> findByAppointmentDateAndStatus(LocalDate date, AppointmentStatus status);

    List<Appointment> findByDoctor(Account doctor);

    @Query("SELECT a FROM Appointment a WHERE a.doctor = :doctor AND DATE(a.appointmentTime) = :date")
    List<Appointment> findByDoctorAndAppointmentDate(Account doctor, LocalDate date);

    @Query("SELECT a FROM Appointment a WHERE DATE(a.appointmentTime) = :date")
    List<Appointment> findByAppointmentDate(LocalDate date);
} 