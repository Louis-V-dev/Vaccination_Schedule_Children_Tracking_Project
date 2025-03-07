package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Getter
@Setter
@Table(name = "combo_detail")
public class ComboDetail implements Serializable {

    @EmbeddedId
    private ComboDetailId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("comboId")
    @JoinColumn(name = "combo_id")
    private VaccineCombo vaccineCombo;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("vaccineId")
    @JoinColumn(name = "vaccineid")
    private Vaccine vaccine;

    public ComboDetail() {
        this.id = new ComboDetailId();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ComboDetail that = (ComboDetail) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
} 