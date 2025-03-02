package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccineCombo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccineComboDetail;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccineComboDetailId;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.VaccineComboDetailRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.VaccineComboRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComboService {

    @Autowired
    private VaccineComboRepository comboRepository;

    @Autowired
    private VaccineComboDetailRepository comboDetailRepository;

    @Transactional
    public VaccineCombo addCombo(VaccineCombo combo, List<VaccineComboDetail> details) {
        // Save the combo first
        VaccineCombo savedCombo = comboRepository.save(combo);

        // Set the combo reference and save each detail
        details.forEach(detail -> {
            detail.setCombo(savedCombo);
            detail.getId().setComboId(savedCombo.getId());
            comboDetailRepository.save(detail);
        });

        return savedCombo;
    }

    @Transactional
    public VaccineCombo updateCombo(Integer id, VaccineCombo combo, List<VaccineComboDetail> details) {
        VaccineCombo existingCombo = comboRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Combo not found with id: " + id));

        // Update basic combo info
        existingCombo.setComboName(combo.getComboName());
        existingCombo.setDescription(combo.getDescription());
        existingCombo.setStatus(combo.getStatus());

        // Delete existing details
        comboDetailRepository.deleteByComboId(id);

        // Save new details
        details.forEach(detail -> {
            detail.setCombo(existingCombo);
            detail.getId().setComboId(existingCombo.getId());
            comboDetailRepository.save(detail);
        });

        return comboRepository.save(existingCombo);
    }

    public List<VaccineCombo> getAllCombos() {
        return comboRepository.findAll();
    }

    public VaccineCombo getComboById(Integer id) {
        return comboRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Combo not found with id: " + id));
    }

    @Transactional
    public void deleteCombo(Integer id) {
        // Delete details first due to foreign key constraint
        comboDetailRepository.deleteByComboId(id);
        comboRepository.deleteById(id);
    }

    public List<VaccineCombo> searchCombosByName(String name) {
        return comboRepository.findByComboNameContainingIgnoreCase(name);
    }
} 