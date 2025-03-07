package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.ComboCategory;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.ComboCategoryDetail;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.ComboCategoryRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ComboCategoryResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.ComboCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ComboCategoryService {

    private final ComboCategoryRepository comboCategoryRepository;

    public List<ComboCategoryResponse> getAllCategories() {
        return comboCategoryRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ComboCategoryResponse getCategoryById(Integer id) {
        ComboCategory category = comboCategoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        return mapToResponse(category);
    }

    public ComboCategoryResponse createCategory(ComboCategoryRequest request) {
        try {
            System.out.println("Creating category with name: " + request.getComboCategoryName());
            
            if (request.getComboCategoryName() == null || request.getComboCategoryName().trim().isEmpty()) {
                System.err.println("Category name is null or empty");
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }
            
            if (comboCategoryRepository.existsByComboCategoryNameIgnoreCase(request.getComboCategoryName())) {
                System.err.println("Category name already exists: " + request.getComboCategoryName());
                throw new AppException(ErrorCode.CATEGORY_NAME_EXISTS);
            }

            ComboCategory category = new ComboCategory();
            category.setComboCategoryName(request.getComboCategoryName());
            category.setDescription(request.getDescription());
            category.setStatus(request.getStatus() != null ? request.getStatus() : true);
            
            System.out.println("Saving new category...");
            ComboCategory savedCategory = comboCategoryRepository.save(category);
            System.out.println("Category saved with ID: " + savedCategory.getId());
            
            return mapToResponse(savedCategory);
        } catch (AppException e) {
            System.err.println("Application error creating category: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.err.println("Error creating category: " + e.getMessage());
            e.printStackTrace();
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    public ComboCategoryResponse updateCategory(Integer id, ComboCategoryRequest request) {
        ComboCategory category = comboCategoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        if (!category.getComboCategoryName().equalsIgnoreCase(request.getComboCategoryName()) &&
                comboCategoryRepository.existsByComboCategoryNameIgnoreCase(request.getComboCategoryName())) {
            throw new AppException(ErrorCode.CATEGORY_NAME_EXISTS);
        }

        category.setComboCategoryName(request.getComboCategoryName());
        category.setDescription(request.getDescription());
        category.setStatus(request.getStatus() != null ? request.getStatus() : category.getStatus());
        
        ComboCategory updatedCategory = comboCategoryRepository.save(category);
        return mapToResponse(updatedCategory);
    }

    public void deleteCategory(Integer id) {
        if (!comboCategoryRepository.existsById(id)) {
            throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
        }
        comboCategoryRepository.deleteById(id);
    }

    private ComboCategoryResponse mapToResponse(ComboCategory category) {
        ComboCategoryResponse response = new ComboCategoryResponse();
        response.setId(category.getId());
        response.setComboCategoryName(category.getComboCategoryName());
        response.setDescription(category.getDescription());
        response.setStatus(category.getStatus());
        
        // Map associated combos
        if (category.getComboDetails() != null && !category.getComboDetails().isEmpty()) {
            List<ComboCategoryResponse.ComboInfo> comboInfoList = new ArrayList<>();
            
            for (ComboCategoryDetail detail : category.getComboDetails()) {
                ComboCategoryResponse.ComboInfo comboInfo = new ComboCategoryResponse.ComboInfo();
                comboInfo.setComboId(detail.getVaccineCombo().getComboId());
                comboInfo.setComboName(detail.getVaccineCombo().getComboName());
                comboInfoList.add(comboInfo);
            }
            
            response.setCombos(comboInfoList);
        }
        
        return response;
    }
} 