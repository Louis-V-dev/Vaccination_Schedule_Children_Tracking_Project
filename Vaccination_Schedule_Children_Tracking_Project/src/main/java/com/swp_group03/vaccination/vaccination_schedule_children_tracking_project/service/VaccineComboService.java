package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccineCombo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccineComboDetail;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccineComboDetailId;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.VaccineComboRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.VaccineComboResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.VaccineComboRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class VaccineComboService {

    private final VaccineComboRepository vaccineComboRepository;

    public List<VaccineComboResponse> getAllCombos() {
        return vaccineComboRepository.findAllActiveWithDetails().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public VaccineComboResponse getComboById(Integer id) {
        VaccineCombo combo = vaccineComboRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_FOUND));
        return mapToResponse(combo);
    }

    public VaccineComboResponse createCombo(VaccineComboRequest request) {
        if (vaccineComboRepository.existsByComboNameIgnoreCase(request.getComboName())) {
            throw new AppException(ErrorCode.COMBO_NAME_EXISTS);
        }

        VaccineCombo combo = new VaccineCombo();
        updateComboFromRequest(combo, request);
        
        VaccineCombo savedCombo = vaccineComboRepository.save(combo);
        return mapToResponse(savedCombo);
    }

    public VaccineComboResponse updateCombo(Integer id, VaccineComboRequest request) {
        VaccineCombo combo = vaccineComboRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_FOUND));

        // Check if new name conflicts with existing combo (excluding current combo)
        if (!combo.getComboName().equalsIgnoreCase(request.getComboName()) &&
                vaccineComboRepository.existsByComboNameIgnoreCase(request.getComboName())) {
            throw new AppException(ErrorCode.COMBO_NAME_EXISTS);
        }

        updateComboFromRequest(combo, request);
        VaccineCombo updatedCombo = vaccineComboRepository.save(combo);
        return mapToResponse(updatedCombo);
    }

    public void deleteCombo(Integer id) {
        VaccineCombo combo = vaccineComboRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_FOUND));
        combo.setStatus(false);
        vaccineComboRepository.save(combo);
    }

    private void updateComboFromRequest(VaccineCombo combo, VaccineComboRequest request) {
        combo.setComboName(request.getComboName());
        combo.setDescription(request.getDescription());
        combo.setPrice(request.getPrice());
        combo.setStatus(request.getStatus() != null ? request.getStatus() : true);

        // Clear existing details
        combo.getVaccineDetails().clear();

        // Add new details
        request.getVaccineDetails().forEach(detailRequest -> {
            VaccineComboDetail detail = new VaccineComboDetail();
            VaccineComboDetailId detailId = new VaccineComboDetailId();
            detailId.setComboId(combo.getComboId());
            detailId.setVaccineId(detailRequest.getVaccineId());
            detail.setId(detailId);
            detail.setDose(detailRequest.getDose());
            detail.setAgeGroup(detailRequest.getAgeGroup());
            detail.setSaleOff(detailRequest.getSaleOff());
            combo.addVaccineDetail(detail);
        });
    }

    private VaccineComboResponse mapToResponse(VaccineCombo combo) {
        VaccineComboResponse response = new VaccineComboResponse();
        response.setComboId(combo.getComboId());
        response.setComboName(combo.getComboName());
        response.setDescription(combo.getDescription());
        response.setPrice(combo.getPrice());
        response.setStatus(combo.getStatus());

        List<VaccineComboResponse.VaccineDetailResponse> detailResponses = combo.getVaccineDetails().stream()
                .map(detail -> {
                    VaccineComboResponse.VaccineDetailResponse detailResponse = 
                            new VaccineComboResponse.VaccineDetailResponse();
                    detailResponse.setVaccineId(detail.getId().getVaccineId());
                    detailResponse.setDose(detail.getDose());
                    detailResponse.setAgeGroup(detail.getAgeGroup());
                    detailResponse.setSaleOff(detail.getSaleOff());
                    return detailResponse;
                })
                .collect(Collectors.toList());

        response.setVaccineDetails(detailResponses);
        return response;
    }
} 