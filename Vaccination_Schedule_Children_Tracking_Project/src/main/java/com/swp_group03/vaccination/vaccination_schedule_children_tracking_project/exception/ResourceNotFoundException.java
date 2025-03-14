package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception;

public class ResourceNotFoundException extends AppException {
    
    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(ErrorCode.USER_NOT_FOUND);  // Using a default error code
        String message = String.format("%s not found with %s : '%s'", resourceName, fieldName, fieldValue);
        // You can add additional context to the exception if needed
    }
    
    public ResourceNotFoundException(ErrorCode errorCode) {
        super(errorCode);
    }
    
    public ResourceNotFoundException(String message) {
        super(ErrorCode.USER_NOT_FOUND);  // Using a default error code
        // You can add additional context to the exception if needed
    }
} 