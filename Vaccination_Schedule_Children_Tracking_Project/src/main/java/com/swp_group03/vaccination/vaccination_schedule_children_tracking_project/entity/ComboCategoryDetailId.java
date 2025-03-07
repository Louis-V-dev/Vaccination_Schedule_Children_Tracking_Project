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
public class ComboCategoryDetailId implements Serializable {
    private static final long serialVersionUID = 285436133686361021L;
    
    @NotNull
    @Column(name = "combo_id", nullable = false)
    private Integer comboId;

    @NotNull
    @Column(name = "category_id", nullable = false)
    private Integer categoryId;
    
    // Default constructor
    public ComboCategoryDetailId() {
    }
    
    // Constructor with parameters
    public ComboCategoryDetailId(Integer comboId, Integer categoryId) {
        this.comboId = comboId;
        this.categoryId = categoryId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ComboCategoryDetailId that = (ComboCategoryDetailId) o;
        return Objects.equals(comboId, that.comboId) &&
                Objects.equals(categoryId, that.categoryId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(comboId, categoryId);
    }
} 