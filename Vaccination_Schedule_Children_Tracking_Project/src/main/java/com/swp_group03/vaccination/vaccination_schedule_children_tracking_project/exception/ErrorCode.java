package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // System errors (9xxx)
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized exception"),
    INVALID_DATA_ACCESS_RESOURCE_USAGE(9998, "Invalid data access resource usage (SQL syntax, table not exist, etc)"),
    SYSTEM_ERROR(9997, "System error occurred"),
    INTERNAL_SERVER_ERROR(9996, "Internal server error"),

    // Common errors (1xxx)
    USER_NOT_FOUND(1001, "User not found"),
    USER_ALREADY_EXIST(1002, "User already exist"),
    USERNAME_NOT_EXIT(1003, "Username does not exist"),
    EMPTY_USER(1004, "Empty user"),
    MAPPING_ERROR(1005, "Error mapping data between entities"),
    COMBO_NOT_FOUND(1006, "Vaccine combo not found"),
    COMBO_NAME_EXISTS(1007, "Vaccine combo name already exists"),
    CATEGORY_NOT_FOUND(1008, "Category not found"),
    CATEGORY_NAME_EXISTS(1009, "Category name already exists"),
    VACCINE_NOT_FOUND(1010, "Vaccine not found"),
    INTERVAL_NOT_FOUND(1011, "Interval not found"),
    INTERVAL_OVERLAP(1012, "Interval overlaps with existing interval"),
    INVALID_DOSE_RANGE(1013, "From dose cannot be greater than to dose"),
    INTERVAL_VACCINE_MISMATCH(1014, "Interval does not belong to the specified vaccine"),
    INVALID_REQUEST(1015, "Invalid request"),
    USERNAME_ALREADY_EXISTS(1016, "Username already exists"),
    EMAIL_ALREADY_EXISTS(1017, "Email already exists"),
    INVALID_EMAIL(1018, "Invalid email address"),
    INVALID_PASSWORD(1019, "Invalid password"),
    INVALID_TOKEN(1020, "Invalid token"),
    FORBIDDEN(1021, "Access forbidden"),
    NOT_FOUND(1022, "Resource not found"),

    // Authentication errors (2xxx)
    INVALID_KEY(2000, "Invalid message key"),
    INVALID_REQUEST_DATA(2001, "Invalid or missing request data"),
    USERNAME_INVALID(2002, "Username must be between 3 and 16 characters"),
    PASSWORD_INVALID(2003, "Password must be between 3 and 16 characters"),
    UNAUTHENTICATED(2004, "Invalid Username or Password"),
    EMAIL_ALREADY_VERIFIED(2005, "Email has already been verified"),
    VERIFICATION_CODE_EXPIRED(2006, "Verification code has expired"),
    INVALID_VERIFICATION_CODE(2007, "Invalid verification code"),
    EMAIL_NOT_VERIFIED(2008, "Email not verified. Please verify your email before logging in"),
    UNAUTHORIZED(2009, "Unauthorized"),
    INVALID_CREDENTIALS(2010, "Invalid credentials"),
    TOKEN_EXPIRED(2011, "Token expired"),

    // Validation errors (4xxx)
    INVALID_ROLE(4000, "Invalid role"),
    INVALID_USERNAME(4001, "Invalid username"),
    INVALID_PHONE(4002, "Invalid phone number"),
    INVALID_ADDRESS(4003, "Invalid address"),
    INVALID_NAME(4004, "Invalid name"),
    INVALID_GENDER(4005, "Invalid gender"),
    INVALID_DATE(4006, "Invalid date"),
    INVALID_VACCINE_TYPE(4001, "Invalid vaccine type"),

    // Schedule errors (3xxx)
    SHIFT_NOT_FOUND(3000, "Shift not found"),
    SHIFT_NAME_EXISTS(3001, "Shift name already exists"),
    INVALID_TIME_RANGE(3002, "End time must be after start time"),
    SCHEDULE_NOT_FOUND(3003, "Schedule not found"),
    INVALID_SCHEDULE_REQUEST(3004, "Invalid schedule request"),
    SCHEDULE_OVERLAP(3005, "Schedule overlaps with existing schedule"),
    INVALID_SHIFT_CHANGE_REQUEST(3006, "Invalid shift change request"),
    SHIFT_CHANGE_REQUEST_NOT_FOUND(3007, "Shift change request not found"),
    UNAUTHORIZED_REQUEST(3008, "Unauthorized to perform this request"),
    REQUEST_TOO_LATE(3009, "Request submitted too late"),
    ROLE_MISMATCH(3010, "Employee roles do not match"),
    TARGET_NOT_APPROVED(3011, "Target employee has not approved the request"),
    REQUEST_NOT_FOUND(3012, "Shift change request not found"),
    SCHEDULE_IN_PAST(3013, "Cannot modify past schedules"),
    REQUEST_ALREADY_PROCESSED(3014, "Request has already been processed"),
    SHIFT_CHANGE_REQUEST_NOT_ALLOWED(3015, "Shift change request is not allowed for this schedule"),
    PATTERN_NOT_FOUND(3016, "Pattern not found"),
    SCHEDULE_CREATION_FAILED(3017, "Failed to create schedule"),
    NO_AVAILABLE_SCHEDULE(3018, "No available schedule found"),
    DOCTOR_NOT_AVAILABLE(3019, "Doctor is not available"),
    TIME_SLOT_FULL(3020, "Time slot is full"),

    // Child related errors (5xxx)
    CHILD_NOT_FOUND(5000, "Child not found"),
    CHILD_ALREADY_EXISTS(5001, "Child already exists"),

    // Vaccine related errors (6xxx)
    VACCINE_OF_CHILD_NOT_FOUND(6000, "Vaccine of child not found"),
    VACCINE_ALREADY_EXISTS(6001, "Vaccine already exists"),

    // Appointment related errors (7xxx)
    APPOINTMENT_NOT_FOUND(7000, "Appointment not found"),
    APPOINTMENT_ALREADY_EXISTS(7001, "Appointment already exists"),

    // Dose related errors (8xxx)
    DOSE_SCHEDULE_NOT_FOUND(8000, "Dose schedule not found"),
    DOSE_ALREADY_SCHEDULED(8001, "Dose already scheduled"),
    INVALID_DOSE_NUMBER(8002, "Invalid dose number"),

    // Payment related errors (10xxx)
    PAYMENT_FAILED(10000, "Payment failed"),
    PAYMENT_ALREADY_PROCESSED(10001, "Payment already processed"),
    INVALID_PAYMENT_METHOD(10002, "Invalid payment method"), INVALID_APPOINTMENT_VACCINE_REQUEST(10003, "Invalid appointment vaccine request" );

    private final int code;
    private final String message;
}
