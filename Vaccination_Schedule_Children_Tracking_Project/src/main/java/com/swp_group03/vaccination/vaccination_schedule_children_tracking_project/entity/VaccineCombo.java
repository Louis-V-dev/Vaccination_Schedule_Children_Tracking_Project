package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "Vaccine_Combo")
public class VaccineCombo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ComboId")
    private Integer comboId;

    @NotBlank(message = "Combo name cannot be blank")
    @Size(max = 100)
    @Column(name = "ComboName", length = 100)
    private String comboName;

    @Size(max = 500)
    @Column(name = "Description", length = 500)
    private String description;

    @Column(name = "Price")
    private Double price;

    @Column(name = "SaleOff")
    private Double saleOff = 0.0;

    @Column(name = "Status")
    private Boolean status = true;

    @OneToMany(mappedBy = "combo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VaccineComboDetail> vaccineDetails = new ArrayList<>();

    // Helper method to add vaccine detail
    public void addVaccineDetail(VaccineComboDetail detail) {
        vaccineDetails.add(detail);
        detail.setCombo(this);
    }

    // Helper method to remove vaccine detail
    public void removeVaccineDetail(VaccineComboDetail detail) {
        vaccineDetails.remove(detail);
        detail.setCombo(null);
    }
}