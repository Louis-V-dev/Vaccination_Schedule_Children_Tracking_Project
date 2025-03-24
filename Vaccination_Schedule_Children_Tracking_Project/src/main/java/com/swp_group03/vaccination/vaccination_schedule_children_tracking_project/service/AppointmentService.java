package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.appointment.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.AppointmentStatus;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.DoseStatus;
import org.springframework.beans.factory.annotation.Autowired;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.VaccinationStatus;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;

@Service
public class AppointmentService {
    private final AppointmentRepository appointmentRepository;
    private final ChildRepo childRepo;
    private final VaccineRepository vaccineRepository;
    private final UserRepo doctorRepository;
    private final ShiftRepository timeSlotRepository;
    private final VaccineOfChildRepository vaccineOfChildRepository;
    private final DoseScheduleRepository doseScheduleRepository;
    private final PaymentRepository paymentRepository;
    private final WorkScheduleRepository workScheduleRepository;
    private final UserRepo userRepo;
    private final PendingVaccineRequestRepository pendingVaccineRequestRepository;
    private final DoseIntervalRepository doseIntervalRepository;
    private final VaccineComboRepository vaccineComboRepository;
    private static final Logger log = LoggerFactory.getLogger(AppointmentService.class);

    @Autowired
    public AppointmentService(AppointmentRepository appointmentRepository, 
                             ChildRepo childRepo,
                             VaccineRepository vaccineRepository,
                             UserRepo doctorRepository,
                             ShiftRepository timeSlotRepository,
                             VaccineOfChildRepository vaccineOfChildRepository,
                             DoseScheduleRepository doseScheduleRepository,
                             PaymentRepository paymentRepository,
                             WorkScheduleRepository workScheduleRepository,
                             UserRepo userRepo,
                             PendingVaccineRequestRepository pendingVaccineRequestRepository,
                             DoseIntervalRepository doseIntervalRepository,
                             VaccineComboRepository vaccineComboRepository) {
        this.appointmentRepository = appointmentRepository;
        this.childRepo = childRepo;
        this.vaccineRepository = vaccineRepository;
        this.doctorRepository = doctorRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.vaccineOfChildRepository = vaccineOfChildRepository;
        this.doseScheduleRepository = doseScheduleRepository;
        this.paymentRepository = paymentRepository;
        this.workScheduleRepository = workScheduleRepository;
        this.userRepo = userRepo;
        this.pendingVaccineRequestRepository = pendingVaccineRequestRepository;
        this.doseIntervalRepository = doseIntervalRepository;
        this.vaccineComboRepository = vaccineComboRepository;
    }

    @Transactional
    public Appointment createAppointment(CreateAppointmentRequest request) {
        // 1. Validate child
        Child child = childRepo.findById(request.getChildId())
            .orElseThrow(() -> new AppException(ErrorCode.CHILD_NOT_FOUND));

        // 2. Find or validate doctor's schedule
        WorkSchedule workSchedule;
        if (request.getIsDayPriority()) {
            // Find available schedule if day priority
            workSchedule = findAvailableSchedule(request.getAppointmentDate(), request.getTimeSlot());
        } else {
            // Validate specific doctor's availability
            workSchedule = validateDoctorAvailability(request.getDoctorId(), request.getAppointmentDate(), request.getTimeSlot());
        }

        // 3. Validate time slot availability
        validateTimeSlotAvailability(workSchedule, request.getTimeSlot());

        // 4. Create appointment with initial status based on payment method
        boolean isOnlinePayment = "ONLINE".equalsIgnoreCase(request.getPaymentMethod());
        
        // Only set the doctor explicitly if requested by client
        // In day priority mode with no specified doctor, keep doctor null initially
        Account doctor = null;
        
        // In doctor priority mode or if doctor ID is specified in day priority mode,
        // use the specified doctor
        if (request.getDoctorId() != null) {
            // Find the doctor by ID
            doctor = userRepo.findById(request.getDoctorId())
                .orElseThrow(() -> new AppException(ErrorCode.DOCTOR_NOT_FOUND));
            log.info("Setting doctor to specified doctor: {}", doctor.getAccountId());
        } else if (!request.getIsDayPriority()) {
            throw new AppException(ErrorCode.DOCTOR_REQUIRED);
        } else {
            // In day priority mode with no doctor specified, leave doctor as null
            log.info("No doctor specified in day priority mode. Keeping doctor field as null.");
        }
        
        // Set appropriate status and isPaid flag based on payment method
        AppointmentStatus initialStatus;
        boolean initialIsPaid;
        
        if (isOnlinePayment) {
            // For online payments, status is PENDING and isPaid is false
            initialStatus = AppointmentStatus.PENDING;
            initialIsPaid = false;
        } else {
            // For offline payments, status is OFFLINE_PAYMENT and isPaid is false
            initialStatus = AppointmentStatus.OFFLINE_PAYMENT;
            initialIsPaid = false;
            log.info("Setting OFFLINE_PAYMENT status for appointment");
        }
        
        Appointment appointment = Appointment.builder()
            .child(child)
            .workSchedule(workSchedule)
            .doctor(doctor) // This will be null if no doctor was specified in day priority mode
            .appointmentTime(request.getAppointmentDate().atTime(parseTimeSlot(request.getTimeSlot())))
            .timeSlot(request.getTimeSlot())
            .status(initialStatus)
            .notes(request.getNotes())
            .isPaid(initialIsPaid)
            .totalAmount(0.0)
            .appointmentVaccines(new ArrayList<>())
            .build();

        // Save appointment first to get ID
        appointment = appointmentRepository.save(appointment);
        
        // Process vaccines (this will handle storing requests based on payment type)
        processVaccines(appointment, request.getVaccines(), isOnlinePayment);
        
        // Calculate total amount - always use calculateTotalAmountFromRequests to avoid NPE
            calculateTotalAmountFromRequests(appointment, request.getVaccines());
            
            return appointmentRepository.save(appointment);
    }

