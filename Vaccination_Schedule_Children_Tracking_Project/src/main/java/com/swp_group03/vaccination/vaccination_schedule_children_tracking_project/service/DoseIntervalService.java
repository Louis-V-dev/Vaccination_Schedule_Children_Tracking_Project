package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.DoseIntervalRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.DoseIntervalResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.DoseInterval;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Vaccine;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.DoseIntervalRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.VaccineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class DoseIntervalService {

    private final DoseIntervalRepository doseIntervalRepository;
    private final VaccineRepository vaccineRepo;

    public List<DoseIntervalResponse> getIntervalsForVaccine(Long vaccineId) {
        Vaccine vaccine = vaccineRepo.findById(vaccineId)
                .orElseThrow(() -> new AppException(ErrorCode.VACCINE_NOT_FOUND));
        return doseIntervalRepository.findByVaccineOrderByFromDoseAsc(vaccine)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DoseIntervalResponse createInterval(Long vaccineId, DoseIntervalRequest request) {
        Vaccine vaccine = vaccineRepo.findById(vaccineId)
                .orElseThrow(() -> new AppException(ErrorCode.VACCINE_NOT_FOUND));

        // Validate dose numbers
        if (request.getFromDose() > request.getToDose()) {
            throw new AppException(ErrorCode.INVALID_DOSE_RANGE);
        }

        // Check for overlapping intervals
        List<DoseInterval> existingIntervals = doseIntervalRepository.findByVaccineOrderByFromDoseAsc(vaccine);
        for (DoseInterval existing : existingIntervals) {
            if ((request.getFromDose() <= existing.getToDose() && request.getToDose() >= existing.getFromDose())) {
                throw new AppException(ErrorCode.INTERVAL_OVERLAP);
            }
        }

        DoseInterval doseInterval = new DoseInterval();
        doseInterval.setVaccine(vaccine);
        doseInterval.setFromDose(request.getFromDose());
        doseInterval.setToDose(request.getToDose());
        doseInterval.setIntervalDays(request.getIntervalDays());

        DoseInterval savedInterval = doseIntervalRepository.save(doseInterval);
        return mapToResponse(savedInterval);
    }

    @Transactional
    public DoseIntervalResponse updateInterval(Long vaccineId, Long intervalId, DoseIntervalRequest request) {
        Vaccine vaccine = vaccineRepo.findById(vaccineId)
                .orElseThrow(() -> new AppException(ErrorCode.VACCINE_NOT_FOUND));

        DoseInterval doseInterval = doseIntervalRepository.findById(intervalId)
                .orElseThrow(() -> new AppException(ErrorCode.INTERVAL_NOT_FOUND));

        // Ensure interval belongs to the specified vaccine
        if (!doseInterval.getVaccine().getId().equals(vaccineId)) {
            throw new AppException(ErrorCode.INTERVAL_VACCINE_MISMATCH);
        }

        // Validate dose numbers
        if (request.getFromDose() > request.getToDose()) {
            throw new AppException(ErrorCode.INVALID_DOSE_RANGE);
        }

        // Check for overlapping intervals (excluding this interval)
        List<DoseInterval> existingIntervals = doseIntervalRepository.findByVaccineOrderByFromDoseAsc(vaccine);
        for (DoseInterval existing : existingIntervals) {
            if (existing.getId().equals(intervalId)) {
                continue; // Skip the current interval
            }
            if ((request.getFromDose() <= existing.getToDose() && request.getToDose() >= existing.getFromDose())) {
                throw new AppException(ErrorCode.INTERVAL_OVERLAP);
            }
        }

        // Update interval
        doseInterval.setFromDose(request.getFromDose());
        doseInterval.setToDose(request.getToDose());
        doseInterval.setIntervalDays(request.getIntervalDays());

        DoseInterval updatedInterval = doseIntervalRepository.save(doseInterval);
        return mapToResponse(updatedInterval);
    }

    @Transactional
    public void deleteInterval(Long vaccineId, Long intervalId) {
        // Check if vaccine exists
        if (!vaccineRepo.existsById(vaccineId)) {
            throw new AppException(ErrorCode.VACCINE_NOT_FOUND);
        }

        DoseInterval doseInterval = doseIntervalRepository.findById(intervalId)
                .orElseThrow(() -> new AppException(ErrorCode.INTERVAL_NOT_FOUND));

        if (!doseInterval.getVaccine().getId().equals(vaccineId)) {
            throw new AppException(ErrorCode.INTERVAL_VACCINE_MISMATCH);
        }

        doseIntervalRepository.delete(doseInterval);
    }

    @Transactional
    public void deleteAllIntervalsForVaccine(Long vaccineId) {
        // Check if vaccine exists
        if (!vaccineRepo.existsById(vaccineId)) {
            throw new AppException(ErrorCode.VACCINE_NOT_FOUND);
        }
        
        doseIntervalRepository.deleteByVaccineId(vaccineId);
    }

    /**
     * Creates multiple intervals at once with proper transaction handling.
     * This method will delete all existing intervals for the vaccine 
     * and then create new ones, ensuring consistency.
     *
     * @param vaccineId The ID of the vaccine to create intervals for
     * @param requests List of interval requests to create
     * @return List of created interval responses
     */
    @Transactional
    public List<DoseIntervalResponse> createMultipleIntervals(Long vaccineId, List<DoseIntervalRequest> requests) {
        // Find the vaccine
        Vaccine vaccine = vaccineRepo.findById(vaccineId)
                .orElseThrow(() -> new AppException(ErrorCode.VACCINE_NOT_FOUND));
        
        // Validate all requests first
        for (DoseIntervalRequest request : requests) {
            if (request.getFromDose() > request.getToDose()) {
                throw new AppException(ErrorCode.INVALID_DOSE_RANGE);
            }
        }
        
        // First, delete all existing intervals for this vaccine
        doseIntervalRepository.deleteByVaccineId(vaccineId);
        
        // Create a list to hold the new intervals
        List<DoseInterval> newIntervals = new ArrayList<>();
        
        // Create each interval
        for (DoseIntervalRequest request : requests) {
            DoseInterval doseInterval = new DoseInterval();
            doseInterval.setVaccine(vaccine);
            doseInterval.setFromDose(request.getFromDose());
            doseInterval.setToDose(request.getToDose());
            doseInterval.setIntervalDays(request.getIntervalDays());
            newIntervals.add(doseInterval);
        }
        
        // Save all intervals in one batch
        List<DoseInterval> savedIntervals = doseIntervalRepository.saveAll(newIntervals);
        
        // Map to response objects
        return savedIntervals.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Utility method to check if two intervals overlap
     * 
     * @param interval1FromDose from dose of first interval
     * @param interval1ToDose to dose of first interval
     * @param interval2FromDose from dose of second interval
     * @param interval2ToDose to dose of second interval
     * @return true if intervals overlap, false otherwise
     */
    private boolean intervalsOverlap(int interval1FromDose, int interval1ToDose, 
                                    int interval2FromDose, int interval2ToDose) {
        return (interval1FromDose <= interval2ToDose && interval1ToDose >= interval2FromDose);
    }

    private DoseIntervalResponse mapToResponse(DoseInterval doseInterval) {
        DoseIntervalResponse response = new DoseIntervalResponse();
        response.setId(doseInterval.getId());
        response.setVaccineId(doseInterval.getVaccine().getId());
        response.setFromDose(doseInterval.getFromDose());
        response.setToDose(doseInterval.getToDose());
        response.setIntervalDays(doseInterval.getIntervalDays());
        return response;
    }
} 