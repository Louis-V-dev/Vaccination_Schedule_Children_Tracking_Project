package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

public enum AppointmentStatus {
    PENDING,            // Initial state when appointment is created
    CONFIRMED,          // Appointment is confirmed
    CHECKED_IN,         // Patient has arrived and checked in
    WITH_DOCTOR,        // Patient is being examined by doctor
    APPROVED,           // Doctor has approved vaccination
    REJECTED,           // Doctor has rejected vaccination
    AWAITING_PAYMENT,   // Waiting for payment (if not pre-paid)
    PAID,               // Payment completed
    WITH_NURSE,         // Patient is with nurse for vaccination
    VACCINATED,         // Vaccination completed
    IN_OBSERVATION,     // Post-vaccination observation
    COMPLETED,          // All steps completed
    CANCELLED,          // Appointment was cancelled
    NO_SHOW,            // Patient didn't show up
    OFFLINE_PAYMENT,    // Payment completed offline
    ABSENT,             // Patient is absent
    FAILED             // Appointment failed
} 