package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vaccine_administration_batches")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VaccineAdministrationBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "batch_id")
    Long id;
    
    @OneToOne
    @JoinColumn(name = "appointment_id", nullable = false)
    Appointment appointment;
    
    @ManyToOne
    @JoinColumn(name = "child_id", nullable = false)
    Child child;
    
    @ManyToOne
    @JoinColumn(name = "nurse_id", nullable = false)
    Account nurse;
    
    @Column(name = "total_vaccines_administered")
    Integer totalVaccinesAdministered = 0;
    
    @Column(name = "general_notes", length = 1000)
    String generalNotes;
    
    @OneToMany(mappedBy = "administrationBatch", cascade = CascadeType.ALL)
    List<VaccineRecord> vaccineRecords = new ArrayList<>();
    
    @Column(name = "administered_at")
    LocalDateTime administeredAt;
    
    @PrePersist
    protected void onCreate() {
        administeredAt = LocalDateTime.now();
    }
} 