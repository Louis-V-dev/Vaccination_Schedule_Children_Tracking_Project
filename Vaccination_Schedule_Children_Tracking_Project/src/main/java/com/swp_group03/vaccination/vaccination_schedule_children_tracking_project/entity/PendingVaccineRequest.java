package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.appointment.AppointmentVaccineRequest;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pending_vaccine_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingVaccineRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "appointment_id", nullable = false)
    private Long appointmentId;

    @Column(name = "vaccine_type", nullable = false)
    private String type;

    @Column(name = "vaccine_id")
    private Long vaccineId;

    @Column(name = "vaccine_of_child_id")
    private Long vaccineOfChildId;

    @Column(name = "dose_schedule_id")
    private Long doseScheduleId;

    @Column(name = "combo_id")
    private Integer comboId;

    @Column(name = "dose_number")
    private Integer doseNumber;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Constructor to create from AppointmentVaccineRequest
    public PendingVaccineRequest(Long appointmentId, AppointmentVaccineRequest request) {
        this.appointmentId = appointmentId;
        this.type = request.getType();
        this.vaccineId = request.getVaccineId();
        this.vaccineOfChildId = request.getVaccineOfChildId();
        this.doseScheduleId = request.getDoseScheduleId();
        this.comboId = request.getComboId();
        this.doseNumber = request.getDoseNumber();
        this.createdAt = LocalDateTime.now();
    }

    // Convert back to AppointmentVaccineRequest
    public AppointmentVaccineRequest toVaccineRequest() {
        AppointmentVaccineRequest request = new AppointmentVaccineRequest();
        request.setType(this.type);
        request.setVaccineId(this.vaccineId);
        request.setVaccineOfChildId(this.vaccineOfChildId);
        request.setDoseScheduleId(this.doseScheduleId);
        request.setComboId(this.comboId);
        request.setDoseNumber(this.doseNumber);
        return request;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 