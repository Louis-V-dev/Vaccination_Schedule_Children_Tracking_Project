package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkScheduleResponse {
    private String id;
    private EmployeeInfo employee;
    private ShiftResponse shift;
    private LocalDate workDate;
    private boolean isPatternGenerated;
    private int weekNumber;
    private int dayOfWeek;
    private List<EmployeeInfo> sameRoleEmployees; // Employees with same role working same shift
} 