package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PatternShift;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeekDTO {
    private int weekNumber;
    private List<DayShiftDTO> days;

    public static List<WeekDTO> fromPatternShifts(List<PatternShift> patternShifts) {
        // Group shifts by week number
        Map<Integer, List<PatternShift>> shiftsByWeek = patternShifts.stream()
                .collect(Collectors.groupingBy(PatternShift::getWeekNumber));

        // Convert each week's shifts into WeekDTO
        return shiftsByWeek.entrySet().stream()
                .map(entry -> {
                    List<DayShiftDTO> days = new ArrayList<>();
                    // Initialize 7 days (0-6) with null shifts
                    for (int i = 0; i < 7; i++) {
                        days.add(new DayShiftDTO(i, null));
                    }
                    
                    // Fill in the shifts for days that have them
                    entry.getValue().forEach(shift -> {
                        days.set(shift.getDayOfWeek(), 
                               new DayShiftDTO(shift.getDayOfWeek(), 
                                             ShiftResponse.fromEntity(shift.getShift())));
                    });
                    
                    return WeekDTO.builder()
                            .weekNumber(entry.getKey())
                            .days(days)
                            .build();
                })
                .sorted((w1, w2) -> Integer.compare(w1.getWeekNumber(), w2.getWeekNumber()))
                .collect(Collectors.toList());
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayShiftDTO {
        private int dayOfWeek;
        private ShiftResponse shift;
    }
} 