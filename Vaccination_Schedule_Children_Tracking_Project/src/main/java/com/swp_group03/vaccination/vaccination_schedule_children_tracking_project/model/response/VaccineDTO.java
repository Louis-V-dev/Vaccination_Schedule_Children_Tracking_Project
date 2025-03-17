package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VaccineDTO {
    private Long id;
    private String name;
    private String description;
    private String manufacturer;
    private String categoryName;
    private Integer categoryId;
    private String dosage;
    private String contraindications;
    private String precautions;
    private String interactions;
    private String adverseReactions;
    private String storageConditions;
    private String recommended;
    private String preVaccination;
    private String compatibility;
    private String imagineUrl;
    private Integer quantity;
    private LocalDate expirationDate;
    private BigDecimal price;
    private String status;
    private LocalDate productionDate;
} 