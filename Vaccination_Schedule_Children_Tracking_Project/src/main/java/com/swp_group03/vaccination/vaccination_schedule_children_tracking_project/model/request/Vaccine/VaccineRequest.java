package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.Vaccine;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VacineCategory;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VaccineRequest {

    @Size(max = 255)
    @NotNull
    String name;

    String description;

    @Size(max = 255)
    String manufacturer;

    @Size(max = 255)
    String dosage;

    String contraindications;

    String precautions;

    String interactions;

    String adverseReactions;

    String storageConditions;

    String recommended;

    String preVaccination;

    String compatibility;

    String imagineUrl;

    Integer quantity;

    LocalDate expirationDate;

    BigDecimal price;

    @Size(max = 50)
    String status;

    String vaccineType;

    LocalDate productionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "CategoryID")
    VacineCategory categoryID;
}