    private WorkSchedule findAvailableSchedule(LocalDate date, String timeSlot) {
        // Add debug logging for the date parameter
        log.info("Finding available schedule for date: {}", date);
        
        List<WorkSchedule> schedules = workScheduleRepository.findByWorkDate(date);
        log.info("Found {} schedules for date {}", schedules.size(), date);
        
        if (schedules.isEmpty()) {
            throw new AppException(ErrorCode.NO_AVAILABLE_SCHEDULE);
        }

        // Find schedule with least appointments in the time slot
        return schedules.stream()
            .filter(schedule -> isTimeSlotAvailable(schedule, timeSlot))
            .findFirst()
            .orElseThrow(() -> new AppException(ErrorCode.NO_AVAILABLE_SCHEDULE));
    }

    private WorkSchedule validateDoctorAvailability(String doctorId, LocalDate date, String timeSlot) {
        return workScheduleRepository.findByEmployeeIdAndWorkDate(doctorId, date)
            .filter(schedule -> isTimeSlotAvailable(schedule, timeSlot))
            .orElseThrow(() -> new AppException(ErrorCode.DOCTOR_NOT_AVAILABLE));
    }

    public boolean isTimeSlotAvailable(WorkSchedule schedule, String timeSlot) {
        int currentAppointments = countActiveAppointmentsInTimeSlot(schedule, timeSlot);
        return currentAppointments < 5; // Maximum 5 appointments per slot
    }

    public int countActiveAppointmentsInTimeSlot(WorkSchedule schedule, String timeSlot) {
        return appointmentRepository.countActiveAppointmentsInTimeSlot(schedule, timeSlot);
    }

    private void validateTimeSlotAvailability(WorkSchedule schedule, String timeSlot) {
        if (!isTimeSlotAvailable(schedule, timeSlot)) {
            throw new AppException(ErrorCode.TIME_SLOT_FULL);
        }
    }

    private LocalTime parseTimeSlot(String timeSlot) {
        String[] parts = timeSlot.split("-");
        return LocalTime.of(Integer.parseInt(parts[0]), 0); // Start time of the slot
    }

    private void processVaccines(Appointment appointment, List<AppointmentVaccineRequest> vaccineRequests, boolean isOnlinePayment) {
        if (vaccineRequests == null || vaccineRequests.isEmpty()) {
            log.info("No vaccine requests to process for appointment ID: {}", appointment.getId());
            return;
        }
        
        log.info("Processing {} vaccine requests for {} payment", vaccineRequests.size(), 
            isOnlinePayment ? "online" : "offline");
        
        // For online payment, store vaccine requests for later processing
        if (isOnlinePayment) {
            storeVaccineRequestsForLaterProcessing(appointment.getId(), vaccineRequests);
        }
        
        // Process vaccine requests for both online and offline payments
        // The difference is that for online payments, we don't create VaccineOfChild records yet
        for (AppointmentVaccineRequest request : vaccineRequests) {
            try {
                switch (request.getType()) {
                case "NEW_VACCINE":
                        processNewVaccine(appointment, request);
                    break;
                case "NEXT_DOSE":
                        // For online payments, we still need to link to existing VaccineOfChild
                        processNextDose(appointment, request);
                    break;
                case "VACCINE_COMBO":
                        processVaccineCombo(appointment, request);
                    break;
                default:
                        log.warn("Unknown vaccine request type: {}", request.getType());
                }
            } catch (Exception e) {
                log.error("Error processing vaccine request: {}", e.getMessage(), e);
                // Continue processing other requests even if one fails
            }
        }
    }

    private void processNewVaccine(Appointment appointment, AppointmentVaccineRequest request) {
        log.info("Processing new vaccine with ID: {}", request.getVaccineId());
        
        Vaccine vaccine = vaccineRepository.findById(request.getVaccineId())
            .orElseThrow(() -> new AppException(ErrorCode.VACCINE_NOT_FOUND));

        // Create AppointmentVaccine with reference to vaccine
        // VaccineOfChild will be created after payment is successful for online payments
        // or in a separate step for offline payments
        AppointmentVaccine appointmentVaccine = AppointmentVaccine.builder()
            .appointment(appointment)
            .vaccine(vaccine) // Store vaccine reference
            .vaccineOfChild(null) // No VaccineOfChild yet
            .doseNumber(request.getDoseNumber() != null ? request.getDoseNumber() : 1)
            .status(VaccinationStatus.PENDING)
            .build();

        appointment.getAppointmentVaccines().add(appointmentVaccine);
        log.info("Added new vaccine to appointment: {}", vaccine.getName());
    }

