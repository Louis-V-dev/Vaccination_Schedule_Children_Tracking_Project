package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Child;
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
import org.springframework.security.access.prepost.PreAuthorize;
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
    public ResponseEntity<Child> createChild(@Valid @RequestBody ChildrenRequest child, Authentication authentication) {
        // Get the authenticated user
        Account parent = userService.getUserFromAuthentication(authentication);
        // Create child with parent account
        Child newChild = childService.createChildren(child, parent);
        return ResponseEntity.ok(newChild);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateChild(@Validated @RequestBody ChildrenRequest child, @PathVariable String id, Authentication authentication) {
        try {
            // Get the authenticated user
            String username = authentication.getName();
            
            // Get the child to check ownership
            Child existingChild = childService.getChildById(id);
            
            // Check if user is the parent of the child
            boolean isParent = existingChild.getAccount_Id() != null && 
                              username.equals(existingChild.getAccount_Id().getAccountId());
            
            // If user is not the parent, deny access
            if (!isParent) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You don't have permission to update this child's information");
            }
            
            return ResponseEntity.ok(childService.updateChildren(child, id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping()
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<Child>> getChildren() {
        return ResponseEntity.ok(childService.getChildren());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getChildById(@PathVariable String id, Authentication authentication) {
        try {
            // Get the authenticated user
            Account user = userService.getUserFromAuthentication(authentication);
            String username = authentication.getName();
            
            // Get the child
            Child child = childService.getChildById(id);
            
            // Check if user is the parent of the child
            boolean isParent = child.getAccount_Id() != null && 
                               username.equals(child.getAccount_Id().getAccountId());
            
            // If user is not the parent, deny access
            if (!isParent) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You don't have permission to view this child's information");
            }
            
            return ResponseEntity.ok(child);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @GetMapping("/guardian")
    public ResponseEntity<List<Child>> getChildrenByGuardian(Authentication authentication) {
        try {
            // Get the authenticated user
            Account guardian = userService.getUserFromAuthentication(authentication);
            
            // Log the request for debugging
            System.out.println("Fetching children for user: " + guardian.getAccountId());
            
            // Get children for this user
            List<Child> children = childService.getChildrenByGuardian(guardian);
            
            System.out.println("Found " + children.size() + " children for user: " + guardian.getAccountId());
            
            return ResponseEntity.ok(children);
        } catch (Exception e) {
            System.err.println("Error fetching children for guardian: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    @GetMapping("/guardian/paged")
    public ResponseEntity<?> getChildrenByGuardianPaged(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "child_name") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        
        try {
            // Get the authenticated user
            Account guardian = userService.getUserFromAuthentication(authentication);
            
            // Log the request for debugging
            System.out.println("Fetching paged children for user: " + guardian.getAccountId() + 
                              ", page: " + page + ", size: " + size);
            
            Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
            
            // Get children for this user
            Page<Child> children = childService.getChildrenByGuardian(guardian, pageable);
            
            System.out.println("Found " + children.getTotalElements() + " total children for user: " + 
                              guardian.getAccountId() + " (page " + page + " contains " + 
                              children.getNumberOfElements() + " items)");
            
            return ResponseEntity.ok(children);
        } catch (Exception e) {
            System.err.println("Error fetching paged children for guardian: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error fetching children: " + e.getMessage());
        }
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<Child>> searchChildren(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String bloodType) {
        
        return ResponseEntity.ok(childService.searchChildren(name, gender, bloodType));
    }
    
    @GetMapping("/search/name")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<Child>> searchByName(@RequestParam String name) {
        return ResponseEntity.ok(childService.searchChildrenByName(name));
    }
    
    @GetMapping("/search/blood-type")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<Child>> searchByBloodType(@RequestParam String bloodType) {
        return ResponseEntity.ok(childService.getChildrenByBloodType(bloodType));
    }
    
    @GetMapping("/search/allergies")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<Child>> searchByAllergies(@RequestParam String allergies) {
        return ResponseEntity.ok(childService.searchChildrenByAllergies(allergies));
    }
    
    @GetMapping("/search/medical-condition")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<Child>> searchByMedicalCondition(@RequestParam String condition) {
        return ResponseEntity.ok(childService.searchChildrenByMedicalCondition(condition));
    }
    
    @GetMapping("/search/age-range")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<Child>> searchByAgeRange(
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date fromDate,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") Date toDate) {
        
        return ResponseEntity.ok(childService.getChildrenByAgeRange(fromDate, toDate));
    }
    

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivateChild(@PathVariable String id, Authentication authentication) {
        try {
            // Get the authenticated user
            String username = authentication.getName();
            
            // Get the child to check ownership
            Child child = childService.getChildById(id);
            
            // Check if user is the parent of the child
            boolean isParent = child.getAccount_Id() != null && 
                              username.equals(child.getAccount_Id().getAccountId());
            
            // If user is not the parent, deny access
            if (!isParent) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You don't have permission to delete this child's information");
            }
            
            childService.deactivateChild(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    @PostMapping("/{id}/reactivate")
    public ResponseEntity<?> reactivateChild(@PathVariable String id, Authentication authentication) {
        try {
            // Get the authenticated user
            String username = authentication.getName();
            
            // Get the child to check ownership
            Child child = childService.getChildById(id);
            
            // Check if user is the parent of the child
            boolean isParent = child.getAccount_Id() != null && 
                              username.equals(child.getAccount_Id().getAccountId());
            
            // If user is not the parent, deny access
            if (!isParent) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You don't have permission to reactivate this child's information");
            }
            
            childService.reactivateChild(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
