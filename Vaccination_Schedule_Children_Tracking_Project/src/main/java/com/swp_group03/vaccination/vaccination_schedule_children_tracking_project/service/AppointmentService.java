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

@Service
@RequiredArgsConstructor
public class AppointmentService {
    private final AppointmentRepository appointmentRepository;
    private final ChildRepo childRepo;
    private final WorkScheduleRepository workScheduleRepository;
    private final VaccineOfChildRepository vaccineOfChildRepository;
    private final DoseScheduleRepository doseScheduleRepository;
    private final VaccineRepository vaccineRepository;
    private final DoseIntervalRepository doseIntervalRepository;
    private final UserRepo userRepo;

    @Transactional
    public Appointment createAppointment(CreateAppointmentRequest request) {
        // 1. Validate child
        Child child = childRepo.findById(request.getChildId())
            .orElseThrow(() -> new AppException(ErrorCode.CHILD_NOT_FOUND));

        // 2. Find or validate doctor's schedule
        WorkSchedule workSchedule;
        if (request.getIsDayPriority()) {
            // Find available doctor if day priority
            workSchedule = findAvailableSchedule(request.getAppointmentDate(), request.getTimeSlot());
        } else {
            // Validate specific doctor's availability
            workSchedule = validateDoctorAvailability(request.getDoctorId(), request.getAppointmentDate(), request.getTimeSlot());
        }

        // 3. Validate time slot availability
        validateTimeSlotAvailability(workSchedule, request.getTimeSlot());

        // 4. Create appointment
        Appointment appointment = Appointment.builder()
            .child(child)
            .workSchedule(workSchedule)
            .doctor(workSchedule.getEmployee())
            .appointmentTime(request.getAppointmentDate().atTime(parseTimeSlot(request.getTimeSlot())))
            .timeSlot(request.getTimeSlot())
            .status(AppointmentStatus.PENDING)
            .notes(request.getNotes())
            .isPaid(false)
            .totalAmount(0.0)
            .appointmentVaccines(new ArrayList<>())
            .build();

        // 5. Process vaccines
        processVaccines(appointment, request.getVaccines());

        // 6. Calculate total amount
        calculateTotalAmount(appointment);

        return appointmentRepository.save(appointment);
    }

    private WorkSchedule findAvailableSchedule(LocalDate date, String timeSlot) {
        List<WorkSchedule> schedules = workScheduleRepository.findByWorkDate(date);
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

    private void processVaccines(Appointment appointment, List<AppointmentVaccineRequest> vaccineRequests) {
        if (vaccineRequests == null) return;
        
        for (AppointmentVaccineRequest vaccineRequest : vaccineRequests) {
            if (vaccineRequest.getVaccineId() != null) {
                // New vaccine
                processNewVaccine(appointment, vaccineRequest);
            } else if (vaccineRequest.getVaccineOfChildId() != null) {
                // Existing vaccine
                processExistingVaccine(appointment, vaccineRequest);
            } else if (vaccineRequest.getDoseScheduleId() != null) {
                // Next dose
                processNextDose(appointment, vaccineRequest);
            }
        }
    }

    private void processNewVaccine(Appointment appointment, AppointmentVaccineRequest request) {
        Vaccine vaccine = vaccineRepository.findById(request.getVaccineId())
            .orElseThrow(() -> new AppException(ErrorCode.VACCINE_NOT_FOUND));

        // Create VaccineOfChild
        VaccineOfChild vaccineOfChild = VaccineOfChild.builder()
            .child(appointment.getChild())
            .vaccine(vaccine)
            .totalDoses(vaccine.getDosage() != null ? Integer.parseInt(vaccine.getDosage()) : 1)
            .currentDose(0)
            .isCompleted(false)
            .startDate(LocalDateTime.now())
            .isFromCombo(false)
            .build();

        vaccineOfChild = vaccineOfChildRepository.save(vaccineOfChild);

        // Create dose schedules based on intervals
        List<DoseInterval> intervals = doseIntervalRepository.findByVaccineOrderByFromDoseAsc(vaccine);
        createDoseSchedules(vaccineOfChild, intervals);

        // Create AppointmentVaccine
        createAppointmentVaccine(appointment, vaccineOfChild, request.getDoseNumber());
    }

    private void processExistingVaccine(Appointment appointment, AppointmentVaccineRequest request) {
        VaccineOfChild vaccineOfChild = vaccineOfChildRepository.findById(request.getVaccineOfChildId())
            .orElseThrow(() -> new AppException(ErrorCode.VACCINE_OF_CHILD_NOT_FOUND));

        createAppointmentVaccine(appointment, vaccineOfChild, request.getDoseNumber());
    }

    private void processNextDose(Appointment appointment, AppointmentVaccineRequest request) {
        DoseSchedule doseSchedule = doseScheduleRepository.findById(request.getDoseScheduleId())
            .orElseThrow(() -> new AppException(ErrorCode.DOSE_SCHEDULE_NOT_FOUND));

        AppointmentVaccine appointmentVaccine = AppointmentVaccine.builder()
            .appointment(appointment)
            .vaccineOfChild(doseSchedule.getVaccineOfChild())
            .doseSchedule(doseSchedule)
            .doseNumber(doseSchedule.getDoseNumber())
            .status(VaccinationStatus.PENDING)
            .build();

        appointment.getAppointmentVaccines().add(appointmentVaccine);
    }

    private void createDoseSchedules(VaccineOfChild vaccineOfChild, List<DoseInterval> intervals) {
        for (DoseInterval interval : intervals) {
            DoseSchedule doseSchedule = DoseSchedule.builder()
                .vaccineOfChild(vaccineOfChild)
                .doseNumber(interval.getFromDose())
                .status(DoseStatus.UNSCHEDULED)
                .build();
            doseScheduleRepository.save(doseSchedule);
        }
    }

    private void createAppointmentVaccine(Appointment appointment, VaccineOfChild vaccineOfChild, Integer doseNumber) {
        AppointmentVaccine appointmentVaccine = AppointmentVaccine.builder()
            .appointment(appointment)
            .vaccineOfChild(vaccineOfChild)
            .doseNumber(doseNumber)
            .status(VaccinationStatus.PENDING)
            .build();

        appointment.getAppointmentVaccines().add(appointmentVaccine);
    }

    private void calculateTotalAmount(Appointment appointment) {
        double total = 0.0;
        for (AppointmentVaccine av : appointment.getAppointmentVaccines()) {
            // Skip if vaccine is from a paid combo
            if (!av.getVaccineOfChild().getIsFromCombo()) {
                total += av.getVaccineOfChild().getVaccine().getPrice().doubleValue();
            }
        }
        appointment.setTotalAmount(total);
    }
} 