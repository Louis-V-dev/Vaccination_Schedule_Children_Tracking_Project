package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Getter
@Setter
@Embeddable
public class ComboDetailId implements Serializable {
    private static final long serialVersionUID = -4753617762828333422L;
    
    @NotNull
    @Column(name = "combo_id")
    private Integer comboId;

    @NotNull
    @Column(name = "vaccineid")
    private Long vaccineId;

    public ComboDetailId() {
    }

    public ComboDetailId(Integer comboId, Long vaccineId) {
        this.comboId = comboId;
        this.vaccineId = vaccineId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ComboDetailId that = (ComboDetailId) o;
        return Objects.equals(comboId, that.comboId) &&
                Objects.equals(vaccineId, that.vaccineId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(comboId, vaccineId);
    }
} 