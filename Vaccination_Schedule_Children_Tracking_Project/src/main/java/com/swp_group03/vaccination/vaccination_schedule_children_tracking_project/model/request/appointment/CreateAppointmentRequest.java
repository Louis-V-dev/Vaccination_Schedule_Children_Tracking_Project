package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.appointment;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreateAppointmentRequest {
    private String childId;
    private Boolean isDayPriority; // true for day priority, false for doctor priority
    private LocalDate appointmentDate;
    private String timeSlot;
    private String doctorId;
    private List<AppointmentVaccineRequest> vaccines;
    private String paymentMethod; // "ONLINE" or "OFFLINE"
    private String notes;
    private Boolean isPaid; // true if all vaccines are already paid
} 