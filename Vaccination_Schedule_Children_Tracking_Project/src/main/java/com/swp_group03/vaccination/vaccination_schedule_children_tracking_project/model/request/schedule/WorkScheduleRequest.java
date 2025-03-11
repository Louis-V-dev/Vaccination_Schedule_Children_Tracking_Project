package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.schedule;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkScheduleRequest {
    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    @NotNull(message = "Apply from this week flag is required")
    private Boolean applyFromThisWeek;

    @NotEmpty(message = "Weekly schedules are required")
    private List<WeeklySchedule> weeklySchedules;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklySchedule {
        @NotEmpty(message = "Daily schedules are required")
        private List<DailySchedule> dailySchedules;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailySchedule {
        @NotNull(message = "Day of week is required")
        private Integer dayOfWeek;

        @NotBlank(message = "Shift ID is required")
        private String shiftId;
    }
} 