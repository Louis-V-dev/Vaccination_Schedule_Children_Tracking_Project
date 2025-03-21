package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.dto.MomoPaymentRequestDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.dto.MomoPaymentResponseDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Appointment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.AppointmentVaccine;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.DoseSchedule;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.AppointmentStatus;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Payment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PaymentMethod;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PaymentStatus;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.AppException;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.exception.ErrorCode;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.AppointmentRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.DoseScheduleRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.PaymentMethodRepository;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Formatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@SuppressWarnings("unchecked")
public class MomoPaymentService {

    @Value("${momo.partner.code}")
    private String partnerCode;

    @Value("${momo.access.key}")
    private String accessKey;

    @Value("${momo.secret.key}")
    private String secretKey;

    @Value("${momo.api.endpoint}")
    private String apiEndpoint;

    @Value("${momo.return.url:#{null}}")
    private String returnUrl;

    @Value("${momo.notify.url}")
    private String notifyUrl;

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private DoseScheduleRepository doseScheduleRepository;

    @Autowired
    private AppointmentService appointmentService;

    /**
     * Create a MoMo payment request
     * @param request Payment request DTO
     * @return MoMo payment response DTO
     */
    public MomoPaymentResponseDTO createPayment(MomoPaymentRequestDTO request) {
        try {
            // Get appointment ID from request
            Long appointmentId = request.getAppointmentId();
            if (appointmentId == null) {
                throw new IllegalArgumentException("Appointment ID is required");
            }
            
            // Find appointment
            Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
            
            // Create order info
            String orderId = partnerCode + System.currentTimeMillis();
            String requestId = orderId;
            // Use order info from request or create default
            String orderInfo = request.getOrderInfo() != null ? request.getOrderInfo() 
                              : "Payment for appointment #" + appointmentId;
            
            // Use URLs from request or fallback to configured values
            // If returnUrl is null or empty, use the returnUrl from the request
            String redirectUrl = request.getReturnUrl();
            // Only fallback to the injected returnUrl if it's not null or empty and the request doesn't provide one
            if ((redirectUrl == null || redirectUrl.isEmpty()) && returnUrl != null && !returnUrl.isEmpty()) {
                redirectUrl = returnUrl;
            }
            // If still null, use a default value
            if (redirectUrl == null || redirectUrl.isEmpty()) {
                redirectUrl = "http://localhost:3000/appointment-creation";
            }
            
            String ipnUrl = request.getNotifyUrl() != null ? request.getNotifyUrl() : notifyUrl;
            
            // Use extraData from request or default to appointmentId
            String extraData = request.getExtraData() != null ? request.getExtraData()
                              : String.valueOf(appointmentId);
            
            // Amount in VND
            long amount = request.getAmount().longValue();
            
            // Update the rawSignature creation to use the validated requestType
            String requestType = validateAndGetRequestType(request);

            // Create raw signature string
            String rawSignature = "accessKey=" + accessKey +
                                  "&amount=" + amount +
                                  "&extraData=" + extraData +
                                  "&ipnUrl=" + ipnUrl +
                                  "&orderId=" + orderId +
                                  "&orderInfo=" + orderInfo +
                                  "&partnerCode=" + partnerCode +
                                  "&redirectUrl=" + redirectUrl +
                                  "&requestId=" + requestId +
                                  "&requestType=" + requestType;
            
            // Create signature
            String signature = createSignature(rawSignature, secretKey);
            
            // Create request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("partnerCode", partnerCode);
            requestBody.put("partnerName", "Vaccination System");
            requestBody.put("storeId", partnerCode);
            requestBody.put("requestId", requestId);
            requestBody.put("amount", amount);
            requestBody.put("orderId", orderId);
            requestBody.put("orderInfo", orderInfo);
            requestBody.put("redirectUrl", redirectUrl);
            requestBody.put("ipnUrl", ipnUrl);
            requestBody.put("lang", "vi");
            requestBody.put("extraData", extraData);
            requestBody.put("requestType", requestType);
            requestBody.put("signature", signature);
            
            // Convert request body to JSON
            String requestBodyJson = objectMapper.writeValueAsString(requestBody);
            
            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Send request to MoMo API
            ResponseEntity<Map> response = restTemplate.postForEntity(
                apiEndpoint + "/v2/gateway/api/create",
                new HttpEntity<>(requestBodyJson, headers),
                Map.class
            );
            
            // Get response body
            Map<String, Object> responseBody = response.getBody();
            
            // Check if payment request was created successfully
            if (responseBody != null && responseBody.containsKey("payUrl")) {
                // Create payment record
                Payment payment = Payment.builder()
                    .user(appointment.getChild().getAccount_Id())
                    .amount(BigDecimal.valueOf(amount))
                    .totalAmount(BigDecimal.valueOf(amount))
                    .status(PaymentStatus.PENDING)
                    .transactionId(orderId)
                    .build();
                
                // Get payment method
                Optional<PaymentMethod> paymentMethod = paymentMethodRepository.findByCode("MOMO");
                if (paymentMethod.isPresent()) {
                    payment.setPaymentMethod(paymentMethod.get());
                }
                
                // Set expiration date (30 minutes from now)
                payment.setExpirationDate(LocalDateTime.now().plusMinutes(30));
                
                // Save payment and link to appointment
                payment = paymentRepository.save(payment);
                
                // Update appointment with payment
                // appointment.setPayment(payment); // Uncomment when the setPayment method is implemented in Appointment class
                appointmentRepository.save(appointment);
                
                // Update appointment
                appointment.setStatus(AppointmentStatus.PAID);
                appointment.setPaid(true);
                
                // Create response DTO
                MomoPaymentResponseDTO responseDTO = new MomoPaymentResponseDTO();
                responseDTO.setPaymentUrl((String) responseBody.get("payUrl"));
                responseDTO.setTransactionId(orderId);
                responseDTO.setAmountDecimal(BigDecimal.valueOf(amount));
                
                return responseDTO;
            } else {
                // Handle error
                String message = "Unknown error";
                if (responseBody != null && responseBody.containsKey("message")) {
                    message = responseBody.get("message").toString();
                }
                throw new RuntimeException("Error creating MoMo payment: " + message);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error creating MoMo payment: " + e.getMessage(), e);
        }
    }
    
    /**
     * Check payment status with MoMo API
     * @param orderId Order ID to check
     * @return Status response from MoMo
     */
    public Map<String, Object> checkPaymentStatus(String orderId) {
        try {
            // Log the request for debugging
            System.out.println("Checking payment status for orderId: " + orderId);
            
            // Find payment in database
            Optional<Payment> paymentOpt = paymentRepository.findByTransactionId(orderId);
            
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                System.out.println("Found payment in database with status: " + payment.getStatus());
                
                // If payment is already completed or failed, return current status
                if (payment.getStatus() != PaymentStatus.PENDING && 
                    payment.getStatus() != PaymentStatus.PROCESSING) {
                    Map<String, Object> status = new HashMap<>();
                    status.put("orderId", orderId);
                    status.put("status", payment.getStatus().toString());
                    status.put("message", getMessageForStatus(payment.getStatus()));
                    return status;
                }
            } else {
                System.out.println("Payment not found in database for orderId: " + orderId);
            }
            
            // Generate requestId
            String requestId = partnerCode + System.currentTimeMillis();
            
            // Create raw signature string - THIS IS THE KEY FIX
            // Make sure parameters are in alphabetical order by key name
            String rawSignature = "accessKey=" + accessKey +
                                 "&orderId=" + orderId +
                                 "&partnerCode=" + partnerCode +
                                 "&requestId=" + requestId;
            
            // Create signature
            String signature = createSignature(rawSignature, secretKey);
            
            // Create request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("partnerCode", partnerCode);
            requestBody.put("requestId", requestId);
            requestBody.put("orderId", orderId);
            requestBody.put("lang", "vi");
            requestBody.put("signature", signature);
            
            // Log request details for debugging
            System.out.println("Sending request to MoMo API with: " + requestBody);
            
            // Convert request body to JSON
            String requestBodyJson = objectMapper.writeValueAsString(requestBody);
            
            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            try {
                // Send request to MoMo API
                @SuppressWarnings("unchecked")
                ResponseEntity<Map> response = restTemplate.postForEntity(
                    apiEndpoint + "/v2/gateway/api/query",
                    new HttpEntity<>(requestBodyJson, headers),
                    Map.class
                );
                
                Map<String, Object> responseBody = response.getBody();
                System.out.println("Received response from MoMo API: " + responseBody);
                
                // Update payment status in database
                if (responseBody != null && paymentOpt.isPresent()) {
                    Payment payment = paymentOpt.get();
                    
                    // Handle different types of resultCode
                    Object resultCodeObj = responseBody.get("resultCode");
                    int resultCode;
                    
                    if (resultCodeObj instanceof Integer) {
                        resultCode = (Integer) resultCodeObj;
                    } else if (resultCodeObj instanceof String) {
                        // Try to parse the string as an integer
                        try {
                            resultCode = Integer.parseInt((String) resultCodeObj);
                        } catch (NumberFormatException e) {
                            System.err.println("Invalid resultCode format in response: " + resultCodeObj);
                            // Use a default error code
                            resultCode = 9999;
                        }
                    } else if (resultCodeObj == null) {
                        System.err.println("Missing resultCode in response");
                        // Use a default error code
                        resultCode = 9999;
                    } else {
                        System.err.println("Unexpected resultCode type: " + resultCodeObj.getClass().getName());
                        // Use a default error code
                        resultCode = 9999;
                    }
                    
                    if (resultCode == 0) {
                        // Payment successful
                        String extraData = (String) responseBody.get("extraData");
                        payment.setStatus(PaymentStatus.COMPLETED);
                        payment.setPaymentDate(LocalDateTime.now());
                        payment.setGatewayTransactionId((String) responseBody.get("transId"));
                        
                        // Mark associated appointment and doses as paid
                        markAppointmentAndDosesAsPaid(payment);
                    } else if (resultCode == 1006 || resultCode == 1005) {
                        // Payment pending
                        payment.setStatus(PaymentStatus.PROCESSING);
                    } else if (resultCode == 1003) {
                        // Payment cancelled by user
                        payment.setStatus(PaymentStatus.CANCELLED);
                    } else {
                        // Payment failed
                        payment.setStatus(PaymentStatus.FAILED);
                    }
                    
                    // Save updated payment
                    paymentRepository.save(payment);
                }
                
                return responseBody;
            } catch (Exception e) {
                System.err.println("Error calling MoMo API: " + e.getMessage());
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("orderId", orderId);
                errorResponse.put("resultCode", 9999);
                errorResponse.put("message", "Error calling MoMo API: " + e.getMessage());
                return errorResponse;
            }
        } catch (Exception e) {
            System.err.println("Error checking MoMo payment status: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("orderId", orderId);
            errorResponse.put("resultCode", 9999);
            errorResponse.put("message", "Error checking payment status: " + e.getMessage());
            return errorResponse;
        }
    }
    
    /**
     * Process IPN (Instant Payment Notification) callback from MoMo
     * @param callbackData The callback data from MoMo
     */
    public void processIpnCallback(Map<String, Object> callbackData) {
        try {
            // Log the callback data for debugging
            System.out.println("Received IPN callback: " + callbackData);
            
            // Extract data from the callback
            String orderId = (String) callbackData.get("orderId");
            String requestId = (String) callbackData.get("requestId");
            String amount = callbackData.get("amount").toString();
            String resultCode = callbackData.get("resultCode").toString();
            String message = (String) callbackData.get("message");
            String extraData = (String) callbackData.get("extraData");
            
            // Verify signature to ensure the callback is from MoMo
            // ... Code to verify signature
            
            // Get payment from database
            Optional<Payment> paymentOpt = paymentRepository.findByTransactionId(orderId);
            if (paymentOpt.isEmpty()) {
                System.out.println("Payment not found for orderId: " + orderId);
                return;
            }
            
            Payment payment = paymentOpt.get();
            
            // Update payment status based on result code
            if ("0".equals(resultCode)) {
                // Payment successful
                payment.setStatus(PaymentStatus.COMPLETED);
                
                // Parse appointmentId from extraData
                Long appointmentId = null;
                try {
                    appointmentId = Long.parseLong(extraData);
                } catch (NumberFormatException e) {
                    System.err.println("Failed to parse appointmentId from extraData: " + extraData);
                }
                
                if (appointmentId != null) {
                    // Find appointment by ID
                    Optional<Appointment> appointmentOpt = appointmentRepository.findById(appointmentId);
                    if (appointmentOpt.isPresent()) {
                        Appointment appointment = appointmentOpt.get();
                        appointment.setStatus(AppointmentStatus.PAID);
                        appointment.setPaid(true);
                        appointmentRepository.save(appointment);
                        
                        // Create VaccineOfChild and DoseSchedule records if needed
                        appointmentService.processSuccessfulPayment(appointment);
                    } else {
                        System.err.println("Appointment not found with ID: " + appointmentId);
                    }
                }
            } else {
                // Payment failed
                payment.setStatus(PaymentStatus.FAILED);
                payment.setNotes("MoMo result code: " + resultCode + " - " + message);
            }
            
            // Save updated payment
            paymentRepository.save(payment);
            
            System.out.println("IPN processing completed for orderId: " + orderId);
        } catch (Exception e) {
            System.err.println("Error processing IPN callback: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Mark an appointment and its first dose schedules as paid when payment is completed
     * @param payment The completed payment
     */
    private void markAppointmentAndDosesAsPaid(Payment payment) {
        try {
            // Get appointment ID from payment extraData or other source
            String extraData = payment.getTransactionId().split("-")[1];
            Long appointmentId = null;
            
            try {
                appointmentId = Long.parseLong(extraData);
            } catch (NumberFormatException e) {
                System.err.println("Failed to parse appointmentId from extraData: " + extraData);
                return;
            }
            
            // Find the appointment by ID
            Optional<Appointment> appointmentOpt = appointmentRepository.findById(appointmentId);
            if (appointmentOpt.isEmpty()) {
                System.err.println("Appointment not found with ID: " + appointmentId);
                return;
            }
            
            Appointment appointment = appointmentOpt.get();
            
            // Mark appointment as paid
            appointment.setPaid(true);
            appointment.setStatus(AppointmentStatus.PAID);
            
            // Process any pending vaccine requests for this appointment
            appointmentService.processVaccinesAfterPayment(appointment.getId());
            
            // The appointment will be saved as part of processVaccinesAfterPayment
        } catch (Exception e) {
            System.err.println("Error marking appointment as paid: " + e.getMessage());
        }
    }
    
    /**
     * Create HMAC SHA256 signature
     * @param data Data to sign
     * @param key Secret key
     * @return Signature
     */
    private String createSignature(String data, String key) throws Exception {
        Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256_HMAC.init(secret_key);
        
        byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hash);
    }
    
    /**
     * Convert bytes to hexadecimal string
     * @param bytes Bytes to convert
     * @return Hexadecimal string
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
    
    /**
     * Get human-readable message for payment status
     * @param status Payment status
     * @return Message
     */
    private String getMessageForStatus(PaymentStatus status) {
        switch (status) {
            case COMPLETED:
                return "Payment completed successfully";
            case PENDING:
                return "Payment is pending";
            case PROCESSING:
                return "Payment is being processed";
            case CANCELLED:
                return "Payment was cancelled";
            case FAILED:
                return "Payment failed";
            case EXPIRED:
                return "Payment expired";
            default:
                return "Unknown payment status";
        }
    }

    // Add this method after validating the payment request
    private String validateAndGetRequestType(MomoPaymentRequestDTO request) {
        // Set default request type if not provided
        if (request.getRequestType() == null || request.getRequestType().isEmpty()) {
            return "captureWallet"; // Default to wallet
        }
        
        // Validate that requestType is one of the supported values
        String requestType = request.getRequestType();
        
        // The valid MoMo request types
        List<String> validRequestTypes = Arrays.asList(
            "captureWallet", // QR code payment
            "payWithATM",    // ATM card payment
            "payWithCC",     // Credit card payment
            "payWithMoMo"    // MoMo app payment
        );
        
        if (!validRequestTypes.contains(requestType)) {
            System.out.println("Invalid request type: " + requestType + ". Using default captureWallet.");
            return "captureWallet"; // Default if not valid
        }
        
        return requestType;
    }
} 