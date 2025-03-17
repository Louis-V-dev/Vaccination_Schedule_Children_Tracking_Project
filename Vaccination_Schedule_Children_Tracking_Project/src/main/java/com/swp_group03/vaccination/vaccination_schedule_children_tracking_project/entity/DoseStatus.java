package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

public enum DoseStatus {
    UNSCHEDULED,     // Initial state
    SCHEDULED,       // Has a future appointment
    COMPLETED,       // Dose has been administered
    MISSED,          // Appointment was missed
    CANCELLED,       // Appointment was cancelled
    RESCHEDULED,     // Appointment was rescheduled
    DELAYED          // Delayed due to medical reasons
} 