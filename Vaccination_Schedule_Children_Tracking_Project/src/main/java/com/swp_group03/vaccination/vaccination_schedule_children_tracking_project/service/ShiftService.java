package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Shift;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.request.schedule.ShiftRequest;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.ShiftRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional
public class ShiftService {
    
    @Autowired
    private ShiftRepository shiftRepository;
    
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    
    public Shift createShift(ShiftRequest request) {
        // Check if shift name already exists
        if (shiftRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.SHIFT_NAME_EXISTS);
        }
        
        // Parse and validate time
        LocalTime startTime = LocalTime.parse(request.getStartTime(), TIME_FORMATTER);
        LocalTime endTime = LocalTime.parse(request.getEndTime(), TIME_FORMATTER);
        
        if (endTime.isBefore(startTime)) {
            throw new AppException(ErrorCode.INVALID_TIME_RANGE);
        }
        
        Shift shift = Shift.builder()
                .name(request.getName())
                .startTime(startTime)
                .endTime(endTime)
                .status(request.getStatus())
                .build();
        
        return shiftRepository.save(shift);
    }
    
    public Shift updateShift(Long id, ShiftRequest request) {
        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SHIFT_NOT_FOUND));
        
        // Check if new name conflicts with existing shifts
        if (!shift.getName().equals(request.getName()) && 
            shiftRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.SHIFT_NAME_EXISTS);
        }
        
        // Parse and validate time
        LocalTime startTime = LocalTime.parse(request.getStartTime(), TIME_FORMATTER);
        LocalTime endTime = LocalTime.parse(request.getEndTime(), TIME_FORMATTER);
        
        if (endTime.isBefore(startTime)) {
            throw new AppException(ErrorCode.INVALID_TIME_RANGE);
        }
        
        shift.setName(request.getName());
        shift.setStartTime(startTime);
        shift.setEndTime(endTime);
        shift.setStatus(request.getStatus());
        
        return shiftRepository.save(shift);
    }
    
    public Page<Shift> getAllShifts(Pageable pageable) {
        return shiftRepository.findByStatusTrue(pageable);
    }
    
    public List<Shift> getAllShifts() {
        return shiftRepository.findAll();
    }
    
    public Shift getShiftById(Long id) {
        return shiftRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SHIFT_NOT_FOUND));
    }
    
    public void deleteShift(Long id) {
        Shift shift = shiftRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.SHIFT_NOT_FOUND));
        shiftRepository.delete(shift);
    }
} 