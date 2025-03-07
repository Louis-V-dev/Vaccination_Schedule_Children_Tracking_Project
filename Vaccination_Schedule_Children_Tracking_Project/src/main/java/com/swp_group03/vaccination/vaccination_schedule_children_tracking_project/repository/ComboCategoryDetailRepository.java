package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.ComboCategoryDetail;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.ComboCategoryDetailId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComboCategoryDetailRepository extends JpaRepository<ComboCategoryDetail, ComboCategoryDetailId> {
    List<ComboCategoryDetail> findByIdComboId(Integer comboId);
    List<ComboCategoryDetail> findByIdCategoryId(Integer categoryId);
    void deleteByIdComboId(Integer comboId);
    void deleteByIdCategoryId(Integer categoryId);
} 