package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response;

import lombok.Data;

import java.util.List;

@Data
public class ComboCategoryResponse {
    private Integer id;
    private String comboCategoryName;
    private String description;
    private Boolean status;
    private List<ComboInfo> combos;
    
    @Data
    public static class ComboInfo {
        private Integer comboId;
        private String comboName;
    }
} 