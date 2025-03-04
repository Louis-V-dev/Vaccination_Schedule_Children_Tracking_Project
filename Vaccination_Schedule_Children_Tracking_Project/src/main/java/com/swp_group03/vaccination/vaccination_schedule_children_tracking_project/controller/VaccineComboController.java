package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.VaccineComboRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.ApiResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.VaccineComboResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.VaccineComboService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vaccine-combos")
@RequiredArgsConstructor
@Tag(name = "Vaccine Combo", description = "Vaccine combo management APIs")
@CrossOrigin(origins = "http://localhost:5173")
@PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'NURSE', 'STAFF')")
public class VaccineComboController {

    private final VaccineComboService vaccineComboService;

    @GetMapping
    @Operation(summary = "Get all vaccine combos")
    public ApiResponse<List<VaccineComboResponse>> getAllCombos() {
        ApiResponse<List<VaccineComboResponse>> response = new ApiResponse<>();
        response.setResult(vaccineComboService.getAllCombos());
        response.setMessage("Retrieved all vaccine combos successfully");
        response.setCode(200);
        return response;
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get vaccine combo by ID")
    public ApiResponse<VaccineComboResponse> getComboById(@PathVariable Integer id) {
        ApiResponse<VaccineComboResponse> response = new ApiResponse<>();
        response.setResult(vaccineComboService.getComboById(id));
        response.setMessage("Retrieved vaccine combo successfully");
        response.setCode(200);
        return response;
    }

    @PostMapping
    @Operation(summary = "Create new vaccine combo")
    public ApiResponse<VaccineComboResponse> createCombo(@Valid @RequestBody VaccineComboRequest request) {
        ApiResponse<VaccineComboResponse> response = new ApiResponse<>();
        response.setResult(vaccineComboService.createCombo(request));
        response.setMessage("Created vaccine combo successfully");
        response.setCode(201);
        return response;
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update vaccine combo")
    public ApiResponse<VaccineComboResponse> updateCombo(
            @PathVariable Integer id,
            @Valid @RequestBody VaccineComboRequest request) {
        ApiResponse<VaccineComboResponse> response = new ApiResponse<>();
        response.setResult(vaccineComboService.updateCombo(id, request));
        response.setMessage("Updated vaccine combo successfully");
        response.setCode(200);
        return response;
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete vaccine combo")
    public ResponseEntity<Void> deleteCombo(@PathVariable Integer id) {
        vaccineComboService.deleteCombo(id);
        return ResponseEntity.noContent().build();
    }
} 