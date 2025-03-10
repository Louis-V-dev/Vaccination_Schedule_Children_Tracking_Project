package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception;

public enum ErrorCode {
    //NƠI TA DEFIND CÁC LOẠI ERROR_CODE DỰA THEO CÁC ERROR_MESSAGE ĐỂ TRẢ VỀ CLIENT RÕ RÀNG VỀ LOẠI LỖI MUỐN TRẢ

    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized exception"),
    INVALID_DATA_ACCESS_RESOURCE_USAGE(9998, "Invalid data access resource usage (SQL syntax, table not exist, etc)"),

    //Check-Output
    USER_NOT_FOUND(1001, "User not found"),
    USER_ALREADY_EXIST(1002, "User already exist"),
    USERNAME_NOT_EXIT(1003, "UserName not exist"),
    EMPTY_USER(1004, "Empty user"),
    MAPPING_ERROR(1005, "Error mapping data between entities"),
    COMBO_NOT_FOUND(1006, "Vaccine combo not found"),
    COMBO_NAME_EXISTS(1007, "Vaccine combo name already exists"),
    CATEGORY_NOT_FOUND(1008, "Category not found"),
    CATEGORY_NAME_EXISTS(1009, "Category name already exists"),
    
    // Dose Interval errors
    VACCINE_NOT_FOUND(1010, "Vaccine not found"),
    INTERVAL_NOT_FOUND(1011, "Interval not found"),
    INTERVAL_OVERLAP(1012, "Interval overlaps with existing interval"),
    INVALID_DOSE_RANGE(1013, "From dose cannot be greater than to dose"),
    INTERVAL_VACCINE_MISMATCH(1014, "Interval does not belong to the specified vaccine"),

    //Check-Input
    INVALID_KEY(2000, "Invalid message key"),
    INVALID_REQUEST(2001, "Invalid or missing request data"),
    USERNAME_INVALID(2002, "Username must be between 3 and 16 characters"),
    PASSWORD_INVALID(2003, "Password must be between 3 and 16 characters"),
    UNAUTHENTICATED(2004, "Invalid Username or Password"),

    // Email verification error codes
    EMAIL_ALREADY_VERIFIED(2005, "Email has already been verified"),
    VERIFICATION_CODE_EXPIRED(2006, "Verification code has expired"),
    INVALID_VERIFICATION_CODE(2007, "Invalid verification code"),
    EMAIL_NOT_VERIFIED(2008, "Email not verified. Please verify your email before logging in"),

    UNAUTHORIZED(401, "Unauthorized"),
    USERNAME_ALREADY_EXISTS(409, "Username already exists"),
    EMAIL_ALREADY_EXISTS(409, "Email address already exists"),

    INVALID_ROLE(400, "Invalid role"),
    INVALID_TOKEN(401, "Invalid token"),
    TOKEN_EXPIRED(401, "Token expired"),
    INVALID_CREDENTIALS(401, "Invalid credentials"),
    INVALID_PASSWORD(400, "Invalid password"),
    INVALID_EMAIL(400, "Invalid email"),
    INVALID_USERNAME(400, "Invalid username"),
    INVALID_PHONE(400, "Invalid phone number"),
    INVALID_ADDRESS(400, "Invalid address"),
    INVALID_NAME(400, "Invalid name"),
    INVALID_GENDER(400, "Invalid gender"),
    INVALID_DATE(400, "Invalid date");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
