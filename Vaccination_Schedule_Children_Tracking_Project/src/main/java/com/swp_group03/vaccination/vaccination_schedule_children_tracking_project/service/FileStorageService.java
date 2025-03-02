package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService() {
        // Create the directory inside the backend project
        String projectDir = System.getProperty("user.dir");
        // Navigate to the backend project directory if we're in the parent directory
        if (projectDir.endsWith("SWP")) {
            projectDir = Paths.get(projectDir, "Vaccination_Schedule_Children_Tracking_Project").toString();
        }
        this.fileStorageLocation = Paths.get(projectDir, "src", "main", "resources", "VaccineImg").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
            System.out.println("Image storage location: " + this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                System.out.println("No file received or empty file");
                return null;
            }

            // Generate unique filename
            String originalFileName = file.getOriginalFilename();
            System.out.println("Original filename: " + originalFileName);
            
            String fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            String fileName = UUID.randomUUID().toString() + fileExtension;
            System.out.println("Generated filename: " + fileName);

            // Copy file to the target location
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            System.out.println("Saving file to: " + targetLocation.toString());
            
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            System.out.println("File saved successfully");

            return fileName;
        } catch (IOException ex) {
            System.err.println("Error storing file: " + ex.getMessage());
            ex.printStackTrace();
            throw new RuntimeException("Could not store file. Please try again!", ex);
        }
    }

    public Path getFilePath(String fileName) {
        Path path = this.fileStorageLocation.resolve(fileName).normalize();
        System.out.println("Retrieving file from: " + path.toString());
        return path;
    }

    public void deleteFile(String fileName) {
        try {
            if (fileName == null) {
                return;
            }
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            System.out.println("Attempting to delete file: " + targetLocation.toString());
            if (Files.deleteIfExists(targetLocation)) {
                System.out.println("File deleted successfully");
            } else {
                System.out.println("File did not exist");
            }
        } catch (IOException ex) {
            System.err.println("Error deleting file: " + ex.getMessage());
            ex.printStackTrace();
            throw new RuntimeException("Could not delete file. Please try again!", ex);
        }
    }
} 