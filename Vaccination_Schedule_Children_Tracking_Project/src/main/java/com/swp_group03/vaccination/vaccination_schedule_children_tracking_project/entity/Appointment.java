package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "child_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Child child;

    @ManyToOne
    @JoinColumn(name = "work_schedule_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "appointments", "employee", "shift", "sourcePattern"})
    private WorkSchedule workSchedule;

    @ManyToOne
    @JoinColumn(name = "doctor_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "appointments", "workSchedules", "roles"})
    private Account doctor;

    @ManyToOne
    @JoinColumn(name = "nurse_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "appointments", "workSchedules", "roles"})
    private Account nurse;

    @Column(nullable = false)
    private LocalDateTime appointmentTime;

    @Column(nullable = false)
    private String timeSlot;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;

    private String notes;

    @Column(nullable = false)
    private boolean isPaid;

    @Column(nullable = false)
    private Double totalAmount;

    @ManyToOne
    @JoinColumn(name = "payment_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "appointments", "user", "paymentMethod", "recordedBy", "history"})
    private Payment payment;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder.Default
    @OneToMany(mappedBy = "appointment", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<AppointmentVaccine> appointmentVaccines = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = AppointmentStatus.PENDING;
        if (totalAmount == null) totalAmount = 0.0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    // Custom methods for isPaid field
    public void setPaid(boolean paid) {
        this.isPaid = paid;
    }
    
    public boolean isPaid() {
        return this.isPaid;
    }
    
    /**
     * Gets all payments associated with this appointment.
     * For now, this just returns a list with the current payment if it exists.
     * In the future, this could be expanded to handle multiple payments per appointment.
     * 
     * @return List of payments associated with this appointment
     */
    public List<Payment> getPayments() {
        List<Payment> payments = new ArrayList<>();
        if (this.payment != null) {
            payments.add(this.payment);
        }
        return payments;
    }
} 