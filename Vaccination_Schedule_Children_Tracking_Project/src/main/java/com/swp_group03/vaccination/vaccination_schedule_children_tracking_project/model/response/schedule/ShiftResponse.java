package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule;

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
} 