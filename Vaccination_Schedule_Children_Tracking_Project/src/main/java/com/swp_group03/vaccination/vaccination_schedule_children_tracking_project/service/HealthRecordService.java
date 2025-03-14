package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Appointment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Child;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.HealthRecord;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccinationEligibility;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.HealthRecordRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.HealthRecordResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.AppointmentRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.ChildRepo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.HealthRecordRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HealthRecordService {

    @Autowired
    private HealthRecordRepository healthRecordRepository;
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private ChildRepo childRepository;
    
    /**
     * Create a new health record
     * @param request The health record request data
     * @param doctorId The ID of the doctor creating the record
     * @return The created health record
     * @throws EntityNotFoundException if the appointment or child is not found
     */
    @Transactional
    public HealthRecord createHealthRecord(HealthRecordRequest request, Account doctor) {
        // Find the appointment
        Appointment appointment = appointmentRepository.findById(request.getAppointmentId())
                .orElseThrow(() -> new EntityNotFoundException("Appointment not found with id: " + request.getAppointmentId()));
        
        // Find the child
        Child child = childRepository.findById(request.getChildId())
                .orElseThrow(() -> new EntityNotFoundException("Child not found with id: " + request.getChildId()));
        
        // Check if a health record already exists for this appointment
        if (healthRecordRepository.findByAppointment(appointment).isPresent()) {
            throw new IllegalStateException("Health record already exists for this appointment");
        }
        
        // Create the health record
        HealthRecord healthRecord = HealthRecord.builder()
                .appointment(appointment)
                .child(child)
                .doctor(doctor)
                .temperature(request.getTemperature())
                .weight(request.getWeight())
                .height(request.getHeight())
                .bloodPressure(request.getBloodPressure())
                .allergies(request.getAllergies())
                .symptoms(request.getSymptoms())
                .diagnosis(request.getDiagnosis())
                .recommendations(request.getRecommendations())
                .eligibility(request.getEligibility())
                .reasonIfNotEligible(request.getReasonIfNotEligible())
                .rescheduledDate(request.getRescheduledDate())
                .build();
        
        return healthRecordRepository.save(healthRecord);
    }
    
    /**
     * Update an existing health record
     * @param id The ID of the health record to update
     * @param request The updated health record data
     * @return The updated health record
     * @throws EntityNotFoundException if the health record is not found
     */
    @Transactional
    public HealthRecord updateHealthRecord(Long id, HealthRecordRequest request) {
        HealthRecord healthRecord = healthRecordRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Health record not found with id: " + id));
        
        // Update fields if provided
        if (request.getTemperature() != null) {
            healthRecord.setTemperature(request.getTemperature());
        }
        
        if (request.getWeight() != null) {
            healthRecord.setWeight(request.getWeight());
        }
        
        if (request.getHeight() != null) {
            healthRecord.setHeight(request.getHeight());
        }
        
        if (request.getBloodPressure() != null) {
            healthRecord.setBloodPressure(request.getBloodPressure());
        }
        
        if (request.getAllergies() != null) {
            healthRecord.setAllergies(request.getAllergies());
        }
        
        if (request.getSymptoms() != null) {
            healthRecord.setSymptoms(request.getSymptoms());
        }
        
        if (request.getDiagnosis() != null) {
            healthRecord.setDiagnosis(request.getDiagnosis());
        }
        
        if (request.getRecommendations() != null) {
            healthRecord.setRecommendations(request.getRecommendations());
        }
        
        if (request.getEligibility() != null) {
            healthRecord.setEligibility(request.getEligibility());
        }
        
        if (request.getReasonIfNotEligible() != null) {
            healthRecord.setReasonIfNotEligible(request.getReasonIfNotEligible());
        }
        
        if (request.getRescheduledDate() != null) {
            healthRecord.setRescheduledDate(request.getRescheduledDate());
        }
        
        return healthRecordRepository.save(healthRecord);
    }
    
    /**
     * Get a health record by ID
     * @param id The ID of the health record
     * @return The health record
     * @throws EntityNotFoundException if the health record is not found
     */
    public HealthRecord getHealthRecordById(Long id) {
        return healthRecordRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Health record not found with id: " + id));
    }
    
    /**
     * Get all health records for a specific child
     * @param childId The ID of the child
     * @return List of health records
     * @throws EntityNotFoundException if the child is not found
     */
    public List<HealthRecord> getHealthRecordsByChildId(String childId) {
        Child child = childRepository.findById(childId)
                .orElseThrow(() -> new EntityNotFoundException("Child not found with id: " + childId));
        
        return healthRecordRepository.findByChild(child);
    }
    
    /**
     * Get all health records for a specific child with pagination
     * @param childId The ID of the child
     * @param pageable Pagination information
     * @return Page of health records
     * @throws EntityNotFoundException if the child is not found
     */
    public Page<HealthRecord> getHealthRecordsByChildId(String childId, Pageable pageable) {
        Child child = childRepository.findById(childId)
                .orElseThrow(() -> new EntityNotFoundException("Child not found with id: " + childId));
        
        return healthRecordRepository.findByChild(child, pageable);
    }
    
    /**
     * Get a health record for a specific appointment
     * @param appointmentId The ID of the appointment
     * @return The health record
     * @throws EntityNotFoundException if the appointment or health record is not found
     */
    public HealthRecord getHealthRecordByAppointmentId(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Appointment not found with id: " + appointmentId));
        
        return healthRecordRepository.findByAppointment(appointment)
                .orElseThrow(() -> new EntityNotFoundException("Health record not found for appointment with id: " + appointmentId));
    }
    
    /**
     * Search health records based on multiple criteria
     * @param childId Optional child ID
     * @param doctorId Optional doctor ID
     * @param eligibility Optional eligibility status
     * @param startDate Optional start date for the search range
     * @param endDate Optional end date for the search range
     * @return List of matching health records
     */
    public List<HealthRecord> searchHealthRecords(
            String childId, 
            String doctorId, 
            VaccinationEligibility eligibility,
            LocalDateTime startDate,
            LocalDateTime endDate) {
        
        return healthRecordRepository.searchHealthRecords(
                childId, 
                doctorId, 
                eligibility, 
                startDate, 
                endDate);
    }
    
    /**
     * Map a HealthRecord entity to a HealthRecordResponse
     * @param healthRecord The health record entity
     * @return The health record response
     */
    public HealthRecordResponse mapToResponse(HealthRecord healthRecord) {
        HealthRecordResponse.ChildInfo childInfo = HealthRecordResponse.ChildInfo.builder()
                .id(healthRecord.getChild().getChild_id())
                .name(healthRecord.getChild().getChild_name())
                .gender(healthRecord.getChild().getGender())
                .bloodType(healthRecord.getChild().getBloodType())
                .allergies(healthRecord.getChild().getAllergies())
                .medicalConditions(healthRecord.getChild().getMedicalConditions())
                .build();
        
        HealthRecordResponse.DoctorInfo doctorInfo = HealthRecordResponse.DoctorInfo.builder()
                .id(healthRecord.getDoctor().getAccountId())
                .firstName(healthRecord.getDoctor().getFirstName())
                .lastName(healthRecord.getDoctor().getLastName())
                .specialization("Doctor") // You might want to get this from the doctor's account
                .build();
        
        String eligibilityDescription = "";
        switch (healthRecord.getEligibility()) {
            case ELIGIBLE:
                eligibilityDescription = "Eligible for vaccination";
                break;
            case NOT_ELIGIBLE:
                eligibilityDescription = "Not eligible for vaccination";
                break;
            case POSTPONED:
                eligibilityDescription = "Vaccination postponed";
                break;
            default:
                eligibilityDescription = "Unknown eligibility status";
        }
        
        return HealthRecordResponse.builder()
                .id(healthRecord.getId())
                .appointmentId(healthRecord.getAppointment().getId())
                .child(childInfo)
                .temperature(healthRecord.getTemperature())
                .weight(healthRecord.getWeight())
                .height(healthRecord.getHeight())
                .bloodPressure(healthRecord.getBloodPressure())
                .allergies(healthRecord.getAllergies())
                .symptoms(healthRecord.getSymptoms())
                .diagnosis(healthRecord.getDiagnosis())
                .recommendations(healthRecord.getRecommendations())
                .eligibility(healthRecord.getEligibility())
                .eligibilityDescription(eligibilityDescription)
                .reasonIfNotEligible(healthRecord.getReasonIfNotEligible())
                .rescheduledDate(healthRecord.getRescheduledDate())
                .doctor(doctorInfo)
                .recordedAt(healthRecord.getRecordedAt())
                .updatedAt(healthRecord.getUpdatedAt())
                .build();
    }
    
    /**
     * Map a list of HealthRecord entities to HealthRecordResponse objects
     * @param healthRecords The health record entities
     * @return List of health record responses
     */
    public List<HealthRecordResponse> mapToResponseList(List<HealthRecord> healthRecords) {
        return healthRecords.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Map a page of HealthRecord entities to HealthRecordResponse objects
     * @param healthRecordPage Page of health record entities
     * @return Page of health record responses
     */
    public Page<HealthRecordResponse> mapToResponsePage(Page<HealthRecord> healthRecordPage) {
        return healthRecordPage.map(this::mapToResponse);
    }
} 