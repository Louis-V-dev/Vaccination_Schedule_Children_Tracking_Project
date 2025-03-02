package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Vaccine;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VacineCategory;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.Vaccine.VaccineRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.VaccineDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.VaccineRepo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.VacineCategoryRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VaccineService {

    @Autowired
    private VaccineRepo vaccineRepo;

    @Autowired
    private VacineCategoryRepo vacineCategoryRepo;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private VacineCategoryService vacineCategoryService;

    public Vaccine addVaccine(VaccineRequest request, MultipartFile imageFile, String categoryName) {
        System.out.println("Adding vaccine with category name: " + categoryName);
        System.out.println("Image file received: " + (imageFile != null ? imageFile.getOriginalFilename() : "null"));
        
        Vaccine vaccine = new Vaccine();
        vaccine.setName(request.getName());
        vaccine.setDescription(request.getDescription());
        vaccine.setManufacturer(request.getManufacturer());
        vaccine.setDosage(request.getDosage());
        vaccine.setContraindications(request.getContraindications());
        vaccine.setPrecautions(request.getPrecautions());
        vaccine.setInteractions(request.getInteractions());
        vaccine.setAdverseReactions(request.getAdverseReactions());
        vaccine.setStorageConditions(request.getStorageConditions());
        vaccine.setRecommended(request.getRecommended());
        vaccine.setPreVaccination(request.getPreVaccination());
        vaccine.setCompatibility(request.getCompatibility());
        vaccine.setQuantity(request.getQuantity());
        vaccine.setExpirationDate(request.getExpirationDate());
        vaccine.setProductionDate(request.getProductionDate());
        vaccine.setStatus("true");

        // Handle category using VacineCategoryService
        if (categoryName != null && !categoryName.trim().isEmpty()) {
            System.out.println("Creating/getting category: " + categoryName);
            VacineCategory category = vacineCategoryService.getOrCreateCategory(categoryName);
            System.out.println("Category created/retrieved: " + category.getCategoryName() + " (ID: " + category.getCategoryId() + ")");
            vaccine.setCategoryID(category);
        } else {
            System.out.println("No category name provided");
        }

        // Handle image file
        if (imageFile != null && !imageFile.isEmpty()) {
            System.out.println("Processing image file: " + imageFile.getOriginalFilename());
            String fileName = fileStorageService.storeFile(imageFile);
            System.out.println("Image file stored with name: " + fileName);
            vaccine.setImagineUrl(fileName);
        } else {
            System.out.println("No image file provided or empty file");
        }

        Vaccine savedVaccine = vaccineRepo.save(vaccine);
        System.out.println("Saved vaccine with ID: " + savedVaccine.getId() + 
            ", Category: " + (savedVaccine.getCategoryID() != null ? savedVaccine.getCategoryID().getCategoryName() : "none") +
            ", Image: " + savedVaccine.getImagineUrl());
        return savedVaccine;
    }

    @Transactional(readOnly = true)
    public List<VaccineDTO> getVaccines() {
        try {
            List<Vaccine> vaccines = vaccineRepo.findAll();
            return vaccines.stream().map(this::convertToDTO).collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error in VaccineService.getVaccines: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch vaccines: " + e.getMessage(), e);
        }
    }

    public VaccineDTO convertToDTO(Vaccine vaccine) {
        VaccineDTO dto = new VaccineDTO();
        dto.setId(vaccine.getId());
        dto.setName(vaccine.getName());
        dto.setDescription(vaccine.getDescription());
        dto.setManufacturer(vaccine.getManufacturer());
        if (vaccine.getCategoryID() != null) {
            System.out.println("Converting category for vaccine " + vaccine.getName() + ": " + vaccine.getCategoryID().getCategoryName());
            dto.setCategoryId(vaccine.getCategoryID().getCategoryId());
            dto.setCategoryName(vaccine.getCategoryID().getCategoryName());
        } else {
            System.out.println("No category found for vaccine " + vaccine.getName());
        }
        dto.setDosage(vaccine.getDosage());
        dto.setContraindications(vaccine.getContraindications());
        dto.setPrecautions(vaccine.getPrecautions());
        dto.setInteractions(vaccine.getInteractions());
        dto.setAdverseReactions(vaccine.getAdverseReactions());
        dto.setStorageConditions(vaccine.getStorageConditions());
        dto.setRecommended(vaccine.getRecommended());
        dto.setPreVaccination(vaccine.getPreVaccination());
        dto.setCompatibility(vaccine.getCompatibility());
        dto.setImagineUrl(vaccine.getImagineUrl());
        dto.setQuantity(vaccine.getQuantity());
        dto.setExpirationDate(vaccine.getExpirationDate());
        dto.setPrice(vaccine.getPrice());
        dto.setStatus(vaccine.getStatus());
        dto.setProductionDate(vaccine.getProductionDate());
        return dto;
    }

    public List<Vaccine> searchByName(String vaccineName) {
        return vaccineRepo.findByNameContainingIgnoreCase(vaccineName);
    }

    public void deleteVaccine(Long id) {
        Vaccine vaccine = vaccineRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Vaccine not found with id: " + id));
        
        // Delete the associated image file if it exists
        if (vaccine.getImagineUrl() != null) {
            fileStorageService.deleteFile(vaccine.getImagineUrl());
        }
        
        vaccineRepo.deleteById(id);
    }

    public Vaccine updateVaccine(Long id, VaccineRequest request, MultipartFile imageFile, String categoryName) {
        Vaccine vaccine = vaccineRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Vaccine not found with id: " + id));
        
        vaccine.setName(request.getName());
        vaccine.setDescription(request.getDescription());
        vaccine.setManufacturer(request.getManufacturer());
        vaccine.setDosage(request.getDosage());
        vaccine.setContraindications(request.getContraindications());
        vaccine.setPrecautions(request.getPrecautions());
        vaccine.setInteractions(request.getInteractions());
        vaccine.setAdverseReactions(request.getAdverseReactions());
        vaccine.setStorageConditions(request.getStorageConditions());
        vaccine.setRecommended(request.getRecommended());
        vaccine.setPreVaccination(request.getPreVaccination());
        vaccine.setCompatibility(request.getCompatibility());
        vaccine.setQuantity(request.getQuantity());
        vaccine.setExpirationDate(request.getExpirationDate());
        vaccine.setProductionDate(request.getProductionDate());
        vaccine.setStatus("true");

        // Handle category using VacineCategoryService
        if (categoryName != null && !categoryName.trim().isEmpty()) {
            VacineCategory category = vacineCategoryService.getOrCreateCategory(categoryName);
            vaccine.setCategoryID(category);
        }

        // Handle image file
        if (imageFile != null && !imageFile.isEmpty()) {
            // Delete old image if it exists
            if (vaccine.getImagineUrl() != null) {
                fileStorageService.deleteFile(vaccine.getImagineUrl());
            }
            // Store new image
            String fileName = fileStorageService.storeFile(imageFile);
            vaccine.setImagineUrl(fileName);
        }
        
        return vaccineRepo.save(vaccine);
    }

    public byte[] getVaccineImage(String fileName) throws IOException {
        Path imagePath = fileStorageService.getFilePath(fileName);
        return Files.readAllBytes(imagePath);
    }

    public List<VacineCategory> getAllCategories() {
        return vacineCategoryRepo.findAll();
    }
}
