package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response;

import lombok.Data;
import java.util.List;

@Data
public class VaccineComboResponse {
    private Integer comboId;
    private String comboName;
    private String description;
    private Double price;
    private Double saleOff;
    private Integer minAge;
    private Integer maxAge;
    private Boolean status;
    private List<CategoryInfo> categories;
    private List<VaccineInfo> vaccines;
    
    @Data
    public static class VaccineInfo {
        private Long vaccineId;
        private String vaccineName;
        private Double price;
    }
    
    @Data
    public static class CategoryInfo {
        private Integer categoryId;
        private String categoryName;
    }
} 