package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.mapper;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Account;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Shift;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.ShiftChangeRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.WorkSchedule;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.EmployeeInfo;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.ShiftChangeRequestResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.ShiftResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response.schedule.WorkScheduleResponse;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service.WorkScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class ScheduleMapper {
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    @Autowired
    private WorkScheduleService workScheduleService;

    public EmployeeInfo toEmployeeInfo(Account account) {
        return EmployeeInfo.builder()
                .id(account.getAccountId())
                .fullName(account.getFirstName() + " " + account.getLastName())
                .email(account.getEmail())
                .roles(account.getRoles().stream()
                        .map(role -> role.getRole_Name())
                        .collect(Collectors.toList()))
                .build();
    }

    public ShiftResponse toShiftResponse(Shift shift) {
        return ShiftResponse.builder()
                .id(shift.getId())
                .name(shift.getName())
                .startTime(shift.getStartTime().format(TIME_FORMATTER))
                .endTime(shift.getEndTime().format(TIME_FORMATTER))
                .status(shift.isStatus())
                .build();
    }

    public WorkScheduleResponse toWorkScheduleResponse(WorkSchedule schedule) {
        List<Account> sameRoleEmployees = workScheduleService.findEmployeesWithSameRoleAndShift(
            schedule.getWorkDate(),
            schedule.getShift().getId(),
            schedule.getEmployee().getRoles()
        );
        return toWorkScheduleResponse(schedule, sameRoleEmployees);
    }

    public WorkScheduleResponse toWorkScheduleResponse(WorkSchedule schedule, List<Account> sameRoleEmployees) {
        return WorkScheduleResponse.builder()
                .id(String.valueOf(schedule.getId()))
                .employee(toEmployeeInfo(schedule.getEmployee()))
                .shift(toShiftResponse(schedule.getShift()))
                .workDate(schedule.getWorkDate())
                .isPatternGenerated(schedule.getSourcePattern() != null)
                .weekNumber(schedule.getWeekNumber())
                .dayOfWeek(schedule.getDayOfWeek())
                .sameRoleEmployees(sameRoleEmployees.stream()
                        .map(this::toEmployeeInfo)
                        .collect(Collectors.toList()))
                .build();
    }

    public ShiftChangeRequestResponse toShiftChangeRequestResponse(ShiftChangeRequest request) {
        return ShiftChangeRequestResponse.builder()
                .id(String.valueOf(request.getId()))
                .requester(toEmployeeInfo(request.getRequester()))
                .target(toEmployeeInfo(request.getTarget()))
                .originalSchedule(toWorkScheduleResponse(request.getOriginalSchedule(), List.of()))
                .targetSchedule(toWorkScheduleResponse(request.getTargetSchedule(), List.of()))
                .status(request.getStatus())
                .adminStatus(request.getAdminStatus())
                .targetStatus(request.getTargetStatus())
                .requestTime(request.getRequestTime())
                .adminResponseTime(request.getAdminResponseTime())
                .targetResponseTime(request.getTargetResponseTime())
                .reason(request.getReason())
                .adminResponseMessage(request.getAdminResponseMessage())
                .targetResponseMessage(request.getTargetResponseMessage())
                .build();
    }

    public List<WorkScheduleResponse> toWorkScheduleResponseList(List<WorkSchedule> schedules) {
        return schedules.stream()
            .map(this::toWorkScheduleResponse)
            .collect(Collectors.toList());
    }

    public List<ShiftChangeRequestResponse> toShiftChangeRequestResponseList(List<ShiftChangeRequest> requests) {
        return requests.stream()
            .map(this::toShiftChangeRequestResponse)
            .collect(Collectors.toList());
    }
} 