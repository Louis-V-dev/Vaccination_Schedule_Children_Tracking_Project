package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoseScheduleDTO {
    private Long id;
    private VaccineOfChildDTO vaccineOfChild;
    private Integer doseNumber;
    private String status;
    private String scheduledDate;
    private Boolean isPaid;
    
    // Direct vaccine info fields for easier frontend access
    private String vaccineName;
    private BigDecimal price;
    private Long vaccineId;
    
    // Additional fields to improve frontend experience
    private String vaccineDescription;
    private String vaccineManufacturer;
    private Integer totalDoses;
    private String vaccineCategory;
    private Boolean isFromCombo;
} 