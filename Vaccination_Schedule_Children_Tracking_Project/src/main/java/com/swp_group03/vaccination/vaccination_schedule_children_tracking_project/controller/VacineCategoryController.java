package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VacineCategory;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.VacineCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@PreAuthorize("isAuthenticated()")
public class VacineCategoryController {

    @Autowired
    private VacineCategoryService vacineCategoryService;

    @GetMapping("/all")
    public ResponseEntity<List<VacineCategory>> getAllCategories() {
        return ResponseEntity.ok(vacineCategoryService.getAllCategories());
    }

    @PostMapping("/add")
    public ResponseEntity<?> addCategory(@RequestBody VacineCategory category) {
        try {
            VacineCategory savedCategory = vacineCategoryService.addCategory(category.getCategoryName());
            return ResponseEntity.ok(savedCategory);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Failed to add category: " + e.getMessage()));
        }
    }
} 