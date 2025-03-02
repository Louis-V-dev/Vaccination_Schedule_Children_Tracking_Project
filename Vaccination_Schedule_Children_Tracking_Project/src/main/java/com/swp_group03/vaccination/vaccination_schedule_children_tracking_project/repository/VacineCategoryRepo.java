package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VacineCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VacineCategoryRepo extends JpaRepository<VacineCategory, Integer> {
    VacineCategory findByCategoryName(String categoryName);
} 