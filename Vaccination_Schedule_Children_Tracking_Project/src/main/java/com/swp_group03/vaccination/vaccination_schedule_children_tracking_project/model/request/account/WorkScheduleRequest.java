package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account;

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
    private String employeeId;
    private List<WeeklySchedule> weeklySchedules;
    private Boolean applyFromThisWeek;
    private Integer numberOfWeeks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklySchedule {
        private int weekNumber;
        private List<DailySchedule> dailySchedules;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailySchedule {
        private int dayOfWeek;
        private String shiftId;
    }
} 