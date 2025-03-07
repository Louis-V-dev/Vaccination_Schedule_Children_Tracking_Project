package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@Table(name = "vaccine_combo")
public class VaccineCombo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "combo_id")
    private Integer comboId;

    @NotBlank(message = "Combo name cannot be blank")
    @Size(max = 100)
    @Column(name = "combo_name", length = 100)
    private String comboName;

    @Size(max = 500)
    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "price")
    private Double price;

    @Column(name = "sale_off")
    private Double saleOff = 0.0;

    @Column(name = "min_age")
    private Integer minAge;

    @Column(name = "max_age")
    private Integer maxAge;

    @Column(name = "status")
    private Boolean status = true;

    @Column(name = "category_id", insertable = false, updatable = false)
    private Integer categoryId;

    // Bidirectional many-to-many with Vaccine
    @OneToMany(mappedBy = "vaccineCombo", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ComboDetail> vaccineDetails = new HashSet<>();

    // Bidirectional many-to-many with ComboCategory
    @OneToMany(mappedBy = "vaccineCombo", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ComboCategoryDetail> categoryDetails = new HashSet<>();

    // Helper method to add vaccine detail
    public void addVaccineDetail(ComboDetail detail) {
        vaccineDetails.add(detail);
        detail.setVaccineCombo(this);
    }

    // Helper method to remove vaccine detail
    public void removeVaccineDetail(ComboDetail detail) {
        vaccineDetails.remove(detail);
        detail.setVaccineCombo(null);
    }

    // Helper method to add category detail
    public void addCategoryDetail(ComboCategoryDetail detail) {
        categoryDetails.add(detail);
        detail.setVaccineCombo(this);
    }

    // Helper method to remove category detail
    public void removeCategoryDetail(ComboCategoryDetail detail) {
        categoryDetails.remove(detail);
        detail.setVaccineCombo(null);
    }
}