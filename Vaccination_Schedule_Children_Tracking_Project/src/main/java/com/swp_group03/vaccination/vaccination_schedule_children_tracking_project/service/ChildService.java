package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Appointment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Child;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.HealthRecord;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccineRecord;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.mapper.ChildMapper;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.ChildrenRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.ChildRepo;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Service
public class ChildService {

    @Autowired
    private ChildRepo childRepo;

    @Autowired
    private ChildMapper childMapper;

    public Child createChildren(ChildrenRequest childrenRequest){
        Child child = new Child();
        child.setChild_name(childrenRequest.getChild_name());
        child.setDob(childrenRequest.getDob());
        child.setHeight(childrenRequest.getHeight());
        child.setWeight(childrenRequest.getWeight());
        child.setGender(childrenRequest.getGender());
        child.setActive(true);
        // Set new fields if provided in the request
        if (childrenRequest.getBloodType() != null) child.setBloodType(childrenRequest.getBloodType());
        if (childrenRequest.getAllergies() != null) child.setAllergies(childrenRequest.getAllergies());
        if (childrenRequest.getMedicalConditions() != null) child.setMedicalConditions(childrenRequest.getMedicalConditions());
        return childRepo.save(child);
    }

    public Child updateChildren(ChildrenRequest childRequest, String id){
        Child child = childRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Child not found"));
        if (!child.isActive()) {
            throw new EntityNotFoundException("Child has been deactivated");
        }
        // Update the child entity with the mapper
        child = childMapper.toUpdateChild(childRequest);
        
        // Update new fields if they are provided in the request
        if (childRequest.getBloodType() != null) child.setBloodType(childRequest.getBloodType());
        if (childRequest.getAllergies() != null) child.setAllergies(childRequest.getAllergies());
        if (childRequest.getMedicalConditions() != null) child.setMedicalConditions(childRequest.getMedicalConditions());
        
        return childRepo.save(child);
    }

    public List<Child> getChildren(){
        return childRepo.findByActiveTrue();
    }
    
    /**
     * Find a child by ID
     * @param id The child ID
     * @return The child entity
     * @throws EntityNotFoundException if child not found
     */
    public Child getChildById(String id) {
        Child child = childRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Child not found with ID: " + id));
        if (!child.isActive()) {
            throw new EntityNotFoundException("Child has been deactivated");
        }
        return child;
    }
    
    /**
     * Find all children associated with a specific guardian
     * @param guardian The guardian account
     * @return List of children
     */
    public List<Child> getChildrenByGuardian(Account guardian) {
        return childRepo.findByAccount_IdAndActiveTrue(guardian);
    }
    
    /**
     * Find all children associated with a specific guardian with pagination
     * @param guardian The guardian account
     * @param pageable Pagination information
     * @return Page of children
     */
    public Page<Child> getChildrenByGuardian(Account guardian, Pageable pageable) {
        return childRepo.findByAccount_IdAndActiveTrue(guardian, pageable);
    }
    
    /**
     * Search for children by name
     * @param name Part of the child's name
     * @return List of matching children
     */
    public List<Child> searchChildrenByName(String name) {
        return childRepo.findByChildNameContainingIgnoreCaseAndActiveTrue(name);
    }
    
    /**
     * Find children by age range
     * @param fromDate Start date for date of birth
     * @param toDate End date for date of birth
     * @return List of children in the specified age range
     */
    public List<Child> getChildrenByAgeRange(Date fromDate, Date toDate) {
        List<Child> children;
        if (fromDate != null && toDate != null) {
            children = childRepo.findByActiveTrueAndDobBetween(fromDate, toDate);
        } else if (fromDate != null) {
            children = childRepo.findByActiveTrueAndDobGreaterThanEqual(fromDate);
        } else if (toDate != null) {
            children = childRepo.findByActiveTrueAndDobLessThanEqual(toDate);
        } else {
            children = childRepo.findByActiveTrue();
        }
        return children;
    }
    
    /**
     * Find children by blood type
     * @param bloodType The blood type
     * @return List of children with the specified blood type
     */
    public List<Child> getChildrenByBloodType(String bloodType) {
        return childRepo.findByBloodTypeAndActiveTrue(bloodType);
    }
    
    /**
     * Search for children by allergies
     * @param allergies Part of the allergies description
     * @return List of matching children
     */
    public List<Child> searchChildrenByAllergies(String allergies) {
        return childRepo.findByAllergiesContainingIgnoreCaseAndActiveTrue(allergies);
    }
    
    /**
     * Search for children by medical conditions
     * @param condition Part of the medical condition description
     * @return List of matching children
     */
    public List<Child> searchChildrenByMedicalCondition(String condition) {
        return childRepo.findByMedicalConditionsContainingIgnoreCaseAndActiveTrue(condition);
    }
    
    /**
     * Advanced search for children by multiple criteria
     * @param name Part of the child's name (optional)
     * @param gender The gender (optional)
     * @param bloodType The blood type (optional)
     * @return List of matching children
     */
    public List<Child> searchChildren(String name, String gender, String bloodType) {
        return childRepo.searchActiveChildren(name, gender, bloodType);
    }
    
    /**
     * Get health records for a child
     * @param childId The child ID
     * @return List of health records
     */
    public List<HealthRecord> getChildHealthRecords(String childId) {
        Child child = getChildById(childId);
        return child.getHealthRecords();
    }
    
    /**
     * Get vaccine records for a child
     * @param childId The child ID
     * @return List of vaccine records
     */
    public List<VaccineRecord> getChildVaccineRecords(String childId) {
        Child child = getChildById(childId);
        return child.getVaccineRecords();
    }
    
    /**
     * Get appointments for a child
     * @param childId The child ID
     * @return List of appointments
     */
    public List<Appointment> getChildAppointments(String childId) {
        Child child = getChildById(childId);
        return child.getAppointments();
    }
    
    /**
     * Deactivate a child by ID
     * @param id The child ID
     */
    @Transactional
    public void deactivateChild(String id) {
        Child child = childRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Child not found with ID: " + id));
        child.setActive(false);
        childRepo.save(child);
    }
    
    /**
     * Reactivate a child by ID
     * @param id The child ID
     */
    @Transactional
    public void reactivateChild(String id) {
        Child child = childRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Child not found with ID: " + id));
        child.setActive(true);
        childRepo.save(child);
    }
}
