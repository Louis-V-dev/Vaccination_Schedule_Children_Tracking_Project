package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception;

public class AppException extends RuntimeException {

    private final ErrorCode errorCode;
    private String email;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public AppException(ErrorCode errorCode, String email) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.email = email;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public String getEmail() {
        return email;
    }
}
