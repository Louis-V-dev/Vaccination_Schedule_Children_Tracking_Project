package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.VaccineComboRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.VaccineComboResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.ComboCategoryRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.VaccineComboRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.VaccineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class VaccineComboService {

    private final VaccineComboRepository vaccineComboRepository;
    private final VaccineRepository vaccineRepository;
    private final ComboCategoryRepository comboCategoryRepository;

    public List<VaccineComboResponse> getAllCombos() {
        return vaccineComboRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public VaccineComboResponse getComboById(Integer id) {
        VaccineCombo combo = vaccineComboRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_FOUND));
        return mapToResponse(combo);
    }

    public VaccineComboResponse createCombo(VaccineComboRequest request) {
        // Check if name already exists
        if (vaccineComboRepository.existsByComboNameIgnoreCase(request.getComboName())) {
            throw new AppException(ErrorCode.COMBO_NAME_EXISTS);
        }

        // Log the incoming request
        System.out.println("Creating combo with request: " + request);
        System.out.println("Vaccine IDs: " + request.getVaccineIds());
        System.out.println("Categories: " + request.getCategories());
        System.out.println("Vaccine Doses: " + request.getVaccineDoses());

        VaccineCombo combo = new VaccineCombo();
        combo.setComboName(request.getComboName());
        combo.setDescription(request.getDescription());
        combo.setPrice(request.getPrice());
        combo.setSaleOff(request.getSaleOff());
        combo.setMinAge(request.getMinAge());
        combo.setMaxAge(request.getMaxAge());
        combo.setStatus(request.getStatus() != null ? request.getStatus() : true);

        // First save the combo to get an ID
        VaccineCombo savedCombo = vaccineComboRepository.save(combo);
        System.out.println("Saved combo with ID: " + savedCombo.getComboId());
        
        // Now add vaccine details with the combo ID
        if (request.getVaccineIds() != null && !request.getVaccineIds().isEmpty()) {
            System.out.println("Processing " + request.getVaccineIds().size() + " vaccines");
            for (Long vaccineId : request.getVaccineIds()) {
                System.out.println("Processing vaccine ID: " + vaccineId);
                Vaccine vaccine = vaccineRepository.findById(vaccineId)
                        .orElseThrow(() -> new AppException(ErrorCode.VACCINE_NOT_FOUND));
                
                ComboDetail detail = new ComboDetail();
                detail.setVaccine(vaccine);
                detail.setVaccineCombo(savedCombo);
                
                // Set the total dose if provided in the request, otherwise default to 1
                if (request.getVaccineDoses() != null && request.getVaccineDoses().containsKey(vaccineId)) {
                    detail.setTotalDose(request.getVaccineDoses().get(vaccineId));
                } else {
                    detail.setTotalDose(1);
                }
                
                // Explicitly set the ID values
                ComboDetailId detailId = new ComboDetailId();
                detailId.setComboId(savedCombo.getComboId());
                detailId.setVaccineId(vaccineId);
                detail.setId(detailId);
                
                // Add to the combo's collection
                savedCombo.getVaccineDetails().add(detail);
                System.out.println("Added vaccine: " + vaccine.getName() + " with total dose: " + detail.getTotalDose());
            }
        }
        
        // Add category details
        if (request.getCategories() != null && !request.getCategories().isEmpty()) {
            System.out.println("Processing " + request.getCategories().size() + " categories");
            for (Integer categoryId : request.getCategories()) {
                System.out.println("Processing category ID: " + categoryId);
                ComboCategory category = comboCategoryRepository.findById(categoryId)
                        .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
                
                ComboCategoryDetail detail = new ComboCategoryDetail();
                detail.setComboCategory(category);
                detail.setVaccineCombo(savedCombo);
                
                // Explicitly set the ID values using a new ComboCategoryDetailId instance
                ComboCategoryDetailId detailId = new ComboCategoryDetailId();
                detailId.setComboId(savedCombo.getComboId());
                detailId.setCategoryId(categoryId);
                detail.setId(detailId);
                
                // Add to the combo's collection
                savedCombo.getCategoryDetails().add(detail);
                System.out.println("Added category: " + category.getComboCategoryName());
            }
        }

        // Save again with the details
        savedCombo = vaccineComboRepository.save(savedCombo);
        System.out.println("Saved combo with details. Vaccines: " + savedCombo.getVaccineDetails().size() + 
                          ", Categories: " + savedCombo.getCategoryDetails().size());
        
        return mapToResponse(savedCombo);
    }

    public VaccineComboResponse updateCombo(Integer id, VaccineComboRequest request) {
        VaccineCombo combo = vaccineComboRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_FOUND));

        // Check if name already exists (if changed)
        if (!combo.getComboName().equalsIgnoreCase(request.getComboName()) &&
                vaccineComboRepository.existsByComboNameIgnoreCase(request.getComboName())) {
            throw new AppException(ErrorCode.COMBO_NAME_EXISTS);
        }

        // Log the incoming request
        System.out.println("Updating combo with ID: " + id);
        System.out.println("Vaccine IDs: " + request.getVaccineIds());
        System.out.println("Categories: " + request.getCategories());
        System.out.println("Vaccine Doses: " + request.getVaccineDoses());

        combo.setComboName(request.getComboName());
        combo.setDescription(request.getDescription());
        combo.setPrice(request.getPrice());
        combo.setSaleOff(request.getSaleOff());
        combo.setMinAge(request.getMinAge());
        combo.setMaxAge(request.getMaxAge());
        combo.setStatus(request.getStatus() != null ? request.getStatus() : combo.getStatus());

        // Clear existing details
        combo.getVaccineDetails().clear();
        combo.getCategoryDetails().clear();
        
        // Save the combo first to ensure it exists
        VaccineCombo savedCombo = vaccineComboRepository.save(combo);
        
        // Add vaccine details
        if (request.getVaccineIds() != null && !request.getVaccineIds().isEmpty()) {
            System.out.println("Processing " + request.getVaccineIds().size() + " vaccines");
            for (Long vaccineId : request.getVaccineIds()) {
                System.out.println("Processing vaccine ID: " + vaccineId);
                Vaccine vaccine = vaccineRepository.findById(vaccineId)
                        .orElseThrow(() -> new AppException(ErrorCode.VACCINE_NOT_FOUND));
                
                ComboDetail detail = new ComboDetail();
                detail.setVaccine(vaccine);
                detail.setVaccineCombo(savedCombo);
                
                // Set the total dose if provided in the request, otherwise default to 1
                if (request.getVaccineDoses() != null && request.getVaccineDoses().containsKey(vaccineId)) {
                    detail.setTotalDose(request.getVaccineDoses().get(vaccineId));
                } else {
                    detail.setTotalDose(1);
                }
                
                // Explicitly set the ID values
                ComboDetailId detailId = new ComboDetailId();
                detailId.setComboId(savedCombo.getComboId());
                detailId.setVaccineId(vaccineId);
                detail.setId(detailId);
                
                // Add to the combo's collection
                savedCombo.getVaccineDetails().add(detail);
                System.out.println("Added vaccine: " + vaccine.getName() + " with total dose: " + detail.getTotalDose());
            }
        }
        
        // Add category details
        if (request.getCategories() != null && !request.getCategories().isEmpty()) {
            System.out.println("Processing " + request.getCategories().size() + " categories");
            for (Integer categoryId : request.getCategories()) {
                System.out.println("Processing category ID: " + categoryId);
                ComboCategory category = comboCategoryRepository.findById(categoryId)
                        .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
                
                ComboCategoryDetail detail = new ComboCategoryDetail();
                detail.setComboCategory(category);
                detail.setVaccineCombo(savedCombo);
                
                // Explicitly set the ID values using a new ComboCategoryDetailId instance
                ComboCategoryDetailId detailId = new ComboCategoryDetailId();
                detailId.setComboId(savedCombo.getComboId());
                detailId.setCategoryId(categoryId);
                detail.setId(detailId);
                
                // Add to the combo's collection
                savedCombo.getCategoryDetails().add(detail);
                System.out.println("Added category: " + category.getComboCategoryName());
            }
        }

        // Save again with the details
        savedCombo = vaccineComboRepository.save(savedCombo);
        System.out.println("Saved updated combo with details. Vaccines: " + savedCombo.getVaccineDetails().size() + 
                          ", Categories: " + savedCombo.getCategoryDetails().size());
        
        return mapToResponse(savedCombo);
    }

    public void deleteCombo(Integer id) {
        if (!vaccineComboRepository.existsById(id)) {
            throw new AppException(ErrorCode.COMBO_NOT_FOUND);
        }
        vaccineComboRepository.deleteById(id);
    }

    private VaccineComboResponse mapToResponse(VaccineCombo combo) {
        VaccineComboResponse response = new VaccineComboResponse();
        response.setComboId(combo.getComboId());
        response.setComboName(combo.getComboName());
        response.setDescription(combo.getDescription());
        response.setPrice(combo.getPrice());
        response.setSaleOff(combo.getSaleOff());
        response.setMinAge(combo.getMinAge());
        response.setMaxAge(combo.getMaxAge());
        response.setStatus(combo.getStatus());
        
        // Map vaccine details
        List<VaccineComboResponse.VaccineInfo> vaccineInfos = new ArrayList<>();
        for (ComboDetail detail : combo.getVaccineDetails()) {
            VaccineComboResponse.VaccineInfo vaccineInfo = new VaccineComboResponse.VaccineInfo();
            vaccineInfo.setVaccineId(detail.getVaccine().getId());
            vaccineInfo.setVaccineName(detail.getVaccine().getName());
            vaccineInfo.setPrice(detail.getVaccine().getPrice() != null ? detail.getVaccine().getPrice().doubleValue() : null);
            vaccineInfo.setTotalDose(detail.getTotalDose() != null ? detail.getTotalDose() : 1);
            vaccineInfos.add(vaccineInfo);
        }
        response.setVaccines(vaccineInfos);
        
        // Map category details
        List<VaccineComboResponse.CategoryInfo> categoryInfos = new ArrayList<>();
        for (ComboCategoryDetail detail : combo.getCategoryDetails()) {
            VaccineComboResponse.CategoryInfo categoryInfo = new VaccineComboResponse.CategoryInfo();
            categoryInfo.setCategoryId(detail.getComboCategory().getId());
            categoryInfo.setCategoryName(detail.getComboCategory().getComboCategoryName());
            categoryInfos.add(categoryInfo);
        }
        response.setCategories(categoryInfos);
        
        return response;
    }
} 