    private void processNextDoseOffline(Appointment appointment, AppointmentVaccineRequest request) {
        if (request.getVaccineOfChildId() == null) {
            log.error("VaccineOfChildId is null for next dose request");
            throw new AppException(ErrorCode.INVALID_APPOINTMENT_VACCINE_REQUEST);
        }
        
        log.info("Processing next dose for VaccineOfChild with ID: {}", request.getVaccineOfChildId());
        
        // Find the existing VaccineOfChild - this needs to exist already since it's a next dose
        VaccineOfChild existingVoc = vaccineOfChildRepository.findById(request.getVaccineOfChildId())
            .orElseThrow(() -> new AppException(ErrorCode.VACCINE_OF_CHILD_NOT_FOUND));
        
        // Get the vaccine details
        Vaccine vaccine = existingVoc.getVaccine();
        
        // For NEXT_DOSE, we keep the reference to the existing VaccineOfChild
        // The dose update will happen after payment is processed
        AppointmentVaccine appointmentVaccine = AppointmentVaccine.builder()
            .appointment(appointment)
            .vaccine(vaccine)
            .vaccineOfChild(existingVoc) // Use the existing VaccineOfChild (this is already in the system)
            .doseNumber(request.getDoseNumber() != null ? request.getDoseNumber() : existingVoc.getCurrentDose() + 1)
            .status(VaccinationStatus.PENDING)
            .build();

        appointment.getAppointmentVaccines().add(appointmentVaccine);
        log.info("Added next dose to appointment: {}, dose: {}", 
                vaccine.getName(), 
                request.getDoseNumber() != null ? request.getDoseNumber() : existingVoc.getCurrentDose() + 1);
    }

