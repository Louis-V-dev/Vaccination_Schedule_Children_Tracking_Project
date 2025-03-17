package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity;

public enum VaccinationStatus {
    PENDING,            // Initial state
    COMPLETED,          // Successfully administered
    CANCELLED,          // Cancelled during process
    FAILED              // Failed to complete
} 