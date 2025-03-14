package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Appointment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Child;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.HealthRecord;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccineRecord;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.ChildrenRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.ChildService;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;

@RestController
@RequestMapping("/api/children")
public class ChildController {

    @Autowired
    private ChildService childService;
    
    @Autowired
    private UserService userService;

    @PostMapping("/create")
    public ResponseEntity<Child> createChild(@Valid @RequestBody ChildrenRequest child) {
        Child newChild = childService.createChildren(child);
        return ResponseEntity.ok(newChild);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Child> updateChild(@Validated @RequestBody ChildrenRequest child, @PathVariable String id) {
        return ResponseEntity.ok(childService.updateChildren(child, id));
    }

    @GetMapping()
    public ResponseEntity<List<Child>> getChildren() {
        return ResponseEntity.ok(childService.getChildren());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Child> getChildById(@PathVariable String id) {
        return ResponseEntity.ok(childService.getChildById(id));
    }
    
    @GetMapping("/guardian")
    public ResponseEntity<List<Child>> getChildrenByGuardian(Authentication authentication) {
        Account guardian = userService.getUserFromAuthentication(authentication);
        return ResponseEntity.ok(childService.getChildrenByGuardian(guardian));
    }
    
    @GetMapping("/guardian/paged")
    public ResponseEntity<Page<Child>> getChildrenByGuardianPaged(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "child_name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        
        Account guardian = userService.getUserFromAuthentication(authentication);
        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        
        return ResponseEntity.ok(childService.getChildrenByGuardian(guardian, pageable));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Child>> searchChildren(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String bloodType) {
        
        return ResponseEntity.ok(childService.searchChildren(name, gender, bloodType));
    }
    
    @GetMapping("/search/name")
    public ResponseEntity<List<Child>> searchByName(@RequestParam String name) {
        return ResponseEntity.ok(childService.searchChildrenByName(name));
    }
    
    @GetMapping("/search/blood-type")
    public ResponseEntity<List<Child>> searchByBloodType(@RequestParam String bloodType) {
        return ResponseEntity.ok(childService.getChildrenByBloodType(bloodType));
    }
    
    @GetMapping("/search/allergies")
    public ResponseEntity<List<Child>> searchByAllergies(@RequestParam String allergies) {
        return ResponseEntity.ok(childService.searchChildrenByAllergies(allergies));
    }
    
    @GetMapping("/search/medical-condition")
    public ResponseEntity<List<Child>> searchByMedicalCondition(@RequestParam String condition) {
        return ResponseEntity.ok(childService.searchChildrenByMedicalCondition(condition));
    }
    
    @GetMapping("/search/age-range")
    public ResponseEntity<List<Child>> searchByAgeRange(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fromDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date toDate) {
        
        return ResponseEntity.ok(childService.getChildrenByAgeRange(fromDate, toDate));
    }
    
    @GetMapping("/{id}/health-records")
    public ResponseEntity<List<HealthRecord>> getChildHealthRecords(@PathVariable String id) {
        return ResponseEntity.ok(childService.getChildHealthRecords(id));
    }
    
    @GetMapping("/{id}/vaccine-records")
    public ResponseEntity<List<VaccineRecord>> getChildVaccineRecords(@PathVariable String id) {
        return ResponseEntity.ok(childService.getChildVaccineRecords(id));
    }
    
    @GetMapping("/{id}/appointments")
    public ResponseEntity<List<Appointment>> getChildAppointments(@PathVariable String id) {
        return ResponseEntity.ok(childService.getChildAppointments(id));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateChild(@PathVariable String id) {
        childService.deactivateChild(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/reactivate")
    public ResponseEntity<Void> reactivateChild(@PathVariable String id) {
        childService.reactivateChild(id);
        return ResponseEntity.noContent().build();
    }
}