    private void processVaccineCombo(Appointment appointment, AppointmentVaccineRequest request) {
        log.info("Processing vaccine combo with ID: {}", request.getComboId());
        
        VaccineCombo combo = vaccineComboRepository.findById(request.getComboId())
            .orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_FOUND));
        
        // Get all vaccines in this combo - FIXED: Use Set directly without casting to List
        Set<ComboDetail> comboDetails = combo.getVaccineDetails();
        if (comboDetails == null || comboDetails.isEmpty()) {
            log.warn("No vaccines found in combo: {}", combo.getComboId());
            return;
        }

        // Add combo entry to appointment
        AppointmentVaccine comboEntry = AppointmentVaccine.builder()
            .appointment(appointment)
            .vaccineCombo(combo)
            .vaccineOfChild(null) // No VaccineOfChild yet
            .doseNumber(1)
            .status(VaccinationStatus.PENDING)
            .fromCombo(true)
            .build();

        appointment.getAppointmentVaccines().add(comboEntry);
        log.info("Added combo entry to appointment: {}", combo.getComboName());
        
        // Individual vaccine entries for the combo will be created after payment is processed
    }

    private void calculateTotalAmount(Appointment appointment) {
        double total = 0.0;
        Set<Long> processedCombos = new HashSet<>();
        
        for (AppointmentVaccine av : appointment.getAppointmentVaccines()) {
            VaccineOfChild voc = av.getVaccineOfChild();
            
            if (voc != null && voc.getIsFromCombo()) {
                // Add combo price only once
                VaccineCombo combo = voc.getVaccineCombo();
                if (combo != null && processedCombos.add(Long.valueOf(combo.getComboId()))) {
                    total += combo.getPrice();
                }
            } else if (voc != null) {
                // Add individual vaccine price from VaccineOfChild
                total += voc.getVaccine().getPrice().doubleValue();
            } else if (av.getVaccineCombo() != null) {
                // Handle case where VaccineOfChild is null but VaccineCombo exists
                Long comboId = Long.valueOf(av.getVaccineCombo().getComboId());
                if (processedCombos.add(comboId)) {
                    total += av.getVaccineCombo().getPrice();
                }
            } else if (av.getVaccine() != null) {
                // Handle case where VaccineOfChild is null but Vaccine exists
                total += av.getVaccine().getPrice().doubleValue();
            }
        }
        
        appointment.setTotalAmount(total);
    }

    // Store vaccine requests for later processing after payment is complete
    private void storeVaccineRequestsForLaterProcessing(Long appointmentId, List<AppointmentVaccineRequest> vaccineRequests) {
        System.out.println("Storing " + vaccineRequests.size() + " vaccine requests for appointment " + appointmentId + " to process after payment");
        
        // Convert and save all requests to PendingVaccineRequest entities
        List<PendingVaccineRequest> pendingRequests = vaccineRequests.stream()
            .map(req -> new PendingVaccineRequest(appointmentId, req))
            .collect(Collectors.toList());
        
        pendingVaccineRequestRepository.saveAll(pendingRequests);
    }

    // Calculate total amount from requests without creating VaccineOfChild records
    private void calculateTotalAmountFromRequests(Appointment appointment, List<AppointmentVaccineRequest> vaccineRequests) {
        double total = 0.0;
        Set<Long> processedCombos = new HashSet<>();
        
        for (AppointmentVaccineRequest request : vaccineRequests) {
            switch (request.getType()) {
                case "NEW_VACCINE":
                    Vaccine vaccine = vaccineRepository.findById(request.getVaccineId())
                        .orElseThrow(() -> new AppException(ErrorCode.VACCINE_NOT_FOUND));
                    total += vaccine.getPrice().doubleValue();
                    break;
                    
                case "NEXT_DOSE":
                    // For next dose, get price from existing vaccine
                    DoseSchedule doseSchedule = doseScheduleRepository.findById(request.getDoseScheduleId())
                        .orElseThrow(() -> new AppException(ErrorCode.DOSE_SCHEDULE_NOT_FOUND));
                    
                    // If dose is not already paid
                    if (!doseSchedule.isPaid()) {
                        total += doseSchedule.getVaccineOfChild().getVaccine().getPrice().doubleValue();
                    }
                    break;
                    
                case "VACCINE_COMBO":
                    // Add combo price only once
                    VaccineCombo combo = vaccineComboRepository.findById(request.getComboId())
                        .orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_FOUND));
                    
                    if (processedCombos.add(Long.valueOf(combo.getComboId()))) {
                        total += combo.getPrice();
                    }
                    break;
                    
                default:
                    throw new AppException(ErrorCode.INVALID_VACCINE_TYPE);
            }
        }
        
        appointment.setTotalAmount(total);
    }

    // Process vaccines after payment is complete
    @Transactional
    public void processVaccinesAfterPayment(Long appointmentId) {
        log.info("Processing vaccines after payment for appointment ID: {}", appointmentId);
        
        // Find the appointment
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new AppException(ErrorCode.APPOINTMENT_NOT_FOUND));
        
        // Get stored vaccine requests
        List<PendingVaccineRequest> pendingRequests = pendingVaccineRequestRepository.findByAppointmentId(appointmentId);
        
        log.info("Found {} pending vaccine requests for processing", pendingRequests.size());
        
        // Get existing appointment vaccines
        List<AppointmentVaccine> existingVaccines = appointment.getAppointmentVaccines();
        Set<Long> fullyProcessedVaccineIds = new HashSet<>();
        Set<Long> fullyProcessedComboIds = new HashSet<>();
        Set<Long> processedVocIds = new HashSet<>();
        
        // Extract IDs of vaccines that have been FULLY processed (have VaccineOfChild records)
        for (AppointmentVaccine av : existingVaccines) {
            if (av.getVaccineOfChild() != null) {
                // This vaccine is fully processed
                if (av.getVaccine() != null && av.getVaccine().getId() != null) {
                    fullyProcessedVaccineIds.add(av.getVaccine().getId());
                }
                if (av.getVaccineCombo() != null && av.getVaccineCombo().getComboId() != null) {
                    fullyProcessedComboIds.add(Long.valueOf(av.getVaccineCombo().getComboId()));
                }
                if (av.getVaccineOfChild() != null && av.getVaccineOfChild().getId() != null) {
                    processedVocIds.add(av.getVaccineOfChild().getId());
                }
            }
        }
        
        // Process all appointment vaccines that have a dose schedule and mark them as paid
        for (AppointmentVaccine av : existingVaccines) {
            if (av.getDoseSchedule() != null) {
                DoseSchedule doseSchedule = av.getDoseSchedule();
                doseSchedule.setIsPaid(true);
                doseSchedule.setStatus(String.valueOf(DoseStatus.SCHEDULED));
                if (appointment.getAppointmentTime() != null) {
                    doseSchedule.setScheduledDate(appointment.getAppointmentTime().toLocalDate());
                }
                doseScheduleRepository.save(doseSchedule);
                log.info("Directly marked dose schedule ID: {} as paid from AppointmentVaccine", doseSchedule.getId());
            }
        }
        
        // Process pending requests if any
        for (PendingVaccineRequest pendingRequest : pendingRequests) {
            String type = pendingRequest.getType();
            log.info("Processing pending vaccine request with type: {}", type);
            
            if ("NEW_VACCINE".equals(type)) {
                // Process new vaccine - create VaccineOfChild and dose schedules
                processNewVaccineAfterPayment(appointment, pendingRequest);
                
            } else if ("NEXT_DOSE".equals(type)) {
                // Process next dose - mark dose as paid and update current dose
                processNextDoseAfterPayment(appointment, pendingRequest);
                
            } else if ("VACCINE_COMBO".equals(type)) {
                // Process vaccine combo - add all vaccines and mark all doses as paid
                processVaccineComboAfterPayment(appointment, pendingRequest);
            }
        }
        
        // Update appointment
        appointment.setStatus(AppointmentStatus.PAID);
        appointment.setPaid(true);
        
        // Save updated appointment
        appointmentRepository.save(appointment);
        
        // Clear stored requests
        pendingVaccineRequestRepository.deleteByAppointmentId(appointmentId);
        
        log.info("Successfully processed vaccines after payment for appointment ID: {}", appointmentId);
    }

    private void processNewVaccineAfterPayment(Appointment appointment, PendingVaccineRequest request) {
        Vaccine vaccine = vaccineRepository.findById(request.getVaccineId())
            .orElseThrow(() -> new AppException(ErrorCode.VACCINE_NOT_FOUND));
        
        // Create VaccineOfChild
        VaccineOfChild vaccineOfChild = VaccineOfChild.builder()
            .child(appointment.getChild())
            .vaccine(vaccine)
            .totalDoses(parseDosage(vaccine.getDosage()))
            .currentDose(1) // Set to 1 since first dose is being administered
            .isCompleted(false)
            .startDate(LocalDateTime.now())
            .isFromCombo(false)
            .build();
        
        vaccineOfChild = vaccineOfChildRepository.save(vaccineOfChild);
        log.info("Created VaccineOfChild with ID: {} for new vaccine: {}", vaccineOfChild.getId(), vaccine.getName());
        
        // Find and update existing AppointmentVaccine entries for this vaccine
        for (AppointmentVaccine av : appointment.getAppointmentVaccines()) {
            if (av.getVaccine() != null && av.getVaccine().getId().equals(vaccine.getId()) && av.getVaccineOfChild() == null) {
                av.setVaccineOfChild(vaccineOfChild);
                log.info("Updated AppointmentVaccine with ID: {} to link to VaccineOfChild: {}", av.getId(), vaccineOfChild.getId());
            }
        }
        
        // Get dose intervals for this vaccine
        List<DoseInterval> intervals = doseIntervalRepository.findByVaccineOrderByFromDoseAsc(vaccine);
        
        // Create dose schedules for all doses
        int totalDoses = parseDosage(vaccine.getDosage());
        LocalDate appointmentDate = appointment.getAppointmentTime().toLocalDate();
        
        // First dose is on appointment date and is paid
        DoseSchedule firstDose = DoseSchedule.builder()
            .vaccineOfChild(vaccineOfChild)
            .doseNumber(1)
            .status(DoseStatus.SCHEDULED)
            .scheduledDate(appointmentDate)
            .isPaid(true) // First dose is paid
            .build();
        doseScheduleRepository.save(firstDose);
        log.info("Created first dose schedule for appointment date: {}", appointmentDate);
        
        // Create remaining doses with calculated dates based on intervals
        if (intervals.isEmpty() || intervals.size() < totalDoses - 1) {
            log.info("Insufficient dose intervals defined for vaccine: {}", vaccine.getName());
            // If no intervals or insufficient intervals, but multiple doses, create placeholder schedules
            for (int i = 2; i <= totalDoses; i++) {
                DoseSchedule nextDose = DoseSchedule.builder()
                    .vaccineOfChild(vaccineOfChild)
                    .doseNumber(i)
                    .status(DoseStatus.UNSCHEDULED)
                    .isPaid(false) // Future doses not paid
                    .build();
                doseScheduleRepository.save(nextDose);
                log.info("Created placeholder dose {} schedule without date", i);
            }
        } else {
            // Map to track the computed date for each dose
            Map<Integer, LocalDate> doseDates = new HashMap<>();
            doseDates.put(1, appointmentDate); // First dose date
            
            // Compute dates for all doses using intervals
            for (int i = 2; i <= totalDoses; i++) {
                // Create a final copy of i for use in lambda
                final int doseNumber = i;
                final int previousDoseNumber = i-1;
                
                // Find the interval for this dose
                Optional<DoseInterval> interval = intervals.stream()
                    .filter(di -> di.getFromDose() == previousDoseNumber && di.getToDose() == doseNumber)
                    .findFirst();
                
                if (interval.isPresent()) {
                    // Calculate date based on previous dose date
                    LocalDate previousDoseDate = doseDates.get(doseNumber-1);
                    LocalDate nextDoseDate = previousDoseDate.plusDays(interval.get().getIntervalDays());
                    doseDates.put(doseNumber, nextDoseDate);
                    
                    DoseSchedule nextDose = DoseSchedule.builder()
                        .vaccineOfChild(vaccineOfChild)
                        .doseNumber(doseNumber)
                        .status(DoseStatus.SCHEDULED) // Mark as SCHEDULED since we have a date
                        .scheduledDate(nextDoseDate)
                        .isPaid(false) // Future doses not paid
                        .build();
                    doseScheduleRepository.save(nextDose);
                    log.info("Created dose {} schedule for date: {}", doseNumber, nextDoseDate);
                } else {
                    // Fallback if interval not found
                    log.warn("No interval found for dose {} to {}, using placeholder", previousDoseNumber, doseNumber);
                    DoseSchedule nextDose = DoseSchedule.builder()
                        .vaccineOfChild(vaccineOfChild)
                        .doseNumber(doseNumber)
                        .status(DoseStatus.UNSCHEDULED)
                        .isPaid(false) // Future doses not paid
                        .build();
                    doseScheduleRepository.save(nextDose);
                }
            }
        }
        
        // Update the dose schedule reference in AppointmentVaccine
        for (AppointmentVaccine av : appointment.getAppointmentVaccines()) {
            if (av.getVaccineOfChild() != null && av.getVaccineOfChild().getId().equals(vaccineOfChild.getId())) {
                // Find the first dose schedule for this vaccine
                DoseSchedule firstDoseSchedule = doseScheduleRepository.findByVaccineOfChildAndDoseNumber(vaccineOfChild, 1)
                    .orElse(null);
                
                if (firstDoseSchedule != null) {
                    av.setDoseSchedule(firstDoseSchedule);
                    log.info("Updated AppointmentVaccine with dose schedule for first dose");
                }
            }
        }
    }

    private void processNextDoseAfterPayment(Appointment appointment, PendingVaccineRequest request) {
        // Find the vaccine of child for this dose
        VaccineOfChild vaccineOfChild = vaccineOfChildRepository.findById(request.getVaccineOfChildId())
            .orElseThrow(() -> new AppException(ErrorCode.VACCINE_OF_CHILD_NOT_FOUND));
        
        // Find the dose schedule
        DoseSchedule doseSchedule = doseScheduleRepository.findById(request.getDoseScheduleId())
            .orElseThrow(() -> new AppException(ErrorCode.DOSE_SCHEDULE_NOT_FOUND));
        
        log.info("Processing next dose for VaccineOfChild: {}, doseNumber: {}", 
            vaccineOfChild.getId(), doseSchedule.getDoseNumber());
        
        // Mark dose as paid
        doseSchedule.setIsPaid(true);
        doseSchedule.setStatus(String.valueOf(DoseStatus.SCHEDULED));
        doseSchedule.setScheduledDate(appointment.getAppointmentTime().toLocalDate());
        doseScheduleRepository.save(doseSchedule);
        log.info("Updated dose schedule with ID: {} - marked as paid and scheduled", doseSchedule.getId());
        
        // Update status of any existing AppointmentVaccine entries for this dose
        for (AppointmentVaccine av : appointment.getAppointmentVaccines()) {
            if (av.getVaccineOfChild() != null && 
                av.getVaccineOfChild().getId().equals(vaccineOfChild.getId()) && 
                (av.getDoseNumber() == null || av.getDoseNumber().equals(doseSchedule.getDoseNumber()))) {
                
                // Link to dose schedule if not already linked
                if (av.getDoseSchedule() == null) {
                    av.setDoseSchedule(doseSchedule);
                    log.info("Updated AppointmentVaccine with ID: {} to link to dose schedule: {}", 
                        av.getId(), doseSchedule.getId());
                }
            }
        }
    }

    private void processVaccineComboAfterPayment(Appointment appointment, PendingVaccineRequest request) {
        VaccineCombo combo = vaccineComboRepository.findById(request.getComboId())
            .orElseThrow(() -> new AppException(ErrorCode.COMBO_NOT_FOUND));
        
        log.info("Processing vaccine combo: {} with ID: {}", combo.getComboName(), combo.getComboId());
        
        // Get all vaccines in this combo through ComboDetail
        Set<ComboDetail> comboDetails = combo.getVaccineDetails();
        if (comboDetails == null || comboDetails.isEmpty()) {
            log.warn("No vaccines found in combo: {}", combo.getComboId());
            return;
        }
        
        log.info("Found {} vaccines in combo: {}", comboDetails.size(), combo.getComboName());
        
        // First, create a VaccineOfChild for the combo as a whole (for reference)
        // Get the first vaccine from the set for representative purposes
        Vaccine representativeVaccine = comboDetails.iterator().next().getVaccine();
        VaccineOfChild comboVaccineOfChild = VaccineOfChild.builder()
            .child(appointment.getChild())
            .vaccine(representativeVaccine)
            .totalDoses(1) // For the combo as a whole
            .currentDose(1)
            .isCompleted(false)
            .startDate(LocalDateTime.now())
            .isFromCombo(true)
            .vaccineCombo(combo)
            .build();
        
        comboVaccineOfChild = vaccineOfChildRepository.save(comboVaccineOfChild);
        log.info("Created VaccineOfChild with ID: {} for combo: {}", comboVaccineOfChild.getId(), combo.getComboName());
        
        // Find and update existing AppointmentVaccine entries for this combo
        boolean comboEntryFound = false;
        for (AppointmentVaccine av : appointment.getAppointmentVaccines()) {
            if (av.getVaccineCombo() != null && 
                combo.getComboId().equals(av.getVaccineCombo().getComboId()) && 
                av.getVaccineOfChild() == null) {
                av.setVaccineOfChild(comboVaccineOfChild);
                comboEntryFound = true;
                log.info("Updated AppointmentVaccine with ID: {} to link to combo VaccineOfChild: {}", av.getId(), comboVaccineOfChild.getId());
            }
        }
        
        // If no combo entry was found, create one
        if (!comboEntryFound) {
            AppointmentVaccine comboEntry = AppointmentVaccine.builder()
                .appointment(appointment)
                .vaccineCombo(combo)
                .vaccineOfChild(comboVaccineOfChild)
                .doseNumber(1)
                .status(VaccinationStatus.PENDING)
                .fromCombo(true)
                .build();
            
            appointment.getAppointmentVaccines().add(comboEntry);
            log.info("Created new combo entry AppointmentVaccine for combo: {}", combo.getComboName());
        }
        
        // Process each vaccine in the combo
        for (ComboDetail detail : comboDetails) {
            Vaccine vaccine = detail.getVaccine();
            if (vaccine == null) {
                log.warn("Null vaccine found in combo detail, skipping");
                continue;
            }
            
            // Get total doses from ComboDetail - this is specific to this vaccine in this combo
            int totalDoses = detail.getTotalDose();
            log.info("Processing vaccine {} with total doses: {} in combo", vaccine.getName(), totalDoses);
            
            // Check if child already has this vaccine from this combo
            boolean exists = vaccineOfChildRepository.existsByChildAndVaccineIdAndIsFromComboTrue(
                appointment.getChild(), 
                vaccine.getId()
            );
            
            if (exists) {
                log.info("Child already has vaccine {} from combo, skipping", vaccine.getName());
                continue; // Skip if already exists
            }
            
            // Create VaccineOfChild for individual vaccine with total doses from ComboDetail
            VaccineOfChild vaccineOfChild = VaccineOfChild.builder()
                .child(appointment.getChild())
                .vaccine(vaccine)
                .totalDoses(totalDoses) // Using total doses from ComboDetail
                .currentDose(1) // Set to 1 since first dose is being administered
                .isCompleted(totalDoses == 1) // If only one dose, mark as completed
                .startDate(LocalDateTime.now())
                .completionDate(totalDoses == 1 ? LocalDateTime.now() : null)
                .isFromCombo(true)
                .vaccineCombo(combo)
                .build();
            
            vaccineOfChild = vaccineOfChildRepository.save(vaccineOfChild);
            log.info("Created VaccineOfChild with ID: {} for vaccine: {}", vaccineOfChild.getId(), vaccine.getName());
            
            // Create dose schedules for all doses
            for (int doseNumber = 1; doseNumber <= totalDoses; doseNumber++) {
                try {
                    // First dose is on appointment date, others are unscheduled
                    LocalDateTime scheduledDate = null;
                    DoseStatus status;
                    
                    if (doseNumber == 1) {
                        // For first dose, use the appointment date
                        scheduledDate = appointment.getAppointmentTime();
                        status = DoseStatus.SCHEDULED;
                    } else {
                        // For subsequent doses, try to calculate based on intervals
                        DoseInterval interval = doseIntervalRepository.findByVaccineAndFromDose(vaccine, doseNumber - 1);
                        if (interval != null) {
                            // Calculate date based on appointment date
                            scheduledDate = appointment.getAppointmentTime().plusDays(interval.getIntervalDays());
                            status = DoseStatus.SCHEDULED;
                        } else {
                            // If no interval found, leave unscheduled as requested
                            status = DoseStatus.UNSCHEDULED;
                        }
                    }
                    
                    // Create dose schedule with proper status
                    DoseSchedule doseSchedule = DoseSchedule.builder()
                        .vaccineOfChild(vaccineOfChild)
                        .doseNumber(doseNumber)
                        .scheduledDate(LocalDate.from(scheduledDate))
                        .status(status) // Set the status explicitly
                        .isPaid(doseNumber == 1) // Only first dose is paid for combo vaccines
                        .build();
                    
                    doseSchedule = doseScheduleRepository.save(doseSchedule);
                    log.info("Created DoseSchedule with ID: {} for vaccine: {}, dose: {}, status: {}", 
                        doseSchedule.getId(), vaccine.getName(), doseNumber, status);
                    
                    // For the first dose, link it to an AppointmentVaccine entry
                    if (doseNumber == 1) {
                        // Look for an existing appointment vaccine entry for this vaccine from the combo
                        boolean foundExisting = false;
                        for (AppointmentVaccine av : appointment.getAppointmentVaccines()) {
                            // Find matching vaccine entries that are from combo and don't have vaccineOfChild set
                            if (av.getVaccine() != null && 
                                av.getVaccine().getId().equals(vaccine.getId()) &&
                                Boolean.TRUE.equals(av.getFromCombo()) &&
                                av.getVaccineOfChild() == null) {
                                
                                // Update existing entry
                                av.setVaccineOfChild(vaccineOfChild);
                                av.setDoseSchedule(doseSchedule);
                                log.info("Updated existing AppointmentVaccine for combo vaccine: {}", vaccine.getName());
                                foundExisting = true;
                                break;
                            }
                        }
                        
                        // If no existing entry found, create a new one
                        if (!foundExisting) {
                            AppointmentVaccine appointmentVaccine = AppointmentVaccine.builder()
                                .appointment(appointment)
                                .vaccineOfChild(vaccineOfChild)
                                .vaccine(vaccine)
                                .doseSchedule(doseSchedule)
                                .doseNumber(doseNumber)
                                .status(VaccinationStatus.PENDING)
                                .fromCombo(true)
                                .vaccineCombo(combo)
                                .build();
                            
                            appointment.getAppointmentVaccines().add(appointmentVaccine);
                            log.info("Created new AppointmentVaccine for combo vaccine: {}", vaccine.getName());
                        }
                    }
                } catch (Exception e) {
                    log.error("Error creating dose schedule for vaccine: {}, dose: {}: {}", 
                        vaccine.getName(), doseNumber, e.getMessage(), e);
                }
            }
        }
        
        // Save the appointment to persist all the new vaccines and dose schedules
        appointmentRepository.save(appointment);
        log.info("Successfully processed vaccine combo: {} after payment", combo.getComboName());
    }

    // Add a helper method to parse dosage strings
    private int parseDosage(String dosageStr) {
        if (dosageStr == null || dosageStr.trim().isEmpty()) {
            return 1; // Default to 1 if no dosage specified
        }
        
        try {
            // Extract the number from the string using regex
            // Match one or more digits at the start of the string
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("^\\d+");
            java.util.regex.Matcher matcher = pattern.matcher(dosageStr.trim());
            
            if (matcher.find()) {
                return Integer.parseInt(matcher.group());
            } else {
                log.warn("Could not extract number from dosage string: {}, defaulting to 1", dosageStr);
                return 1;
            }
        } catch (Exception e) {
            log.error("Error parsing dosage string: {}, defaulting to 1", dosageStr, e);
            return 1;
        }
    }

    // Add this method to retrieve an appointment by ID
    public java.util.Optional<Appointment> findById(Long appointmentId) {
        return appointmentRepository.findById(appointmentId);
    }

    // Add method to save an appointment
    @Transactional
    public Appointment saveAppointment(Appointment appointment) {
        if (appointment == null) {
            log.error("Cannot save null appointment");
            throw new IllegalArgumentException("Appointment cannot be null");
        }
        log.info("Saving appointment ID: {}", appointment.getId());
        return appointmentRepository.save(appointment);
    }

    // Add method to handle successful payment processing
    @Transactional
    public void processSuccessfulPayment(Appointment appointment) {
        if (appointment == null) {
            log.error("Cannot process payment for null appointment");
            return;
        }
        
        log.info("Processing successful payment for appointment ID: {}", appointment.getId());
        
        // Set appointment as paid
        appointment.setStatus(AppointmentStatus.PAID);
        appointment.setPaid(true);
        appointmentRepository.save(appointment);
        
        // Process appointment vaccines and create records for each
        if (appointment.getAppointmentVaccines() != null) {
            for (AppointmentVaccine appointmentVaccine : appointment.getAppointmentVaccines()) {
                try {
                    // Mark the dose schedule as paid
                    if (appointmentVaccine.getDoseSchedule() != null) {
                        DoseSchedule doseSchedule = appointmentVaccine.getDoseSchedule();
                        doseSchedule.setIsPaid(true);
                        doseScheduleRepository.save(doseSchedule);
                        log.info("Marked DoseSchedule as paid: {}", doseSchedule.getId());
                    }
                    
                    // Update vaccination status
                    appointmentVaccine.setStatus(String.valueOf(VaccinationStatus.PENDING));
                    // We don't have an AppointmentVaccineRepository, so we'll save through the appointment
                    appointmentRepository.save(appointment);
                    log.info("Updated AppointmentVaccine status: {}", appointmentVaccine.getId());
                } catch (Exception e) {
                    log.error("Error processing vaccine record for appointment: {}", appointment.getId(), e);
                }
            }
        }
        
        log.info("Successfully processed payment for appointment ID: {}", appointment.getId());
    }

    private void processNextDose(Appointment appointment, AppointmentVaccineRequest request) {
        log.info("Processing next dose with ID: {}", request.getDoseScheduleId());
        
        // Validate the request
        if (request.getVaccineOfChildId() == null || request.getDoseScheduleId() == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Missing vaccineOfChildId or doseScheduleId for NEXT_DOSE request");
        }
        
        // Get the VaccineOfChild entity
        VaccineOfChild vaccineOfChild = vaccineOfChildRepository.findById(request.getVaccineOfChildId())
            .orElseThrow(() -> new AppException(ErrorCode.VACCINE_OF_CHILD_NOT_FOUND));
            
        // Get the DoseSchedule entity
        DoseSchedule doseSchedule = doseScheduleRepository.findById(request.getDoseScheduleId())
            .orElseThrow(() -> new AppException(ErrorCode.DOSE_SCHEDULE_NOT_FOUND));
        
        log.info("Found VaccineOfChild with ID: {} and DoseSchedule with ID: {}", 
            vaccineOfChild.getId(), doseSchedule.getId());
        
        // Create AppointmentVaccine record with doseSchedule properly set
        AppointmentVaccine appointmentVaccine = AppointmentVaccine.builder()
            .appointment(appointment)
            .vaccineOfChild(vaccineOfChild)
            .doseSchedule(doseSchedule)  // Set the dose schedule
            .doseNumber(doseSchedule.getDoseNumber())
            .vaccine(vaccineOfChild.getVaccine())  // Include the vaccine for reference
            .status(VaccinationStatus.PENDING)
            .build();
        
        appointment.getAppointmentVaccines().add(appointmentVaccine);
        log.info("Added next dose to appointment: {}, doseNumber: {}", 
            vaccineOfChild.getVaccine().getName(), doseSchedule.getDoseNumber());
    }

    // Helper method to calculate the scheduled date for a dose
    private LocalDateTime calculateDoseScheduledDate(Vaccine vaccine, int doseNumber) {
        // For first dose, we don't need to calculate anything
        if (doseNumber == 1) {
            return LocalDateTime.now();
        }
        
        // For subsequent doses, try to get the interval from the repository
        DoseInterval interval = doseIntervalRepository.findByVaccineAndFromDose(vaccine, doseNumber - 1);
        
        if (interval == null) {
            log.warn("No dose interval found for vaccine: {} and dose: {}, using default 28 days", 
                    vaccine.getName(), doseNumber);
            // Default to 28 days if no interval is found
            return LocalDateTime.now().plusDays(28);
        }
        
        // Calculate the scheduled date based on the interval
        return LocalDateTime.now().plusDays(interval.getIntervalDays());
    }

    /**
     * Find all appointments for a specific child
     * @param child The child entity to find appointments for
     * @return List of appointments for the child
     */
    public List<Appointment> findByChild(Child child) {
        log.info("Finding appointments for child: {}", child.getChild_id());
        return appointmentRepository.findByChild(child);
    }
} 