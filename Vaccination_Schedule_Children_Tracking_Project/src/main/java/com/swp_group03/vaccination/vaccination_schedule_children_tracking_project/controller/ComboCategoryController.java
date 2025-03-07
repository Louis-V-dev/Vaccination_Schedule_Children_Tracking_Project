package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.ComboCategoryRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ComboCategoryResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.ComboCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/combo-categories")
@RequiredArgsConstructor
@Tag(name = "Combo Category", description = "Combo category management APIs")
@CrossOrigin(origins = "http://localhost:5173")
@PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'STAFF')")
public class ComboCategoryController {

    private final ComboCategoryService comboCategoryService;

    @GetMapping
    @Operation(summary = "Get all combo categories")
    public ApiResponse<List<ComboCategoryResponse>> getAllCategories() {
        System.out.println("Fetching all combo categories");
        ApiResponse<List<ComboCategoryResponse>> response = new ApiResponse<>();
        response.setResult(comboCategoryService.getAllCategories());
        response.setMessage("Retrieved all combo categories successfully");
        response.setCode(200);
        return response;
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get combo category by ID")
    public ApiResponse<ComboCategoryResponse> getCategoryById(@PathVariable Integer id) {
        System.out.println("Fetching combo category with ID: " + id);
        ApiResponse<ComboCategoryResponse> response = new ApiResponse<>();
        response.setResult(comboCategoryService.getCategoryById(id));
        response.setMessage("Retrieved combo category successfully");
        response.setCode(200);
        return response;
    }

    @PostMapping
    @Operation(summary = "Create new combo category")
    public ApiResponse<ComboCategoryResponse> createCategory(@Valid @RequestBody ComboCategoryRequest request) {
        System.out.println("Received create category request: " + request);
        
        ApiResponse<ComboCategoryResponse> response = new ApiResponse<>();
        response.setResult(comboCategoryService.createCategory(request));
        response.setMessage("Created combo category successfully");
        response.setCode(201);
        return response;
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update combo category")
    public ApiResponse<ComboCategoryResponse> updateCategory(
            @PathVariable Integer id,
            @Valid @RequestBody ComboCategoryRequest request) {
        System.out.println("Updating combo category with ID: " + id);
        ApiResponse<ComboCategoryResponse> response = new ApiResponse<>();
        response.setResult(comboCategoryService.updateCategory(id, request));
        response.setMessage("Updated combo category successfully");
        response.setCode(200);
        return response;
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete combo category")
    public ResponseEntity<Void> deleteCategory(@PathVariable Integer id) {
        System.out.println("Deleting combo category with ID: " + id);
        comboCategoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
} 