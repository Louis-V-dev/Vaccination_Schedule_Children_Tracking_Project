package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "post_vaccination_monitoring")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PostVaccinationMonitoring {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "monitoring_id")
    Long id;
    
    @OneToOne
    @JoinColumn(name = "appointment_id", nullable = false)
    Appointment appointment;
    
    @ManyToOne
    @JoinColumn(name = "child_id", nullable = false)
    Child child;
    
    @Column(name = "start_time")
    LocalDateTime startTime;
    
    @Column(name = "end_time")
    LocalDateTime endTime;
    
    @Column(name = "observation_minutes")
    Integer observationMinutes;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "overall_reaction")
    ReactionSeverity overallReaction = ReactionSeverity.NONE;
    
    @Column(name = "reaction_details", length = 1000)
    String reactionDetails;
    
    @Column(name = "action_taken", length = 1000)
    String actionTaken;
    
    @Column(name = "recommendations", length = 1000)
    String recommendations;
    
    @Column(name = "requires_follow_up")
    Boolean requiresFollowUp = false;
    
    @ManyToOne
    @JoinColumn(name = "monitored_by", nullable = false)
    Account monitoredBy;
    
    @Column(name = "recorded_at")
    LocalDateTime recordedAt;
    
    @PrePersist
    protected void onCreate() {
        recordedAt = LocalDateTime.now();
        if (startTime != null && endTime != null) {
            observationMinutes = (int) ChronoUnit.MINUTES.between(startTime, endTime);
        }
    }
} 