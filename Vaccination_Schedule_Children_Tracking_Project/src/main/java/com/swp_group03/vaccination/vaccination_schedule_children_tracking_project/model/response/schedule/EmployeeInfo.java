package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeInfo {
    private String id;
    private String fullName;
    private String email;
    private List<String> roles;
} 