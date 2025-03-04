package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

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
        // Get the project directory
        String projectDir = System.getProperty("user.dir");
        if (projectDir.endsWith("SWP")) {
            projectDir = Paths.get(projectDir, "Vaccination_Schedule_Children_Tracking_Project").toString();
        }
        
        // Use the same directory as configured in WebConfig
        this.fileStorageLocation = Paths.get(projectDir, "vaccine-images").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
            System.out.println("Image storage location: " + this.fileStorageLocation);
        } catch (IOException ex) {
            System.err.println("Failed to create directory at: " + this.fileStorageLocation);
            ex.printStackTrace();
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
            
            if (originalFileName == null || !originalFileName.contains(".")) {
                throw new RuntimeException("Invalid file format");
            }
            
            String fileExtension = originalFileName.substring(originalFileName.lastIndexOf(".")).toLowerCase();
            if (!isValidImageExtension(fileExtension)) {
                throw new RuntimeException("Invalid image format. Supported formats: .jpg, .jpeg, .png, .gif, .webp");
            }
            
            String fileName = UUID.randomUUID().toString() + fileExtension;
            System.out.println("Generated filename: " + fileName);

            // Copy file to the target location
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            System.out.println("Saving file to: " + targetLocation.toString());
            
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            System.out.println("File saved successfully to: " + targetLocation.toString());

            return fileName;
        } catch (IOException ex) {
            System.err.println("Error storing file: " + ex.getMessage());
            ex.printStackTrace();
            throw new RuntimeException("Could not store file. Please try again!", ex);
        }
    }

    private boolean isValidImageExtension(String extension) {
        return extension.equals(".jpg") || 
               extension.equals(".jpeg") || 
               extension.equals(".png") || 
               extension.equals(".gif") || 
               extension.equals(".webp");
    }

    public Path getFilePath(String fileName) {
        try {
            Path path = this.fileStorageLocation.resolve(fileName).normalize();
            if (!path.startsWith(this.fileStorageLocation)) {
                throw new RuntimeException("Cannot access file outside of storage location");
            }
            System.out.println("Retrieving file from: " + path.toString());
            if (!Files.exists(path)) {
                throw new RuntimeException("File not found: " + fileName);
            }
            return path;
        } catch (Exception e) {
            System.err.println("Error accessing file: " + fileName + " - " + e.getMessage());
            throw new RuntimeException("Could not access file: " + fileName, e);
        }
    }

    public void deleteFile(String fileName) {
        try {
            if (fileName == null) {
                return;
            }
            Path targetLocation = this.fileStorageLocation.resolve(fileName).normalize();
            if (!targetLocation.startsWith(this.fileStorageLocation)) {
                throw new RuntimeException("Cannot delete file outside of storage location");
            }
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