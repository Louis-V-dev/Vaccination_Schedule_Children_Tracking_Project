package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftChangeRequestResponse {
    private String id;
    private EmployeeInfo requester;
    private EmployeeInfo target;
    private WorkScheduleResponse originalSchedule;
    private WorkScheduleResponse targetSchedule;
    private String status;
    private String adminStatus;
    private String targetStatus;
    private LocalDateTime requestTime;
    private LocalDateTime adminResponseTime;
    private LocalDateTime targetResponseTime;
    private String reason;
    private String adminResponseMessage;
    private String targetResponseMessage;
} 