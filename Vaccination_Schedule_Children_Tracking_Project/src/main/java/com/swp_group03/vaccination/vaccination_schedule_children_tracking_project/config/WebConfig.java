package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;
import java.nio.file.Files;
import java.io.File;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Get the absolute path to the vaccine-images directory
        String projectDir = System.getProperty("user.dir");
        if (projectDir.endsWith("SWP")) {
            projectDir = Paths.get(projectDir, "Vaccination_Schedule_Children_Tracking_Project").toString();
        }
        
        // Create an external directory for storing images
        Path uploadDir = Paths.get(projectDir, "vaccine-images");
        String uploadPath = uploadDir.toFile().getAbsolutePath();
        
        // Ensure directory exists
        File directory = new File(uploadPath);
        if (!directory.exists()) {
            System.out.println("Creating directory at: " + uploadPath);
            if (directory.mkdirs()) {
                System.out.println("Directory created successfully");
            } else {
                System.err.println("Failed to create directory at: " + uploadPath);
            }
        } else {
            System.out.println("Directory already exists at: " + uploadPath);
        }
        
        // Log the configured path
        System.out.println("Configuring resource handler for images at: " + uploadPath);
        
        // Configure the resource handler with proper path separator
        String pathPattern = "file:" + uploadPath + File.separator;
        System.out.println("Resource location pattern: " + pathPattern);
        
        // Configure the resource handler without CORS headers (they're handled by addCorsMappings)
        registry.addResourceHandler("/api/vaccines/images/**")
               .addResourceLocations(pathPattern)
               .setCachePeriod(3600);
    }
} 