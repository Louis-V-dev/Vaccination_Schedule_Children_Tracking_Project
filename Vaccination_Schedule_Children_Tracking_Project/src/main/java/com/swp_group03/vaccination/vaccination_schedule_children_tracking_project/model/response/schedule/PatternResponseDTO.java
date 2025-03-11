package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

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
    private List<WeekDTO> weeks;
} 