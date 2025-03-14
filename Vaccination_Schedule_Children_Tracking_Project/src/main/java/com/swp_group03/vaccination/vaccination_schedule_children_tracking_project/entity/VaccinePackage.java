package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vaccine_packages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VaccinePackage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "package_id")
    Long id;
    
    @Column(name = "name", nullable = false)
    String name;
    
    @Column(name = "description", length = 1000)
    String description;
    
    @Column(name = "price", precision = 10, scale = 2, nullable = false)
    BigDecimal price;
    
    @Column(name = "discount_percentage", precision = 5, scale = 2)
    BigDecimal discountPercentage;
    
    @ManyToMany
    @JoinTable(
        name = "package_vaccines",
        joinColumns = @JoinColumn(name = "package_id"),
        inverseJoinColumns = @JoinColumn(name = "vaccine_id")
    )
    List<Vaccine> vaccines = new ArrayList<>();
    
    @Column(name = "is_active")
    Boolean isActive = true;
} 