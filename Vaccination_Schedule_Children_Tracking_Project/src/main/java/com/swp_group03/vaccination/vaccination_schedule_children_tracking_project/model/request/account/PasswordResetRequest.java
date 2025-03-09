package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.account;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PasswordResetRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a valid email address")
    private String email;

    @NotBlank(message = "Reset code is required")
    private String resetCode;

    @NotBlank(message = "New password is required")
    @Size(min = 3, max = 16, message = "Password must be between 3 and 16 characters")
    private String newPassword;
} 