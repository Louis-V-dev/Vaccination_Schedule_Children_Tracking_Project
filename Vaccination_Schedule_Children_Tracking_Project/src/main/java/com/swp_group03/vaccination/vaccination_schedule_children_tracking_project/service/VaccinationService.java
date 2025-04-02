package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class VaccinationService {
    
    private static final Logger log = LoggerFactory.getLogger(VaccinationService.class);
    
    private final AppointmentRepository appointmentRepository;
    private final UserRepo userRepo;
    private final AppointmentVaccineRepository appointmentVaccineRepository;
    private final HealthRecordRepository healthRecordRepository;
    private final VaccinationRecordRepository vaccinationRecordRepository;
    private final PostVaccinationCareRepository postVaccinationCareRepository;
    private final DoseScheduleRepository doseScheduleRepository;
    private final VaccineOfChildRepository vaccineOfChildRepository;
    
    @Autowired
    public VaccinationService(
        AppointmentRepository appointmentRepository,
        UserRepo userRepo,
        AppointmentVaccineRepository appointmentVaccineRepository,
        HealthRecordRepository healthRecordRepository,
        VaccinationRecordRepository vaccinationRecordRepository,
        PostVaccinationCareRepository postVaccinationCareRepository,
        DoseScheduleRepository doseScheduleRepository,
        VaccineOfChildRepository vaccineOfChildRepository) {
        
        this.appointmentRepository = appointmentRepository;
        this.userRepo = userRepo;
        this.appointmentVaccineRepository = appointmentVaccineRepository;
        this.healthRecordRepository = healthRecordRepository;
        this.vaccinationRecordRepository = vaccinationRecordRepository;
        this.postVaccinationCareRepository = postVaccinationCareRepository;
        this.doseScheduleRepository = doseScheduleRepository;
        this.vaccineOfChildRepository = vaccineOfChildRepository;
    }
    
    /**
     * Assign an appointment to a doctor and update its status
     */
    @Transactional
    public Appointment assignToDoctor(Appointment appointment, String doctorId) {
        log.info("Assigning appointment ID: {} to doctor ID: {}", appointment.getId(), doctorId);
        
        // Validate doctor exists
        Account doctor = userRepo.findById(doctorId)
            .orElseThrow(() -> new AppException(ErrorCode.DOCTOR_NOT_FOUND));
        
        // Check if the user has the DOCTOR role
        boolean isDoctor = doctor.getRoles().stream()
            .anyMatch(role -> "DOCTOR".equalsIgnoreCase(role.getRole_Name()));
        
        if (!isDoctor) {
            log.error("User ID: {} is not a doctor", doctorId);
            throw new AppException(ErrorCode.NOT_A_DOCTOR);
        }
        
        // Update appointment
        appointment.setDoctor(doctor);
        appointment.setStatus(AppointmentStatus.WITH_DOCTOR);
        
        log.info("Appointment assigned to doctor and status updated to WITH_DOCTOR");
        
        return appointmentRepository.save(appointment);
    }
    
    /**
     * Create a health record for a patient prior to vaccination
     */
    @Transactional
    public HealthRecord createHealthRecord(
        Long appointmentVaccineId,
        String doctorId,
        String preVaccinationHealth,
        Float temperature,
        Float weight,
        Float height,
        String bloodPressure,
        Integer heartRate,
        String allergies,
        String currentMedications,
        String doctorNotes,
        Boolean vaccinationApproved,
        String rejectionReason,
        String nextAppointmentRecommendations) {
        
        log.info("Creating health record for appointment vaccine ID: {} by doctor ID: {}", 
            appointmentVaccineId, doctorId);
        
        // Validate appointment vaccine exists
        AppointmentVaccine appointmentVaccine = appointmentVaccineRepository.findById(appointmentVaccineId)
            .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_VACCINE_NOT_FOUND));
        
        // Validate doctor exists
        Account doctor = userRepo.findById(doctorId)
            .orElseThrow(() -> new AppException(ErrorCode.DOCTOR_NOT_FOUND));
        
        // Create health record
        HealthRecord healthRecord = HealthRecord.builder()
            .appointmentVaccine(appointmentVaccine)
            .doctor(doctor)
            .preVaccinationHealth(preVaccinationHealth)
            .temperature(temperature)
            .weight(weight)
            .height(height)
            .bloodPressure(bloodPressure)
            .heartRate(heartRate)
            .allergies(allergies)
            .currentMedications(currentMedications)
            .doctorNotes(doctorNotes)
            .vaccinationApproved(vaccinationApproved)
            .rejectionReason(rejectionReason)
            .nextAppointmentRecommendations(nextAppointmentRecommendations)
            .build();
        
        // Save health record
        healthRecord = healthRecordRepository.save(healthRecord);
        
        // Update appointment vaccine status based on approval
        if (Boolean.TRUE.equals(vaccinationApproved)) {
            appointmentVaccine.setStatus(VaccinationStatus.APPROVED);
            log.info("Vaccination approved for appointment vaccine ID: {}", appointmentVaccineId);
        } else {
            appointmentVaccine.setStatus(VaccinationStatus.REJECTED);
            log.info("Vaccination rejected for appointment vaccine ID: {}", appointmentVaccineId);
        }
        
        appointmentVaccineRepository.save(appointmentVaccine);
        
        log.info("Health record created successfully with ID: {}", healthRecord.getId());
        
        return healthRecord;
    }
    
    /**
     * Reschedule a dose for a different date
     */
    @Transactional
    public DoseSchedule rescheduleDose(Long doseScheduleId, LocalDate newDate) {
        log.info("Rescheduling dose ID: {} to date: {}", doseScheduleId, newDate);
        
        // Validate dose schedule exists
        DoseSchedule doseSchedule = doseScheduleRepository.findById(doseScheduleId)
            .orElseThrow(() -> new AppException(ErrorCode.DOSE_SCHEDULE_NOT_FOUND));
        
        // Verify the new date is not in the past
        if (newDate.isBefore(LocalDate.now())) {
            log.error("Cannot reschedule dose to a past date: {}", newDate);
            throw new AppException(ErrorCode.INVALID_DATE, "Cannot reschedule to a past date");
        }
        
        // Update the scheduled date
        doseSchedule.setScheduledDate(newDate);
        doseSchedule.setStatus(String.valueOf(DoseStatus.SCHEDULED));
        
        log.info("Dose rescheduled successfully");
        
        return doseScheduleRepository.save(doseSchedule);
    }
    
    /**
     * Record a vaccination administered by a nurse
     */
    @Transactional
    public VaccinationRecord recordVaccination(
        Long appointmentVaccineId,
        String nurseId,
        String vaccineBatchNumber,
        LocalDateTime vaccineExpiryDate,
        String injectionSite,
        String routeOfAdministration,
        String doseAmount,
        String nurseNotes) {
        
        log.info("Recording vaccination for appointment vaccine ID: {} by nurse ID: {}", 
            appointmentVaccineId, nurseId);
        
        // Validate appointment vaccine exists
        AppointmentVaccine appointmentVaccine = appointmentVaccineRepository.findById(appointmentVaccineId)
            .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_VACCINE_NOT_FOUND));
        
        // Validate nurse exists
        Account nurse = userRepo.findById(nurseId)
            .orElseThrow(() -> new AppException(ErrorCode.NURSE_NOT_FOUND));
        
        // Verify appointment vaccine is in APPROVED status
        if (appointmentVaccine.getStatusEnum() != VaccinationStatus.APPROVED) {
            log.error("Cannot record vaccination: appointment vaccine with ID: {} is not in APPROVED status", 
                appointmentVaccineId);
            throw new AppException(ErrorCode.INVALID_STATUS, 
                "Cannot record vaccination for vaccine that is not in APPROVED status");
        }
        
        // Create vaccination record
        VaccinationRecord vaccinationRecord = VaccinationRecord.builder()
            .appointmentVaccine(appointmentVaccine)
            .nurse(nurse)
            .vaccinationTime(LocalDateTime.now())
            .vaccineBatchNumber(vaccineBatchNumber)
            .vaccineExpiryDate(vaccineExpiryDate)
            .injectionSite(injectionSite)
            .routeOfAdministration(routeOfAdministration)
            .doseAmount(doseAmount)
            .nurseNotes(nurseNotes)
            .build();
        
        // Save vaccination record
        vaccinationRecord = vaccinationRecordRepository.save(vaccinationRecord);
        
        // Update appointment vaccine status
        appointmentVaccine.setStatus(VaccinationStatus.VACCINATED);
        appointmentVaccineRepository.save(appointmentVaccine);
        
        // Update the dose schedule
        DoseSchedule doseSchedule = appointmentVaccine.getDoseSchedule();
        if (doseSchedule != null) {
            doseSchedule.setStatus(String.valueOf(DoseStatus.COMPLETED));
            doseScheduleRepository.save(doseSchedule);
            
            // Update the VaccineOfChild's currentDose
            VaccineOfChild vaccineOfChild = doseSchedule.getVaccineOfChild();
            if (vaccineOfChild != null) {
                // Set the currentDose to match the dose number just administered
                vaccineOfChild.setCurrentDose(doseSchedule.getDoseNumber());
                
                // Check if all doses are completed
                if (vaccineOfChild.getCurrentDose() >= vaccineOfChild.getTotalDoses()) {
                    vaccineOfChild.setIsCompleted(true);
                    log.info("Marked vaccination as completed for vaccine: {}", 
                        vaccineOfChild.getVaccine().getName());
                }
                
                vaccineOfChildRepository.save(vaccineOfChild);
                log.info("Updated VaccineOfChild currentDose to: {}", vaccineOfChild.getCurrentDose());
            }
        }
        
        log.info("Vaccination recorded successfully with ID: {}", vaccinationRecord.getId());
        
        return vaccinationRecord;
    }
    
    /**
     * Start post-vaccination care observation
     */
    @Transactional
    public PostVaccinationCare startPostVaccinationCare(
        Long appointmentVaccineId,
        String staffId,
        LocalDateTime startTime) {
        
        log.info("Starting post-vaccination care for appointment vaccine ID: {} by staff ID: {}", 
            appointmentVaccineId, staffId);
        
        // Validate appointment vaccine exists
        AppointmentVaccine appointmentVaccine = appointmentVaccineRepository.findById(appointmentVaccineId)
            .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_VACCINE_NOT_FOUND));
        
        // Validate staff exists
        Account staff = userRepo.findById(staffId)
            .orElseThrow(() -> new AppException(ErrorCode.STAFF_NOT_FOUND));
        
        // Verify appointment vaccine is in VACCINATED status
        if (appointmentVaccine.getStatusEnum() != VaccinationStatus.VACCINATED) {
            log.error("Cannot start post-vaccination care: appointment vaccine with ID: {} is not in VACCINATED status", 
                appointmentVaccineId);
            throw new AppException(ErrorCode.INVALID_STATUS, 
                "Cannot start post-vaccination care for vaccine that is not in VACCINATED status");
        }
        
        // Check if observation has already been started
        Optional<PostVaccinationCare> existingCare = postVaccinationCareRepository
            .findByAppointmentVaccineId(appointmentVaccineId);
        
        if (existingCare.isPresent()) {
            log.info("Post-vaccination care already started for appointment vaccine ID: {}", appointmentVaccineId);
            return existingCare.get();
        }
        
        // Create post-vaccination care record
        PostVaccinationCare careRecord = PostVaccinationCare.builder()
            .appointmentVaccine(appointmentVaccine)
            .staff(staff)
            .observationStartTime(startTime)
            .build();
        
        log.info("Post-vaccination care started successfully");
        
        return postVaccinationCareRepository.save(careRecord);
    }
    
    /**
     * Complete post-vaccination care observation with results
     */
    @Transactional
    public PostVaccinationCare completePostVaccinationCare(
        Long appointmentVaccineId,
        String staffId,
        Float temperature,
        String bloodPressure,
        Integer heartRate,
        String immediateReactions,
        String treatmentProvided,
        String staffNotes,
        Boolean followUpNeeded,
        String followUpInstructions) {
        
        log.info("Completing post-vaccination care for appointment vaccine ID: {} by staff ID: {}", 
            appointmentVaccineId, staffId);
        
        // Validate appointment vaccine exists
        AppointmentVaccine appointmentVaccine = appointmentVaccineRepository.findById(appointmentVaccineId)
            .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_VACCINE_NOT_FOUND));
        
        // Validate staff exists
        Account staff = userRepo.findById(staffId)
            .orElseThrow(() -> new AppException(ErrorCode.STAFF_NOT_FOUND));
        
        // Find existing post-vaccination care record
        PostVaccinationCare careRecord = postVaccinationCareRepository
            .findByAppointmentVaccineId(appointmentVaccineId)
            .orElseThrow(() -> new AppException(ErrorCode.POST_VACCINATION_CARE_NOT_FOUND));
        
        // Verify minimum observation time (30 minutes)
        LocalDateTime now = LocalDateTime.now();
        if (careRecord.getObservationStartTime() != null) {
            Duration observationDuration = Duration.between(careRecord.getObservationStartTime(), now);
            if (observationDuration.toMinutes() < 30) {
                log.warn("Completing post-vaccination care before 30 minute minimum observation time");
                // Still allow completing but log a warning
            }
        }
        
        // Update existing record with completion details
        careRecord.setStaff(staff); // In case a different staff is completing the observation
        careRecord.setObservationEndTime(now);
        careRecord.setTemperature(temperature);
        careRecord.setBloodPressure(bloodPressure);
        careRecord.setHeartRate(heartRate);
        careRecord.setImmediateReactions(immediateReactions);
        careRecord.setTreatmentProvided(treatmentProvided);
        careRecord.setStaffNotes(staffNotes);
        careRecord.setFollowUpNeeded(followUpNeeded);
        careRecord.setFollowUpInstructions(followUpInstructions);
        
        log.info("Post-vaccination care completed successfully");
        
        return postVaccinationCareRepository.save(careRecord);
    }
    
    /**
     * Check if post-vaccination care is completed for an appointment vaccine
     */
    public boolean isPostVaccinationCareCompleted(Long appointmentVaccineId) {
        Optional<PostVaccinationCare> careRecord = postVaccinationCareRepository
            .findByAppointmentVaccineId(appointmentVaccineId);
        
        if (careRecord.isPresent()) {
            // Care is completed if observation end time is set
            return careRecord.get().getObservationEndTime() != null;
        }
        
        return false;
    }
    
    /**
     * Check if minimum observation time (30 minutes) has passed since vaccination
     */
    public boolean isObservationTimeComplete(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
        
        // Check all vaccinated vaccines
        boolean allComplete = true;
        
        for (AppointmentVaccine av : appointment.getAppointmentVaccines()) {
            if (av.getStatusEnum() == VaccinationStatus.VACCINATED) {
                Optional<PostVaccinationCare> careRecord = postVaccinationCareRepository
                    .findByAppointmentVaccineId(av.getId());
                
                if (careRecord.isPresent() && careRecord.get().getObservationStartTime() != null) {
                    Duration observationDuration = Duration.between(
                        careRecord.get().getObservationStartTime(), LocalDateTime.now());
                    
                    if (observationDuration.toMinutes() < 30) {
                        allComplete = false;
                        break;
                    }
                } else {
                    // If no care record or no start time, consider observation incomplete
                    allComplete = false;
                    break;
                }
            }
        }
        
        return allComplete;
    }
} 