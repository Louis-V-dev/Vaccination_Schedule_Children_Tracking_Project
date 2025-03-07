package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.ComboCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComboCategoryRepository extends JpaRepository<ComboCategory, Integer> {
    boolean existsByComboCategoryNameIgnoreCase(String name);
} 