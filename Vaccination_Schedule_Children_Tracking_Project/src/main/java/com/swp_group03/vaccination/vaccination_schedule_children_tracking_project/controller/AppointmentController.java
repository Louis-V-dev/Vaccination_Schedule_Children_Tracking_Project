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
                .doctorId(appointment.getDoctor().getAccountId())
                .doctorName(appointment.getDoctor().getFirstName() + " " + appointment.getDoctor().getLastName())
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
                .doctorId(appointment.getDoctor().getAccountId())
                .doctorName(appointment.getDoctor().getFirstName() + " " + appointment.getDoctor().getLastName())
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
    
    @PutMapping("/{id}/paid")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateAppointmentPaymentStatus(@PathVariable Long id) {
        try {
            System.out.println("Marking appointment " + id + " as paid");
            Appointment appointment = appointmentService.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
            
            Payment payment = null;
            
            // First check if the appointment already has a payment assigned
            if (appointment.getPayment() != null) {
                payment = appointment.getPayment();
                System.out.println("Appointment already has payment with ID: " + payment.getId() + " and status: " + payment.getStatus());
                
                // Update the payment status if needed
                if (payment.getStatus() != PaymentStatus.COMPLETED) {
                    payment.setStatus(PaymentStatus.COMPLETED);
                    payment = paymentRepository.save(payment);
                    System.out.println("Updated payment status to COMPLETED");
                }
            } else {
                // If no payment is associated, try to find one by transaction ID
                String orderRef = "Payment for appointment #" + id;
                System.out.println("Looking for payment with pattern: " + orderRef);
                payment = paymentRepository.findFirstByTransactionIdContainingOrderByCreatedAtDesc(orderRef);
                
                // If not found, try to find by MoMo transaction ID pattern
                if (payment == null) {
                    System.out.println("Trying to find a recent MOMO payment...");
                    
                    // First try to find any payment with MOMO in the transaction ID
                    payment = paymentRepository.findFirstByTransactionIdContainingAndStatusOrderByCreatedAtDesc("MOMO", PaymentStatus.PENDING);
                    if (payment != null) {
                        System.out.println("Found MOMO payment with transaction ID: " + payment.getTransactionId());
                    }
                    
                    // If still not found, try to find by user ID
                    if (payment == null) {
                        List<Payment> momoPayments = paymentRepository.findByStatusAndTransactionIdContainingOrderByCreatedAtDesc(
                            PaymentStatus.PENDING, "MOMO");
                        
                        // Find the most recent MoMo payment for the user
                        if (!momoPayments.isEmpty()) {
                            String userId = String.valueOf(appointment.getChild().getAccount_Id());
                            for (Payment momoPayment : momoPayments) {
                                if (momoPayment.getUser() != null && 
                                    userId.equals(momoPayment.getUser()) && 
                                    (momoPayment.getAppointment() == null || momoPayment.getAppointment().getId() == null)) {
                                    payment = momoPayment;
                                    System.out.println("Found matching MoMo payment with ID: " + payment.getId());
                                    break;
                                }
                            }
                        }
                    }
                }
                
                if (payment != null) {
                    System.out.println("Found existing payment with ID: " + payment.getId() + " and status: " + payment.getStatus());
                    // Update payment status to COMPLETED - but keep the original transaction ID
                    payment.setStatus(PaymentStatus.COMPLETED);
                    payment.setPaymentDate(LocalDateTime.now());
                    // Don't update the transaction ID if it already has one
                    if (payment.getTransactionId() == null || payment.getTransactionId().trim().isEmpty()) {
                        payment.setTransactionId("Payment for appointment #" + id);
                    }
                    // Add a note about the manual processing
                    payment.setNotes("Payment processed and marked as completed");
                    payment = paymentRepository.save(payment);
                    System.out.println("Updated payment status to COMPLETED");
                } else {
                    System.out.println("No payment found, creating a new one as last resort");
                    
                    // Create a new payment record if none exists
                    System.out.println("Creating new payment record for appointment: " + id);
                    Payment newPayment = Payment.builder()
                        .user(appointment.getChild().getAccount_Id())
                        .amount(BigDecimal.valueOf(appointment.getTotalAmount()))
                        .totalAmount(BigDecimal.valueOf(appointment.getTotalAmount()))
                        .status(PaymentStatus.COMPLETED)
                        .paymentDate(LocalDateTime.now())
                        .transactionId("Manual payment for appointment #" + id)
                        .notes("Manual payment processed by system")
                        .build();
                    
                    // Get default payment method (MOMO)
                    Optional<PaymentMethod> defaultMethod = paymentMethodRepository.findByCode("MOMO");
                    if (defaultMethod.isPresent()) {
                        newPayment.setPaymentMethod(defaultMethod.get());
                    }
                    
                    payment = paymentRepository.save(newPayment);
                    System.out.println("Created new payment with ID: " + payment.getId());
                }
                
                // Associate payment with appointment
                appointment.setPayment(payment);
                payment.setAppointment(appointment);
                // Save the payment again to update its relationship with the appointment
                payment = paymentRepository.save(payment);
                System.out.println("Associated payment ID: " + payment.getId() + " with appointment: " + id);
            }
            
            // Update appointment status regardless
            appointment.setPaid(true);
            appointment.setStatus(AppointmentStatus.PAID);
            appointmentService.saveAppointment(appointment);
            System.out.println("Updated appointment status to PAID");
            
            // Process vaccines after payment
            appointmentService.processVaccinesAfterPayment(id);
            System.out.println("Processed vaccines after payment for appointment: " + id);
            
            // Convert to DTO to avoid serialization issues
            AppointmentResponseDTO responseDTO = AppointmentResponseDTO.builder()
                .id(appointment.getId())
                .childId(appointment.getChild().getChild_id())
                .childName(appointment.getChild().getChild_name())
                .doctorId(appointment.getDoctor().getAccountId())
                .doctorName(appointment.getDoctor().getFirstName() + " " + appointment.getDoctor().getLastName())
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Appointment marked as paid successfully",
                "appointment", responseDTO
            ));
        } catch (AppException e) {
            System.err.println("Application exception when marking appointment as paid: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "code", e.getErrorCode().getCode(),
                "message", e.getMessage(),
                "result", null
            ));
        } catch (Exception e) {
            System.err.println("Unexpected exception when marking appointment as paid: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "code", 9999,
                "message", "Uncategorized exception: " + e.getMessage(),
                "result", null
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
} 