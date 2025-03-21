package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.DoseInterval;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Vaccine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoseIntervalRepository extends JpaRepository<DoseInterval, Long> {
    
    List<DoseInterval> findByVaccineOrderByFromDoseAsc(Vaccine vaccine);
    
    DoseInterval findByVaccineAndFromDose(Vaccine vaccine, Integer fromDose);
    
    List<DoseInterval> findByVaccineId(Long vaccineId);
    
    void deleteByVaccineId(Long vaccineId);
} 