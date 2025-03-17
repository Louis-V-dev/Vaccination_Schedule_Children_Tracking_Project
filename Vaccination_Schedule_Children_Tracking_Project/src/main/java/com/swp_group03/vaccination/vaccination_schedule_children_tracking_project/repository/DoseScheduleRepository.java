package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.DoseSchedule;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccineOfChild;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DoseScheduleRepository extends JpaRepository<DoseSchedule, Long> {
    List<DoseSchedule> findByVaccineOfChildOrderByDoseNumberAsc(VaccineOfChild vaccineOfChild);
    
    @Query("SELECT ds FROM DoseSchedule ds WHERE ds.vaccineOfChild.child.child_id = :childId AND ds.status = 'UNSCHEDULED' ORDER BY ds.vaccineOfChild.id, ds.doseNumber")
    List<DoseSchedule> findUnscheduledDosesByChildId(String childId);
    
    @Query("SELECT ds FROM DoseSchedule ds WHERE ds.vaccineOfChild.child.child_id = :childId AND ds.status = 'SCHEDULED' AND ds.scheduledDate >= CURRENT_DATE ORDER BY ds.scheduledDate")
    List<DoseSchedule> findUpcomingDosesByChildId(String childId);
} 