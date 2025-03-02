package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccineCombo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccineComboDetail;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.ComboService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/combos")
@PreAuthorize("isAuthenticated()")
public class ComboController {

    @Autowired
    private ComboService comboService;

    @PostMapping
    public ResponseEntity<VaccineCombo> addCombo(@RequestBody Map<String, Object> request) {
        try {
            VaccineCombo combo = new VaccineCombo();
            combo.setComboName((String) request.get("comboName"));
            combo.setDescription((String) request.get("description"));
            combo.setStatus(true);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> vaccineDetails = (List<Map<String, Object>>) request.get("vaccines");
            List<VaccineComboDetail> details = vaccineDetails.stream()
                .map(detail -> {
                    VaccineComboDetail comboDetail = new VaccineComboDetail();
                    comboDetail.setDose((Integer) detail.get("doses"));
                    comboDetail.setAgeGroup((String) detail.get("ageGroup"));
                    comboDetail.setSaleOff(((Number) detail.get("saleOff")).doubleValue());
                    comboDetail.getId().setVaccineId((Integer) detail.get("vaccineId"));
                    return comboDetail;
                })
                .toList();

            VaccineCombo savedCombo = comboService.addCombo(combo, details);
            return ResponseEntity.ok(savedCombo);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<VaccineCombo> updateCombo(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
        try {
            VaccineCombo combo = new VaccineCombo();
            combo.setComboName((String) request.get("comboName"));
            combo.setDescription((String) request.get("description"));
            combo.setStatus(true);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> vaccineDetails = (List<Map<String, Object>>) request.get("vaccines");
            List<VaccineComboDetail> details = vaccineDetails.stream()
                .map(detail -> {
                    VaccineComboDetail comboDetail = new VaccineComboDetail();
                    comboDetail.setDose((Integer) detail.get("doses"));
                    comboDetail.setAgeGroup((String) detail.get("ageGroup"));
                    comboDetail.setSaleOff(((Number) detail.get("saleOff")).doubleValue());
                    comboDetail.getId().setVaccineId((Integer) detail.get("vaccineId"));
                    return comboDetail;
                })
                .toList();

            VaccineCombo updatedCombo = comboService.updateCombo(id, combo, details);
            return ResponseEntity.ok(updatedCombo);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<VaccineCombo>> getAllCombos() {
        try {
            List<VaccineCombo> combos = comboService.getAllCombos();
            return ResponseEntity.ok(combos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<VaccineCombo> getComboById(@PathVariable Integer id) {
        try {
            VaccineCombo combo = comboService.getComboById(id);
            return ResponseEntity.ok(combo);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCombo(@PathVariable Integer id) {
        try {
            comboService.deleteCombo(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<VaccineCombo>> searchCombosByName(@RequestParam String name) {
        try {
            List<VaccineCombo> combos = comboService.searchCombosByName(name);
            return ResponseEntity.ok(combos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
} 