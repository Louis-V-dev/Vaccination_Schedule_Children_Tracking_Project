package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender emailSender;

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