package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponseDTO {
    private Long id;
    private String childId;
    private String childName;
    private String doctorId;
    private String doctorName;
    private LocalDateTime appointmentTime;
    private String timeSlot;
    private AppointmentStatus status;
    private String notes;
    private boolean isPaid;
    private Double totalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Appointment type (NEW_VACCINE, NEXT_DOSE, VACCINE_COMBO, etc.)
    private String appointmentType;
    
    // Payment details
    private Long paymentId;
    private String paymentStatus;
    private String paymentMethod;
    private String transactionId;
    private LocalDateTime paymentDate;
    
    // Vaccines
    private List<Map<String, Object>> appointmentVaccines;
} 