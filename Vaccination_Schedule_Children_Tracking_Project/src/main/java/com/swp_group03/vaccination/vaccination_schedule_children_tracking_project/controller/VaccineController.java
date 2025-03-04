package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Vaccine;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VacineCategory;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.Vaccine.VaccineRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.VaccineDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.VaccineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vaccines")
@PreAuthorize("isAuthenticated()")
public class VaccineController {
    @Autowired
    private VaccineService vaccineService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VaccineDTO> addVaccine(
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("manufacturer") String manufacturer,
            @RequestParam(value = "dosage", required = false) String dosage,
            @RequestParam(value = "contraindications", required = false) String contraindications,
            @RequestParam(value = "precautions", required = false) String precautions,
            @RequestParam(value = "interactions", required = false) String interactions,
            @RequestParam(value = "adverseReactions", required = false) String adverseReactions,
            @RequestParam(value = "storageConditions", required = false) String storageConditions,
            @RequestParam(value = "recommended", required = false) String recommended,
            @RequestParam(value = "preVaccination", required = false) String preVaccination,
            @RequestParam(value = "compatibility", required = false) String compatibility,
            @RequestParam(value = "imagineUrl", required = false) MultipartFile imagineUrl,
            @RequestParam("quantity") Integer quantity,
            @RequestParam("expirationDate") String expirationDate,
            @RequestParam(value = "productionDate", required = false) String productionDate,
            @RequestParam(value = "status", defaultValue = "true") String status,
            @RequestParam(value = "categoryName", required = false) String categoryName,
            @RequestParam(value = "price", defaultValue = "0") String price
    ) {
        System.out.println("Received price: " + price);
        VaccineRequest request = new VaccineRequest();
        request.setName(name);
        request.setDescription(description);
        request.setManufacturer(manufacturer);
        request.setDosage(dosage);
        request.setContraindications(contraindications);
        request.setPrecautions(precautions);
        request.setInteractions(interactions);
        request.setAdverseReactions(adverseReactions);
        request.setStorageConditions(storageConditions);
        request.setRecommended(recommended);
        request.setPreVaccination(preVaccination);
        request.setCompatibility(compatibility);
        request.setQuantity(quantity);
        request.setExpirationDate(LocalDate.parse(expirationDate));
        if (productionDate != null) {
            request.setProductionDate(LocalDate.parse(productionDate));
        }
        request.setStatus(status);
        request.setPrice(new BigDecimal(price));

        Vaccine newVaccine = vaccineService.addVaccine(request, imagineUrl, categoryName);
        return ResponseEntity.ok(vaccineService.convertToDTO(newVaccine));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VaccineDTO> updateVaccine(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("manufacturer") String manufacturer,
            @RequestParam(value = "dosage", required = false) String dosage,
            @RequestParam(value = "contraindications", required = false) String contraindications,
            @RequestParam(value = "precautions", required = false) String precautions,
            @RequestParam(value = "interactions", required = false) String interactions,
            @RequestParam(value = "adverseReactions", required = false) String adverseReactions,
            @RequestParam(value = "storageConditions", required = false) String storageConditions,
            @RequestParam(value = "recommended", required = false) String recommended,
            @RequestParam(value = "preVaccination", required = false) String preVaccination,
            @RequestParam(value = "compatibility", required = false) String compatibility,
            @RequestParam(value = "imagineUrl", required = false) MultipartFile imagineUrl,
            @RequestParam("quantity") Integer quantity,
            @RequestParam("expirationDate") String expirationDate,
            @RequestParam(value = "productionDate", required = false) String productionDate,
            @RequestParam(value = "status", defaultValue = "true") String status,
            @RequestParam(value = "categoryName", required = false) String categoryName,
            @RequestParam(value = "price", defaultValue = "0") String price
    ) {
        System.out.println("Received price for update: " + price);
        VaccineRequest request = new VaccineRequest();
        request.setName(name);
        request.setDescription(description);
        request.setManufacturer(manufacturer);
        request.setDosage(dosage);
        request.setContraindications(contraindications);
        request.setPrecautions(precautions);
        request.setInteractions(interactions);
        request.setAdverseReactions(adverseReactions);
        request.setStorageConditions(storageConditions);
        request.setRecommended(recommended);
        request.setPreVaccination(preVaccination);
        request.setCompatibility(compatibility);
        request.setQuantity(quantity);
        request.setExpirationDate(LocalDate.parse(expirationDate));
        if (productionDate != null) {
            request.setProductionDate(LocalDate.parse(productionDate));
        }
        request.setStatus(status);
        request.setPrice(new BigDecimal(price));

        Vaccine updatedVaccine = vaccineService.updateVaccine(id, request, imagineUrl, categoryName);
        return ResponseEntity.ok(vaccineService.convertToDTO(updatedVaccine));
    }

    @GetMapping
    public ResponseEntity<?> getVaccines() {
        try {
            List<VaccineDTO> vaccines = vaccineService.getVaccines();
            return ResponseEntity.ok(vaccines);
        } catch (Exception e) {
            System.err.println("Error fetching vaccines: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(Map.of(
                    "message", "Error fetching vaccines",
                    "error", e.getMessage()
                ));
        }
    }

    @GetMapping("/categories")
    public ResponseEntity<List<VacineCategory>> getCategories() {
        return ResponseEntity.ok(vaccineService.getAllCategories());
    }

    @GetMapping("/images/{fileName}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<byte[]> getImage(@PathVariable String fileName) {
        System.out.println("Received request for image: " + fileName);
        try {
            byte[] imageData = vaccineService.getVaccineImage(fileName);
            if (imageData == null || imageData.length == 0) {
                System.err.println("No image data found for: " + fileName);
                return ResponseEntity.notFound().build();
            }
            
            MediaType mediaType;
            if (fileName.toLowerCase().endsWith(".webp")) {
                mediaType = MediaType.parseMediaType("image/webp");
            } else if (fileName.toLowerCase().endsWith(".png")) {
                mediaType = MediaType.IMAGE_PNG;
            } else if (fileName.toLowerCase().endsWith(".gif")) {
                mediaType = MediaType.IMAGE_GIF;
            } else {
                mediaType = MediaType.IMAGE_JPEG;
            }
            
            System.out.println("Serving image: " + fileName + " with media type: " + mediaType);
            return ResponseEntity.ok()
                .contentType(mediaType)
                .body(imageData);
        } catch (Exception e) {
            System.err.println("Error loading image: " + fileName);
            System.err.println("Error details: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Vaccine>> searchByName(@RequestParam String name) {
        return ResponseEntity.ok(vaccineService.searchByName(name));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVaccine(@PathVariable Long id) {
        vaccineService.deleteVaccine(id);
        return ResponseEntity.ok().build();
    }
}
