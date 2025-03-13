package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PatternShift;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.SchedulePattern;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.ShiftResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatternResponseDTO {
    private Long id;
    private String name;
    private String employeeId;
    private String employeeName;
    private LocalDateTime creationDate;
    private LocalDateTime lastModified;
    private boolean active;
    private List<PatternShiftDTO> patternShifts;

    public static PatternResponseDTO fromEntity(SchedulePattern pattern) {
        return PatternResponseDTO.builder()
                .id(pattern.getId())
                .name(pattern.getName())
                .employeeId(pattern.getEmployee().getAccountId())
                .employeeName(pattern.getEmployee().getFullName())
                .creationDate(pattern.getCreationDate())
                .lastModified(pattern.getLastModified())
                .active(pattern.isActive())
                .patternShifts(pattern.getShifts().stream()
                        .map(PatternShiftDTO::fromEntity)
                        .collect(Collectors.toList()))
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PatternShiftDTO {
        private Long id;
        private int weekNumber;
        private int dayOfWeek;
        private ShiftResponse shift;

        public static PatternShiftDTO fromEntity(PatternShift patternShift) {
            return PatternShiftDTO.builder()
                    .id(patternShift.getId())
                    .weekNumber(patternShift.getWeekNumber())
                    .dayOfWeek(patternShift.getDayOfWeek())
                    .shift(ShiftResponse.fromEntity(patternShift.getShift()))
                    .build();
        }
    }
} 