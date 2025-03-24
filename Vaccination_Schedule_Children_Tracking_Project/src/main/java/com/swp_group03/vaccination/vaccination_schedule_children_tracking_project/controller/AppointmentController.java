package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.appointment.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.AppointmentResponseDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.VaccineDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.VaccineDataResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.VaccineOfChildDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.DoseScheduleDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AppointmentController {
    private final AppointmentService appointmentService;
    private final VaccineOfChildRepository vaccineOfChildRepository;
    private final DoseScheduleRepository doseScheduleRepository;
    private final VaccineRepository vaccineRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final ChildRepo childRepo;
    private final PaymentRepository paymentRepository;
    private final PaymentMethodRepository paymentMethodRepository;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createAppointment(@RequestBody CreateAppointmentRequest request) {
        try {
            // Create the appointment using the service
            Appointment appointment = appointmentService.createAppointment(request);
            
            // Convert the appointment entity to DTO to avoid serialization issues
            AppointmentResponseDTO responseDTO = AppointmentResponseDTO.builder()
                .id(appointment.getId())
                .childId(appointment.getChild().getChild_id())
                .childName(appointment.getChild().getChild_name())
                .doctorId(appointment.getDoctor() != null ? appointment.getDoctor().getAccountId() : null)
                .doctorName(appointment.getDoctor() != null ? appointment.getDoctor().getFirstName() + " " + appointment.getDoctor().getLastName() : "Not assigned")
                .appointmentTime(appointment.getAppointmentTime())
                .timeSlot(appointment.getTimeSlot())
                .status(appointment.getStatus())
                .notes(appointment.getNotes())
                .isPaid(appointment.isPaid())
                .totalAmount(appointment.getTotalAmount())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .build();
            
            return ResponseEntity.ok(responseDTO);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "code", 9999,
                "message", "Uncategorized exception: " + e.getMessage(),
                "result", null
            ));
        }
    }

    @GetMapping("/child/{childId}/vaccines")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VaccineDataResponse> getAvailableVaccines(@PathVariable(name = "childId") String childId) {
        Child child = childRepo.findById(childId)
            .orElseThrow(() -> new AppException(ErrorCode.CHILD_NOT_FOUND));

        // Get all available vaccines
        List<VaccineDTO> availableVaccines = vaccineRepository.findAll().stream()
            .map(vaccine -> VaccineDTO.builder()
                .id(vaccine.getId())
                .name(vaccine.getName())
                .description(vaccine.getDescription())
                .manufacturer(vaccine.getManufacturer())
                .dosage(vaccine.getDosage())
                .price(vaccine.getPrice())
                .build())
            .collect(Collectors.toList());

        // Get child's existing vaccines
        List<VaccineOfChildDTO> existingVaccines = vaccineOfChildRepository.findByChildAndIsCompletedFalse(child).stream()
            .map(voc -> VaccineOfChildDTO.builder()
                .id(voc.getId())
                .vaccine(VaccineDTO.builder()
                    .id(voc.getVaccine().getId())
                    .name(voc.getVaccine().getName())
                    .description(voc.getVaccine().getDescription())
                    .manufacturer(voc.getVaccine().getManufacturer())
                    .dosage(voc.getVaccine().getDosage())
                    .price(voc.getVaccine().getPrice())
                    .build())
                .totalDoses(voc.getTotalDoses())
                .currentDose(voc.getCurrentDose())
                .isCompleted(voc.getIsCompleted())
                .isFromCombo(voc.getIsFromCombo())
                .build())
            .collect(Collectors.toList());

        // Get upcoming doses - MODIFIED to filter only immediate next doses
        List<DoseScheduleDTO> allUpcomingDoses = doseScheduleRepository.findUpcomingDosesByChildId(childId).stream()
            .map(ds -> {
                // Get the vaccine for proper information
                Vaccine vaccine = ds.getVaccineOfChild().getVaccine();
                VaccineOfChild voc = ds.getVaccineOfChild();
                
                // Enhanced logging to debug vaccine data
                System.out.println("Processing dose schedule " + ds.getId() + 
                                  " for vaccine " + vaccine.getName() + 
                                  " (price: " + vaccine.getPrice() + ")");
                
                return DoseScheduleDTO.builder()
                    .id(ds.getId())
                    .doseNumber(ds.getDoseNumber())
                    .status(ds.getStatus().toString())
                    .scheduledDate(ds.getScheduledDate() != null ? ds.getScheduledDate().toString() : null)
                    .isPaid(ds.getIsPaid())
                    
                    // Direct vaccine info fields - for easier frontend access
                    .vaccineName(vaccine.getName())
                    .price(vaccine.getPrice())
                    .vaccineId(vaccine.getId())
                    .vaccineDescription(vaccine.getDescription())
                    .vaccineManufacturer(vaccine.getManufacturer())
                    .totalDoses(voc.getTotalDoses())
                    .isFromCombo(voc.getIsFromCombo())
                    
                    // Also include the full vaccineOfChild object for reference if needed
                    .vaccineOfChild(VaccineOfChildDTO.builder()
                        .id(voc.getId())
                        .totalDoses(voc.getTotalDoses())
                        .currentDose(voc.getCurrentDose())
                        .isCompleted(voc.getIsCompleted())
                        .isFromCombo(voc.getIsFromCombo())
                        .vaccine(VaccineDTO.builder()
                            .id(vaccine.getId())
                            .name(vaccine.getName())
                            .description(vaccine.getDescription())
                            .manufacturer(vaccine.getManufacturer())
                            .dosage(vaccine.getDosage())
                            .price(vaccine.getPrice())
                            .build())
                        .build())
                    .build();
            })
            .collect(Collectors.toList());
        
        // Filter to keep only the immediate next dose for each vaccine
        Map<Long, DoseScheduleDTO> immediateNextDoses = new HashMap<>();
        for (DoseScheduleDTO dose : allUpcomingDoses) {
            Long vaccineOfChildId = dose.getVaccineOfChild().getId();
            int currentDose = dose.getVaccineOfChild().getCurrentDose();
            
            // Check if this is the immediate next dose (current + 1)
            if (dose.getDoseNumber() == currentDose + 1) {
                immediateNextDoses.put(vaccineOfChildId, dose);
            }
        }
        
        // Convert map values to list
        List<DoseScheduleDTO> upcomingDoses = new ArrayList<>(immediateNextDoses.values());

        return ResponseEntity.ok(VaccineDataResponse.builder()
            .availableVaccines(availableVaccines)
            .existingVaccines(existingVaccines)
            .upcomingDoses(upcomingDoses)
            .build());
    }

    @PostMapping("/{appointmentId}/mark-paid")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> markAppointmentAsPaid(@PathVariable Long appointmentId) {
        try {
            // Find the appointment
            Appointment appointment = appointmentService.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            System.out.println("Marking appointment as paid: " + appointmentId);
            System.out.println("Current appointment status: " + appointment.getStatus());
            System.out.println("Current appointment isPaid: " + appointment.isPaid());
            
            // Log appointment vaccines
            if (appointment.getAppointmentVaccines() != null) {
                System.out.println("Appointment has " + appointment.getAppointmentVaccines().size() + " vaccines");
                for (AppointmentVaccine av : appointment.getAppointmentVaccines()) {
                    System.out.println("Vaccine: " + (av.getVaccine() != null ? av.getVaccine().getName() : "null") + 
                                      ", VaccineOfChild: " + (av.getVaccineOfChild() != null ? av.getVaccineOfChild().getId() : "null") + 
                                      ", DoseSchedule: " + (av.getDoseSchedule() != null ? av.getDoseSchedule().getId() : "null"));
                    
                    // Process NEXT_DOSE appointment vaccines directly
                    if (av.getDoseSchedule() != null) {
                        DoseSchedule doseSchedule = av.getDoseSchedule();
                        System.out.println("Found dose schedule to update: " + doseSchedule.getId());
                        System.out.println("Current isPaid: " + doseSchedule.isPaid());
                        
                        // Mark as paid directly
                        doseSchedule.setIsPaid(true);
                        doseSchedule.setStatus(String.valueOf(DoseStatus.SCHEDULED));
                        doseSchedule.setScheduledDate(appointment.getAppointmentTime().toLocalDate());
                        doseScheduleRepository.save(doseSchedule);
                        
                        System.out.println("Updated dose schedule. New isPaid: " + doseSchedule.isPaid() + 
                                         ", New status: " + doseSchedule.getStatus());
                    }
                }
            }
            
            // Set the appointment as paid
            appointment.setPaid(true);
            appointment.setStatus(AppointmentStatus.PAID);
            
            // Save the updated appointment
            appointmentService.saveAppointment(appointment);
            
            // Process vaccines after payment
            appointmentService.processVaccinesAfterPayment(appointmentId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Appointment marked as paid successfully"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to mark appointment as paid: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id) {
        try {
            System.out.println("Fetching appointment with ID: " + id);
            Appointment appointment = appointmentService.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            // Convert to DTO to avoid serialization issues
            AppointmentResponseDTO responseDTO = AppointmentResponseDTO.builder()
                .id(appointment.getId())
                .childId(appointment.getChild().getChild_id())
                .childName(appointment.getChild().getChild_name())
                .doctorId(appointment.getDoctor() != null ? appointment.getDoctor().getAccountId() : null)
                .doctorName(appointment.getDoctor() != null ? appointment.getDoctor().getFirstName() + " " + appointment.getDoctor().getLastName() : "Not assigned")
                .appointmentTime(appointment.getAppointmentTime())
                .timeSlot(appointment.getTimeSlot())
                .status(appointment.getStatus())
                .notes(appointment.getNotes())
                .isPaid(appointment.isPaid())
                .totalAmount(appointment.getTotalAmount())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .build();
            
            // Add appointment vaccines
            if (appointment.getAppointmentVaccines() != null && !appointment.getAppointmentVaccines().isEmpty()) {
                List<Map<String, Object>> vaccinesList = new ArrayList<>();
                
                for (AppointmentVaccine av : appointment.getAppointmentVaccines()) {
                    Map<String, Object> vaccineData = new HashMap<>();
                    
                    if (av.getVaccine() != null) {
                        vaccineData.put("vaccineId", av.getVaccine().getId());
                        vaccineData.put("vaccineName", av.getVaccine().getName());
                        vaccineData.put("price", av.getVaccine().getPrice());
                    } else if (av.getVaccineCombo() != null) {
                        vaccineData.put("vaccineId", av.getVaccineCombo().getComboId());
                        vaccineData.put("vaccineName", av.getVaccineCombo().getComboId());
                        vaccineData.put("price", av.getVaccineCombo().getPrice());
                        vaccineData.put("fromCombo", true);
                    }
                    
                    if (av.getVaccineOfChild() != null) {
                        vaccineData.put("vaccineOfChildId", av.getVaccineOfChild().getId());
                        vaccineData.put("doseNumber", av.getDoseNumber());
                    }
                    
                    vaccinesList.add(vaccineData);
                }
                
                responseDTO.setAppointmentVaccines(vaccinesList);
            }
            
            // Add payment details if available
            if (appointment.getPayment() != null) {
                Payment paymentEntity = appointment.getPayment();
                responseDTO.setPaymentId(paymentEntity.getId());
                responseDTO.setPaymentStatus(paymentEntity.getStatus().toString());
                responseDTO.setTransactionId(paymentEntity.getTransactionId());
                responseDTO.setPaymentDate(paymentEntity.getPaymentDate());
                
                if (paymentEntity.getPaymentMethod() != null) {
                    responseDTO.setPaymentMethod(paymentEntity.getPaymentMethod().getName());
                }
            }
                
            return ResponseEntity.ok(responseDTO);
        } catch (AppException e) {
            System.err.println("Application exception when fetching appointment: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "code", e.getErrorCode().getCode(),
                "message", e.getMessage(),
                "result", null
            ));
        } catch (Exception e) {
            System.err.println("Unexpected exception when fetching appointment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "code", 9999,
                "message", "Uncategorized exception: " + e.getMessage(),
                "result", null
            ));
        }
    }
    
    @PutMapping("/{appointmentId}/paid")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateAppointmentPaymentStatus(@PathVariable Long appointmentId) {
        try {
            // Find the appointment
            Appointment appointment = appointmentService.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            System.out.println("Updating payment status for appointment: " + appointmentId);
            System.out.println("Current appointment status: " + appointment.getStatus());
            System.out.println("Current appointment isPaid: " + appointment.isPaid());
            
            // Handle case where appointment is in OFFLINE_PAYMENT status
            if (appointment.getStatus() == AppointmentStatus.OFFLINE_PAYMENT) {
                System.out.println("Processing offline payment for appointment: " + appointmentId);
            }
            
            // Set the appointment as paid
            appointment.setPaid(true);
            appointment.setStatus(AppointmentStatus.PAID);
            
            // Save the updated appointment
            appointmentService.saveAppointment(appointment);
            
            // Process vaccines after payment
            appointmentService.processVaccinesAfterPayment(appointmentId);
            
            // Fetch the updated appointment to return with response
            Appointment updatedAppointment = appointmentService.findById(appointmentId)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Appointment payment status updated successfully",
                "appointment", updatedAppointment
            ));
            
        } catch (Exception e) {
            System.err.println("Error updating appointment payment status: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Failed to update appointment payment status: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/available-slots")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getAvailableSlots(
            @RequestParam(name = "doctorId", required = false) String doctorId,
            @RequestParam(name = "date") LocalDate date) {
        try {
            List<WorkSchedule> schedules;
            if (doctorId != null) {
                schedules = workScheduleRepository.findByEmployeeIdAndWorkDate(doctorId, date)
                    .map(List::of)
                    .orElse(List.of());
            } else {
                schedules = workScheduleRepository.findByWorkDate(date);
            }

            // Get appointments for each schedule
            Map<String, List<Map<String, Object>>> availableSlots = new HashMap<>();
            for (WorkSchedule schedule : schedules) {
                List<String> slots = getAvailableTimeSlots(schedule);
                if (!slots.isEmpty()) {
                    String doctorName = schedule.getEmployee().getFullName();
                    String employeeId = schedule.getEmployee().getAccountId();
                    String doctorKey = employeeId + " - " + doctorName;
                    
                    // Convert slots into more detailed objects for the frontend
                    List<Map<String, Object>> slotDetailsList = new ArrayList<>();
                    for (String slot : slots) {
                        Map<String, Object> slotDetails = new HashMap<>();
                        slotDetails.put("timeSlot", slot);
                        
                        int appointmentsCount = appointmentService.countActiveAppointmentsInTimeSlot(schedule, slot);
                        slotDetails.put("availableAppointments", 5 - appointmentsCount);
                        slotDetailsList.add(slotDetails);
                    }
                    
                    availableSlots.put(doctorKey, slotDetailsList);
                }
            }

            return ResponseEntity.ok(Map.of(
                "availableSlots", availableSlots
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    private List<String> getAvailableTimeSlots(WorkSchedule schedule) {
        // Define hourly slots instead of time blocks
        List<String> allHourlySlots = Arrays.asList(
            "8-9", "9-10", "10-11", "11-12", "13-14", "14-15", "15-16", "16-17"
        );
        
        return allHourlySlots.stream()
            .filter(slot -> isTimeSlotAvailable(schedule, slot))
            .collect(Collectors.toList());
    }

    private boolean isTimeSlotAvailable(WorkSchedule schedule, String timeSlot) {
        int currentAppointments = appointmentService.countActiveAppointmentsInTimeSlot(schedule, timeSlot);
        return currentAppointments < 5; // Maximum 5 appointments per slot
    }
    
    @GetMapping("/available-dates")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getAvailableDates(
            @RequestParam(name = "doctorId", required = false) String doctorId,
            @RequestParam(name = "startDate", required = false) LocalDate startDate,
            @RequestParam(name = "endDate", required = false) LocalDate endDate) {
        try {
            // Default to current date and next 30 days if not specified
            LocalDate start = startDate != null ? startDate : LocalDate.now();
            LocalDate end = endDate != null ? endDate : start.plusDays(30);
            
            List<LocalDate> availableDates;
            if (doctorId != null) {
                // Get dates with schedules for specific doctor
                availableDates = workScheduleRepository.findWorkDatesByEmployeeIdAndDateRange(doctorId, start, end);
            } else {
                // Get dates with schedules for any doctor
                availableDates = workScheduleRepository.findWorkDatesByDateRange(start, end);
            }
            
            return ResponseEntity.ok(Map.of(
                "availableDates", availableDates
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/check-dose-payment")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> checkDosePaymentStatus(@RequestParam Long doseScheduleId) {
        try {
            if (doseScheduleId == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Dose schedule ID cannot be null"
                ));
            }
            
            // Log the request for debugging
            System.out.println("Checking dose payment status for doseScheduleId: " + doseScheduleId);
            
            DoseSchedule doseSchedule = doseScheduleRepository.findById(doseScheduleId)
                .orElseThrow(() -> new AppException(ErrorCode.DOSE_SCHEDULE_NOT_FOUND));
            
            // Ensure the VaccineOfChild entity is loaded for safety
            VaccineOfChild vaccineOfChild = doseSchedule.getVaccineOfChild();
            if (vaccineOfChild == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Invalid dose schedule: missing vaccine of child reference"
                ));
            }
            
            // Ensure the Vaccine entity is loaded
            Vaccine vaccine = vaccineOfChild.getVaccine();
            if (vaccine == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Invalid dose schedule: missing vaccine reference"
                ));
            }
            
            // Log successful relationship loading
            System.out.println("Successfully loaded vaccineOfChild ID: " + vaccineOfChild.getId() + 
                               " and vaccine ID: " + vaccine.getId() + 
                               " for dose schedule ID: " + doseScheduleId);
            
            boolean isPaid = doseSchedule.getIsPaid() != null && doseSchedule.getIsPaid();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "isPaid", isPaid,
                "doseNumber", doseSchedule.getDoseNumber(),
                "vaccineId", vaccine.getId(),
                "vaccineName", vaccine.getName(),
                "vaccineOfChildId", vaccineOfChild.getId()
            ));
        } catch (AppException e) {
            System.err.println("Application exception when checking dose payment: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage(),
                "code", e.getErrorCode().getCode()
            ));
        } catch (Exception e) {
            System.err.println("Unexpected exception when checking dose payment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to check payment status: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/user")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getUserAppointments() {
        try {
            // Get the currently authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            
            // Get all children for this user
            List<Child> userChildren = childRepo.findByParentAccountId(username);
            
            if (userChildren.isEmpty()) {
                return ResponseEntity.ok(new ArrayList<>());
            }
            
            // Get appointments for all children of this user
            List<AppointmentResponseDTO> userAppointments = new ArrayList<>();
            for (Child child : userChildren) {
                List<Appointment> childAppointments = appointmentService.findByChild(child);
                
                for (Appointment appointment : childAppointments) {
                    AppointmentResponseDTO appointmentDTO = AppointmentResponseDTO.builder()
                        .id(appointment.getId())
                        .childId(child.getChild_id())
                        .childName(child.getChild_name())
                        .appointmentType(getAppointmentType(appointment))
                        .appointmentTime(appointment.getAppointmentTime())
                        .status(appointment.getStatus())
                        .paymentStatus(appointment.isPaid() ? "PAID" : "UNPAID")
                        .build();
                        
                    userAppointments.add(appointmentDTO);
                }
            }
            
            return ResponseEntity.ok(userAppointments);
        } catch (Exception e) {
            System.err.println("Error fetching user appointments: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "code", 9999,
                "message", "Uncategorized exception: " + e.getMessage(),
                "result", null
            ));
        }
    }

    // Helper method to determine appointment type based on vaccines
    private String getAppointmentType(Appointment appointment) {
        if (appointment.getAppointmentVaccines() == null || appointment.getAppointmentVaccines().isEmpty()) {
            return "STANDARD";
        }
        
        // Check if any vaccine is from a combo
        boolean hasCombo = appointment.getAppointmentVaccines().stream()
            .anyMatch(av -> av.getVaccineCombo() != null);
        
        if (hasCombo) {
            return "VACCINE_COMBO";
        }
        
        // Check if any vaccine is a next dose
        boolean hasNextDose = appointment.getAppointmentVaccines().stream()
            .anyMatch(av -> av.getDoseSchedule() != null);
        
        if (hasNextDose) {
            return "NEXT_DOSE";
        }
        
        return "NEW_VACCINE";
    }
    
    @GetMapping("/child/{childId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAppointmentsByChildId(@PathVariable String childId) {
        try {
            System.out.println("Fetching appointments for child ID: " + childId);
            
            // Find the child
            Child child = childRepo.findById(childId)
                .orElseThrow(() -> new AppException(ErrorCode.CHILD_NOT_FOUND));
            
            // Get appointments for this child
            List<Appointment> childAppointments = appointmentService.findByChild(child);
            System.out.println("Found " + childAppointments.size() + " appointments for child: " + childId);
            
            // Convert to DTOs
            List<AppointmentResponseDTO> appointmentDTOs = childAppointments.stream()
                .map(appointment -> {
                    AppointmentResponseDTO dto = AppointmentResponseDTO.builder()
                        .id(appointment.getId())
                        .childId(child.getChild_id())
                        .childName(child.getChild_name())
                        .appointmentType(getAppointmentType(appointment))
                        .appointmentTime(appointment.getAppointmentTime())
                        .timeSlot(appointment.getTimeSlot())
                        .status(appointment.getStatus())
                        .paymentStatus(appointment.isPaid() ? "PAID" : "UNPAID")
                        .createdAt(appointment.getCreatedAt())
                        .updatedAt(appointment.getUpdatedAt())
                        .build();
                    
                    // Add doctor information if available
                    if (appointment.getDoctor() != null) {
                        dto.setDoctorId(appointment.getDoctor().getAccountId());
                        dto.setDoctorName(appointment.getDoctor().getFirstName() + " " + appointment.getDoctor().getLastName());
                    }
                    
                    // Add payment details if available
                    if (appointment.getPayment() != null) {
                        Payment paymentEntity = appointment.getPayment();
                        dto.setPaymentId(paymentEntity.getId());
                        dto.setPaymentStatus(paymentEntity.getStatus().toString());
                        dto.setTransactionId(paymentEntity.getTransactionId());
                        dto.setPaymentDate(paymentEntity.getPaymentDate());
                        
                        if (paymentEntity.getPaymentMethod() != null) {
                            dto.setPaymentMethod(paymentEntity.getPaymentMethod().getName());
                        }
                    }
                    
                    return dto;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(appointmentDTOs);
        } catch (AppException e) {
            System.err.println("Application exception when fetching child appointments: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "code", e.getErrorCode().getCode(),
                "message", e.getMessage(),
                "result", null
            ));
        } catch (Exception e) {
            System.err.println("Unexpected exception when fetching child appointments: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "code", 9999,
                "message", "Uncategorized exception: " + e.getMessage(),
                "result", null
            ));
        }
    }
} 