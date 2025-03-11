package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Shift;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {
    boolean existsByName(String name);
    
    // Find all active shifts with pagination
    Page<Shift> findByStatusTrue(Pageable pageable);
    
    // Find all active shifts without pagination
    List<Shift> findByStatusTrue();
} 