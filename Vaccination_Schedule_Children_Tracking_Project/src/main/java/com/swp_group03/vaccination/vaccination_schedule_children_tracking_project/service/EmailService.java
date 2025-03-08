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
    private JavaMailSender mailSender;

    public void sendVerificationCode(String to, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom("kidvaccine7@gmail.com");
            helper.setTo(to);
            helper.setSubject("Email Verification - Kid Vaccine Management System");
            
            String htmlContent = String.format("""
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
            
            helper.setText(htmlContent, true);
            mailSender.send(message);
            
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send verification email", e);
        }
    }
}