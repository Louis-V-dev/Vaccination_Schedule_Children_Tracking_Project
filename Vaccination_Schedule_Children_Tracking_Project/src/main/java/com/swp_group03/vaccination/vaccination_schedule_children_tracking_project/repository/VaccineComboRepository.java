package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccineCombo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VaccineComboRepository extends JpaRepository<VaccineCombo, Integer> {
    List<VaccineCombo> findByComboNameContainingIgnoreCase(String name);
} 