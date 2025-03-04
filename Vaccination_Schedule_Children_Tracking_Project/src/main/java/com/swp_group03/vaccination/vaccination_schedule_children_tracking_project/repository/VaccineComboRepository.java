package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccineCombo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VaccineComboRepository extends JpaRepository<VaccineCombo, Integer> {
    
    @Query("SELECT vc FROM VaccineCombo vc LEFT JOIN FETCH vc.vaccineDetails WHERE vc.status = true")
    List<VaccineCombo> findAllActiveWithDetails();
    
    List<VaccineCombo> findByComboNameContainingIgnoreCase(String name);
    
    boolean existsByComboNameIgnoreCase(String comboName);
} 