package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccineOfChild;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Child;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Vaccine;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccineCombo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VaccineOfChildRepository extends JpaRepository<VaccineOfChild, Long> {
    List<VaccineOfChild> findByChildAndIsCompletedFalse(Child child);
    
    @Query("SELECT v FROM VaccineOfChild v WHERE v.child = :child AND v.isCompleted = false AND v.currentDose < v.totalDoses")
    List<VaccineOfChild> findIncompleteVaccinesForChild(Child child);
    
    boolean existsByChildAndVaccineIdAndIsFromComboTrue(Child child, Long vaccineId);
    
    /**
     * Find vaccine records for a specific child, vaccine, and combo
     * This helps identify if a child already has a specific vaccine from a specific combo
     */
    List<VaccineOfChild> findByChildAndVaccineAndVaccineCombo(Child child, Vaccine vaccine, VaccineCombo vaccineCombo);
} 