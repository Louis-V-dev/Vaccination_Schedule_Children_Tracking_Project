package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.ComboDetail;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.ComboDetailId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComboDetailRepository extends JpaRepository<ComboDetail, ComboDetailId> {
    List<ComboDetail> findByIdComboId(Integer comboId);
    List<ComboDetail> findByIdVaccineId(Long vaccineId);
    void deleteByIdComboId(Integer comboId);
} 