package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

public enum VaccinationStatus {
    PENDING,            // Initial state
    APPROVED,           // Approved by doctor
    REJECTED,           // Rejected by doctor
    VACCINATED,         // Vaccine administered
    COMPLETED,          // Successfully administered (legacy status)
    CANCELLED,          // Cancelled during process
    FAILED              // Failed to complete
} 