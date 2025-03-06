package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.DoseIntervalRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.DoseIntervalResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.DoseIntervalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vaccines/{vaccineId}/intervals")
@RequiredArgsConstructor
public class DoseIntervalController {

    private final DoseIntervalService doseIntervalService;

    @GetMapping
    public ResponseEntity<List<DoseIntervalResponse>> getIntervalsForVaccine(@PathVariable Long vaccineId) {
        return ResponseEntity.ok(doseIntervalService.getIntervalsForVaccine(vaccineId));
    }

    @PostMapping
    public ResponseEntity<DoseIntervalResponse> createInterval(
            @PathVariable Long vaccineId,
            @Valid @RequestBody DoseIntervalRequest request) {
        return new ResponseEntity<>(doseIntervalService.createInterval(vaccineId, request), HttpStatus.CREATED);
    }

    @PostMapping("/batch")
    public ResponseEntity<List<DoseIntervalResponse>> createMultipleIntervals(
            @PathVariable Long vaccineId,
            @Valid @RequestBody List<DoseIntervalRequest> requests) {
        return new ResponseEntity<>(doseIntervalService.createMultipleIntervals(vaccineId, requests), HttpStatus.CREATED);
    }

    @PutMapping("/{intervalId}")
    public ResponseEntity<DoseIntervalResponse> updateInterval(
            @PathVariable Long vaccineId,
            @PathVariable Long intervalId,
            @Valid @RequestBody DoseIntervalRequest request) {
        return ResponseEntity.ok(doseIntervalService.updateInterval(vaccineId, intervalId, request));
    }

    @DeleteMapping("/{intervalId}")
    public ResponseEntity<Void> deleteInterval(
            @PathVariable Long vaccineId,
            @PathVariable Long intervalId) {
        doseIntervalService.deleteInterval(vaccineId, intervalId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAllIntervalsForVaccine(@PathVariable Long vaccineId) {
        doseIntervalService.deleteAllIntervalsForVaccine(vaccineId);
        return ResponseEntity.noContent().build();
    }
} 