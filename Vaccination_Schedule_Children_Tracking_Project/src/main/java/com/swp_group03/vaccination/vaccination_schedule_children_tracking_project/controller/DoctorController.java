package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DoctorController {
    private final AccountRepository accountRepository;

    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllDoctors() {
        try {
            List<Account> doctors = accountRepository.findAllDoctors();
            
            var doctorDTOs = doctors.stream()
                .map(doctor -> new DoctorDTO(
                    doctor.getAccountId(),
                    doctor.getFirstName(),
                    doctor.getLastName(),
                    "Pediatrician", // Default specialization
                    doctor.getUrlImage()
                ))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(doctorDTOs);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Error fetching doctors: " + e.getMessage()));
        }
    }
}

class DoctorDTO {
    private String id;
    private String firstName;
    private String lastName;
    private String specialization;
    private String imageUrl;

    public DoctorDTO(String id, String firstName, String lastName, String specialization, String imageUrl) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.specialization = specialization;
        this.imageUrl = imageUrl;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
} 