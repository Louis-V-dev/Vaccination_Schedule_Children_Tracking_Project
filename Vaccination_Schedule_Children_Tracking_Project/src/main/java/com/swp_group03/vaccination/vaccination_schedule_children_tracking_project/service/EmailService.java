package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.ShiftChangeRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.WorkSchedule;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender emailSender;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMMM d, yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");

    public void sendVerificationCode(String to, String code) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setTo(to);
            helper.setSubject("Email Verification");
            helper.setText(createVerificationEmailContent(code), true);
            
            emailSender.send(message);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }
    
    public void sendPasswordResetCode(String to, String code) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setTo(to);
            helper.setSubject("Password Reset Code");
            helper.setText(createPasswordResetEmailContent(code), true);
            
            emailSender.send(message);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }

    public void sendShiftChangeRequest(ShiftChangeRequest request) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setTo(request.getTarget().getEmail());
            helper.setSubject("New Shift Change Request");
            helper.setText(createShiftChangeRequestEmailContent(request), true);
            
            emailSender.send(message);
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }

    public void sendShiftChangeRequestUpdate(ShiftChangeRequest request, String status) {
        try {
            // Notify requester
            MimeMessage requesterMessage = emailSender.createMimeMessage();
            MimeMessageHelper requesterHelper = new MimeMessageHelper(requesterMessage, true);
            
            requesterHelper.setTo(request.getRequester().getEmail());
            requesterHelper.setSubject("Shift Change Request Update");
            requesterHelper.setText(createShiftChangeUpdateEmailContent(request, status, true), true);
            
            emailSender.send(requesterMessage);

            // If target approved, notify admin
            if ("APPROVED".equals(request.getTargetStatus()) && "PENDING".equals(request.getAdminStatus())) {
                MimeMessage adminMessage = emailSender.createMimeMessage();
                MimeMessageHelper adminHelper = new MimeMessageHelper(adminMessage, true);
                
                // You might want to get admin email from a configuration or service
                adminHelper.setTo("admin@example.com");
                adminHelper.setSubject("Shift Change Request Needs Approval");
                adminHelper.setText(createAdminNotificationEmailContent(request), true);
                
                emailSender.send(adminMessage);
            }
        } catch (MessagingException e) {
            e.printStackTrace();
        }
    }
    
    private String createShiftChangeRequestEmailContent(ShiftChangeRequest request) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .details { background-color: #f9f9f9; padding: 15px; margin: 10px 0; }
                    .button { background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>New Shift Change Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello %s,</p>
                        <p>%s has requested to exchange shifts with you.</p>
                        
                        <div class="details">
                            <h3>Request Details:</h3>
                            <p><strong>Original Shift:</strong> %s on %s</p>
                            <p><strong>Requested Shift:</strong> %s on %s</p>
                            <p><strong>Reason:</strong> %s</p>
                        </div>
                        
                        <p>Please log in to the system to approve or reject this request.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            request.getTarget().getFirstName(),
            request.getRequester().getFirstName() + " " + request.getRequester().getLastName(),
            formatShiftTime(request.getOriginalSchedule()),
            request.getOriginalSchedule().getWorkDate().format(DATE_FORMATTER),
            formatShiftTime(request.getTargetSchedule()),
            request.getTargetSchedule().getWorkDate().format(DATE_FORMATTER),
            request.getReason()
        );
    }

    private String createShiftChangeUpdateEmailContent(ShiftChangeRequest request, String status, boolean isRequester) {
        String recipient = isRequester ? request.getRequester().getFirstName() : request.getTarget().getFirstName();
        String statusMessage = getStatusMessage(status, isRequester);
        
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .status { font-size: 18px; font-weight: bold; margin: 20px 0; }
                    .approved { color: #4CAF50; }
                    .rejected { color: #f44336; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Shift Change Request Update</h1>
                    </div>
                    <div class="content">
                        <p>Hello %s,</p>
                        %s
                    </div>
                </div>
            </body>
            </html>
            """,
            recipient,
            statusMessage
        );
    }

    private String createAdminNotificationEmailContent(ShiftChangeRequest request) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; }
                    .details { background-color: #f9f9f9; padding: 15px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Shift Change Request Needs Approval</h1>
                    </div>
                    <div class="content">
                        <p>A shift change request requires your approval:</p>
                        
                        <div class="details">
                            <p><strong>Requester:</strong> %s</p>
                            <p><strong>Target:</strong> %s</p>
                            <p><strong>Original Shift:</strong> %s on %s</p>
                            <p><strong>Target Shift:</strong> %s on %s</p>
                            <p><strong>Reason:</strong> %s</p>
                        </div>
                        
                        <p>Please log in to the system to review and process this request.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            request.getRequester().getFirstName() + " " + request.getRequester().getLastName(),
            request.getTarget().getFirstName() + " " + request.getTarget().getLastName(),
            formatShiftTime(request.getOriginalSchedule()),
            request.getOriginalSchedule().getWorkDate().format(DATE_FORMATTER),
            formatShiftTime(request.getTargetSchedule()),
            request.getTargetSchedule().getWorkDate().format(DATE_FORMATTER),
            request.getReason()
        );
    }

    private String formatShiftTime(WorkSchedule schedule) {
        return String.format("%s - %s",
            schedule.getShift().getStartTime().format(TIME_FORMATTER),
            schedule.getShift().getEndTime().format(TIME_FORMATTER)
        );
    }

    private String getStatusMessage(String status, boolean isRequester) {
        if (isRequester) {
            switch (status) {
                case "APPROVED":
                    return "<p class='status approved'>Your shift change request has been approved!</p>";
                case "REJECTED":
                    return "<p class='status rejected'>Your shift change request has been rejected.</p>";
                default:
                    return "<p class='status'>Your shift change request status has been updated.</p>";
            }
        } else {
            return "<p>The shift change request has been processed.</p>";
        }
    }
    
    private String createVerificationEmailContent(String code) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333333;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f9f9f9;
                        border-radius: 5px;
                    }
                    .header {
                        text-align: center;
                        padding: 20px 0;
                        background-color: #4CAF50;
                        color: white;
                        border-radius: 5px 5px 0 0;
                    }
                    .content {
                        padding: 20px;
                        background-color: white;
                        border-radius: 0 0 5px 5px;
                    }
                    .verification-code {
                        font-size: 32px;
                        font-weight: bold;
                        text-align: center;
                        color: #4CAF50;
                        padding: 20px;
                        margin: 20px 0;
                        background-color: #f5f5f5;
                        border-radius: 5px;
                        letter-spacing: 5px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 12px;
                        color: #666666;
                    }
                    .warning {
                        color: #ff4444;
                        font-size: 14px;
                        margin-top: 15px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Email Verification</h1>
                    </div>
                    <div class="content">
                        <p>Dear User,</p>
                        <p>Thank you for registering with the Kid Vaccine Management System. To complete your registration, please use the following verification code:</p>
                        
                        <div class="verification-code">%s</div>
                        
                        <p>This verification code will expire in 5 minutes for security purposes.</p>
                        
                        <p class="warning">If you did not request this verification code, please ignore this email.</p>
                        
                        <p>Best regards,<br>Kid Vaccine Management Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message, please do not reply to this email.</p>
                        <p>&copy; 2024 Kid Vaccine Management System. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        """, code);
    }
    
    private String createPasswordResetEmailContent(String code) {
        return "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;'>"
                + "<div style='background-color: #4CAF50; padding: 10px; text-align: center; color: white; font-size: 24px; border-radius: 5px 5px 0 0;'>"
                + "Password Reset Request"
                + "</div>"
                + "<div style='padding: 20px; background-color: #f9f9f9;'>"
                + "<p style='font-size: 16px; color: #333;'>You have requested to reset your password. Please use the following verification code:</p>"
                + "<div style='background-color: #fff; padding: 15px; border-radius: 5px; border: 1px solid #e0e0e0; margin: 20px 0; text-align: center;'>"
                + "<span style='font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #333;'>" + code + "</span>"
                + "</div>"
                + "<p style='font-size: 16px; color: #333;'>This code will expire in 1 hour.</p>"
                + "<p style='font-size: 16px; color: #333;'>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>"
                + "</div>"
                + "<div style='background-color: #f2f2f2; padding: 15px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 5px 5px;'>"
                + "© " + java.time.Year.now().getValue() + " Vaccination Scheduling System. All rights reserved."
                + "</div>"
                + "</div>";
    }
}