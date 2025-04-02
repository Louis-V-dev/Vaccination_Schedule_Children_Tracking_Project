package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.model.response;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
public class ApiResponse<T> {
    private int code;
    private String message;
    private T result;

    // Main constructor
    public ApiResponse(int code, String message, T result) {
        this.code = code;
        this.message = message;
        this.result = result;
    }

    // Constructor for backwards compatibility
    public ApiResponse(boolean success, String message, T result) {
        this.code = success ? 100 : 500;
        this.message = message;
        this.result = result;
    }

    // Builder pattern static methods
    public static <T> ApiResponseBuilder<T> builder() {
        return new ApiResponseBuilder<>();
    }
    
    public static class ApiResponseBuilder<T> {
        private int code;
        private String message;
        private T result;
        
        ApiResponseBuilder() {
        }
        
        public ApiResponseBuilder<T> code(int code) {
            this.code = code;
            return this;
        }
        
        public ApiResponseBuilder<T> message(String message) {
            this.message = message;
            return this;
        }
        
        public ApiResponseBuilder<T> result(T result) {
            this.result = result;
            return this;
        }
        
        public ApiResponse<T> build() {
            return new ApiResponse<>(code, message, result);
        }
    }

    public static <T> ApiResponse<T> success(T result) {
        return new ApiResponse<>(100, "Success", result);
    }

    public static <T> ApiResponse<T> success() {
        return new ApiResponse<>(100, "Success", null);
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }
    
    // Add a static error method with boolean parameter for compatibility
    public static <T> ApiResponse<T> error(boolean success, String message) {
        return new ApiResponse<>(success ? 100 : 500, message, null);
    }
}
