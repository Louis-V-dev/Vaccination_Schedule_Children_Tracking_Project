package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "shift_change_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftChangeRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private Account requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_id", nullable = false)
    private Account target;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_schedule_id", nullable = false)
    private WorkSchedule originalSchedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_schedule_id", nullable = false)
    private WorkSchedule targetSchedule;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String adminStatus;

    @Column(nullable = false)
    private String targetStatus;

    @Column(nullable = false)
    private LocalDateTime requestTime;

    @Column
    private LocalDateTime adminResponseTime;

    @Column
    private LocalDateTime targetResponseTime;

    @Column(nullable = false)
    private String reason;

    @Column
    private String adminResponseMessage;

    @Column
    private String targetResponseMessage;
} 