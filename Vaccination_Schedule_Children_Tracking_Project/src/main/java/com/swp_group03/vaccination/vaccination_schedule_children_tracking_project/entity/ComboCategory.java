package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "combo_category")
public class ComboCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id", nullable = false)
    private Integer id;

    @Size(max = 100)
    @Column(name = "category_name", length = 100)
    private String comboCategoryName;
    
    @Column(name = "description")
    private String description;
    
    @Column(name = "status")
    private Boolean status = true;

    // Bidirectional many-to-many with VaccineCombo
    @OneToMany(mappedBy = "comboCategory", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ComboCategoryDetail> comboDetails = new HashSet<>();

    // Helper method to add combo detail
    public void addComboDetail(ComboCategoryDetail detail) {
        comboDetails.add(detail);
        detail.setComboCategory(this);
    }

    // Helper method to remove combo detail
    public void removeComboDetail(ComboCategoryDetail detail) {
        comboDetails.remove(detail);
        detail.setComboCategory(null);
    }
}