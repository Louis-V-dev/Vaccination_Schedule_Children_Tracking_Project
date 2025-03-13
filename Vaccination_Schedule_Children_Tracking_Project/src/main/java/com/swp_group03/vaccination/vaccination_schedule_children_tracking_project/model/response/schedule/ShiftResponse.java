package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Shift;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ShiftResponse {
    Long id;
    String name;
    String startTime;
    String endTime;
    boolean status;

    public static ShiftResponse fromEntity(Shift shift) {
        if (shift == null) {
            return null;
        }
        return ShiftResponse.builder()
                .id(shift.getId())
                .name(shift.getName())
                .startTime(shift.getStartTime().toString())
                .endTime(shift.getEndTime().toString())
                .status(shift.isStatus())
                .build();
    }
} 