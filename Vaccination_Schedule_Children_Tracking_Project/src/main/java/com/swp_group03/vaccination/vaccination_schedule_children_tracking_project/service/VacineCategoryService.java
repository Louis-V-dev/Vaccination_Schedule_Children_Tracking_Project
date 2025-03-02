package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VacineCategory;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.VacineCategoryRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VacineCategoryService {

    @Autowired
    private VacineCategoryRepo vacineCategoryRepo;

    public List<VacineCategory> getAllCategories() {
        return vacineCategoryRepo.findAll();
    }

    public VacineCategory addCategory(String categoryName) {
        if (categoryName == null || categoryName.trim().isEmpty()) {
            throw new IllegalArgumentException("Category name is required");
        }

        // Check if category already exists
        VacineCategory existingCategory = vacineCategoryRepo.findByCategoryName(categoryName.trim());
        if (existingCategory != null) {
            throw new IllegalArgumentException("Category already exists");
        }

        // Create new category with auto-generated ID
        VacineCategory newCategory = new VacineCategory();
        newCategory.setCategoryName(categoryName.trim());
        
        // Get the maximum existing ID and increment by 1
        Integer maxId = vacineCategoryRepo.findAll().stream()
            .map(VacineCategory::getCategoryId)
            .max(Integer::compareTo)
            .orElse(0);
        newCategory.setCategoryId(maxId + 1);
        
        return vacineCategoryRepo.save(newCategory);
    }

    public VacineCategory getOrCreateCategory(String categoryName) {
        if (categoryName == null || categoryName.trim().isEmpty()) {
            return null;
        }

        VacineCategory category = vacineCategoryRepo.findByCategoryName(categoryName.trim());
        if (category == null) {
            return addCategory(categoryName.trim());
        }
        return category;
    }
} 