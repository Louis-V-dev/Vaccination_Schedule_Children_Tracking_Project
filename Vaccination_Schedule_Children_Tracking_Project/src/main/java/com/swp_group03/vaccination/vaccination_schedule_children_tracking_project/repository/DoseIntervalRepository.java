package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.DoseInterval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoseIntervalRepository extends JpaRepository<DoseInterval, Long> {
    
    List<DoseInterval> findByVaccineIdOrderByFromDoseAsc(Long vaccineId);
    
    void deleteByVaccineId(Long vaccineId);
} 