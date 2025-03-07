package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class VaccineComboRequest {
    
    @NotBlank(message = "Combo name cannot be blank")
    @Size(max = 100, message = "Combo name cannot exceed 100 characters")
    private String comboName;
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
    
    private Double price;
    
    private Double saleOff;
    
    private Integer minAge;
    
    private Integer maxAge;
    
    private Boolean status;
    
    // List of category IDs this combo belongs to
    private List<Integer> categories;
    
    // List of vaccines in this combo
    @NotEmpty(message = "Vaccine details cannot be empty")
    private List<Long> vaccineIds;
} 