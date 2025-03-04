package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response;

import lombok.Data;
import java.util.List;

@Data
public class VaccineComboResponse {
    private Integer comboId;
    private String comboName;
    private String description;
    private Double price;
    private Double originalPrice;
    private Double saleOff;
    private Boolean status;
    private List<VaccineDetailResponse> vaccineDetails;
    
    @Data
    public static class VaccineDetailResponse {
        private Integer vaccineId;
        private String vaccineName;
        private Integer dose;
        private String ageGroup;
        private Double saleOff;
    }
} 