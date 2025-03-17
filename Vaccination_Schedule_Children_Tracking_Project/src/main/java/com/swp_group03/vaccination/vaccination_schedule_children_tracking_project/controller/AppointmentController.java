package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.controller;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.*;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.appointment.*;
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
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Arrays;
import java.util.stream.Collectors;

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

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Appointment> createAppointment(@RequestBody CreateAppointmentRequest request) {
        return ResponseEntity.ok(appointmentService.createAppointment(request));
    }

    @GetMapping("/child/{childId}/vaccines")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VaccineDataResponse> getAvailableVaccines(@PathVariable String childId) {
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

        // Get upcoming doses
        List<DoseScheduleDTO> upcomingDoses = doseScheduleRepository.findUpcomingDosesByChildId(childId).stream()
            .map(ds -> DoseScheduleDTO.builder()
                .id(ds.getId())
                .vaccineOfChild(VaccineOfChildDTO.builder()
                    .id(ds.getVaccineOfChild().getId())
                    .vaccine(VaccineDTO.builder()
                        .id(ds.getVaccineOfChild().getVaccine().getId())
                        .name(ds.getVaccineOfChild().getVaccine().getName())
                        .description(ds.getVaccineOfChild().getVaccine().getDescription())
                        .manufacturer(ds.getVaccineOfChild().getVaccine().getManufacturer())
                        .dosage(ds.getVaccineOfChild().getVaccine().getDosage())
                        .price(ds.getVaccineOfChild().getVaccine().getPrice())
                        .build())
                    .totalDoses(ds.getVaccineOfChild().getTotalDoses())
                    .currentDose(ds.getVaccineOfChild().getCurrentDose())
                    .isCompleted(ds.getVaccineOfChild().getIsCompleted())
                    .isFromCombo(ds.getVaccineOfChild().getIsFromCombo())
                    .build())
                .doseNumber(ds.getDoseNumber())
                .status(ds.getStatus().toString())
                .scheduledDate(ds.getScheduledDate() != null ? ds.getScheduledDate().toString() : null)
                .build())
            .collect(Collectors.toList());

        return ResponseEntity.ok(VaccineDataResponse.builder()
            .availableVaccines(availableVaccines)
            .existingVaccines(existingVaccines)
            .upcomingDoses(upcomingDoses)
            .build());
    }

    @GetMapping("/available-slots")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getAvailableSlots(
            @RequestParam(required = false) String doctorId,
            @RequestParam LocalDate date) {
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
            Map<String, List<String>> availableSlots = new HashMap<>();
            for (WorkSchedule schedule : schedules) {
                List<String> slots = getAvailableTimeSlots(schedule);
                if (!slots.isEmpty()) {
                    String doctorName = schedule.getEmployee().getFullName();
                    availableSlots.put(doctorName, slots);
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
        List<String> allSlots = Arrays.asList(
            "8-9", "9-10", "10-11", "11-12", "13-14", "14-15", "15-16", "16-17"
        );

        return allSlots.stream()
            .filter(slot -> isTimeSlotAvailable(schedule, slot))
            .collect(Collectors.toList());
    }

    private boolean isTimeSlotAvailable(WorkSchedule schedule, String timeSlot) {
        int currentAppointments = appointmentService.countActiveAppointmentsInTimeSlot(schedule, timeSlot);
        return currentAppointments < 5; // Maximum 5 appointments per slot
    }
} 