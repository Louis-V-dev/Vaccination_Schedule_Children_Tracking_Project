package com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.dto.MomoPaymentRequestDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.dto.MomoPaymentResponseDTO;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.Payment;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PaymentMethod;
import com.swp_group03.vaccination.vaccination_schedule_children_tracking_project.entity.PaymentStatus;
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
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Formatter;
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

    @Value("${momo.return.url}")
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

    /**
     * Create a MoMo payment request
     * @param request Payment request details
     * @return MoMo payment response with payment URL
     */
    public MomoPaymentResponseDTO createPayment(MomoPaymentRequestDTO request) {
        try {
            // Generate orderInfo if not provided
            String orderInfo = request.getOrderInfo() != null ? request.getOrderInfo() : "Payment for vaccination services";
            
            // Generate orderId with prefix and timestamp if not provided
            String orderId = request.getOrderId() != null ? request.getOrderId() : 
                             partnerCode + System.currentTimeMillis();
            
            // Generate requestId (same as orderId)
            String requestId = orderId;
            
            // Convert amount to string (required by MoMo)
            String amount = request.getAmount().toString();
            
            // Set extraData if provided or empty
            String extraData = request.getExtraData() != null ? request.getExtraData() : "";
            
            // Use provided return URL or default
            String returnUrl = request.getReturnUrl() != null ? request.getReturnUrl() : this.returnUrl;
            
            // Use provided notify URL or default
            String notifyUrl = request.getNotifyUrl() != null ? request.getNotifyUrl() : this.notifyUrl;
            
            // Get requestType or default to captureWallet
            String requestType = request.getRequestType() != null ? request.getRequestType() : "captureWallet";
            
            // Create raw signature string - ensure parameters are in alphabetical order by key name
            String rawSignature = "accessKey=" + accessKey +
                                  "&amount=" + amount +
                                  "&extraData=" + extraData +
                                  "&ipnUrl=" + notifyUrl +
                                  "&orderId=" + orderId +
                                  "&orderInfo=" + orderInfo +
                                  "&partnerCode=" + partnerCode +
                                  "&redirectUrl=" + returnUrl +
                                  "&requestId=" + requestId +
                                  "&requestType=" + requestType;
            
            // Log raw signature string for debugging
            System.out.println("Raw signature: " + rawSignature);
            
            // Create HMAC SHA256 signature
            String signature = "";
            try {
                Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
                SecretKeySpec secret_key = new SecretKeySpec(secretKey.getBytes(), "HmacSHA256");
                sha256_HMAC.init(secret_key);
                byte[] hash = sha256_HMAC.doFinal(rawSignature.getBytes());
                signature = bytesToHex(hash);
                
                System.out.println("Signature: " + signature);
            } catch (Exception e) {
                System.err.println("Error creating signature: " + e.getMessage());
                throw new RuntimeException("Error creating signature", e);
            }
            
            // Create request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("partnerCode", partnerCode);
            requestBody.put("accessKey", accessKey);
            requestBody.put("requestId", requestId);
            requestBody.put("amount", amount);
            requestBody.put("orderId", orderId);
            requestBody.put("orderInfo", orderInfo);
            requestBody.put("redirectUrl", returnUrl);
            requestBody.put("ipnUrl", notifyUrl);
            requestBody.put("extraData", extraData);
            requestBody.put("requestType", requestType);
            requestBody.put("signature", signature);
            requestBody.put("lang", "en");
            
            // Create HTTP headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Create HTTP entity
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            // Call MoMo API
            String apiUrl = apiEndpoint + "/v2/gateway/api/create";
            System.out.println("Calling MoMo API: " + apiUrl);
            System.out.println("Request body: " + requestBody);
            
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, entity, String.class);
            System.out.println("Raw response: " + response.getBody());
            
            // Parse response
            MomoPaymentResponseDTO responseBody = objectMapper.readValue(response.getBody(), MomoPaymentResponseDTO.class);
            
            System.out.println("MoMo payment response: " + responseBody);
            
            // Log specific QR code URL
            if (responseBody != null) {
                System.out.println("QR Code URL: " + responseBody.getQrCodeUrl());
                System.out.println("Pay URL: " + responseBody.getPayUrl());
            }
            
            // If successfully created payment request, save to database
            if (responseBody != null && responseBody.getResultCode() == 0) {
                // Find MoMo payment method
                Optional<PaymentMethod> paymentMethodOpt = paymentMethodRepository.findByCode("MOMO");
                
                if (paymentMethodOpt.isPresent()) {
                    // Create payment entity
                    Payment payment = new Payment();
                    payment.setTransactionId(orderId);
                    payment.setAmount(request.getAmount());
                    payment.setTotalAmount(request.getAmount());
                    payment.setStatus(PaymentStatus.PENDING);
                    payment.setPaymentMethod(paymentMethodOpt.get());
                    payment.setCreatedAt(LocalDateTime.now());
                    payment.setExpirationDate(LocalDateTime.now().plusMinutes(15)); // 15 minute expiration
                    payment.setGatewayResponse(objectMapper.writeValueAsString(responseBody));
                    
                    // Save payment
                    paymentRepository.save(payment);
                }
            }
            
            return responseBody;
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
     * Process IPN callback from MoMo
     * @param callbackData Callback data from MoMo
     */
    public void processIpnCallback(Map<String, Object> callbackData) {
        try {
            System.out.println("Processing IPN callback: " + callbackData);
            
            String orderId = (String) callbackData.get("orderId");
            
            // Handle different types of resultCode
            Object resultCodeObj = callbackData.get("resultCode");
            int resultCode;
            
            if (resultCodeObj instanceof Integer) {
                resultCode = (Integer) resultCodeObj;
            } else if (resultCodeObj instanceof String) {
                // Try to parse the string as an integer
                try {
                    resultCode = Integer.parseInt((String) resultCodeObj);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Invalid resultCode format: " + resultCodeObj);
                }
            } else if (resultCodeObj == null) {
                throw new IllegalArgumentException("Missing resultCode in callback data");
            } else {
                throw new IllegalArgumentException("Unexpected resultCode type: " + resultCodeObj.getClass().getName());
            }
            
            String transId = (String) callbackData.get("transId");
            
            // Find payment in database
            Optional<Payment> paymentOpt = paymentRepository.findByTransactionId(orderId);
            
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                System.out.println("Found payment in database, current status: " + payment.getStatus());
                
                if (resultCode == 0) {
                    // Payment successful
                    payment.setStatus(PaymentStatus.COMPLETED);
                    payment.setPaymentDate(LocalDateTime.now());
                    payment.setGatewayTransactionId(transId);
                    System.out.println("Payment marked as COMPLETED");
                } else if (resultCode == 1003) {
                    // Payment cancelled by user
                    payment.setStatus(PaymentStatus.CANCELLED);
                    System.out.println("Payment marked as CANCELLED");
                } else if (resultCode == 1006 || resultCode == 1005) {
                    // Payment pending
                    payment.setStatus(PaymentStatus.PROCESSING);
                    System.out.println("Payment marked as PROCESSING");
                } else {
                    // Payment failed
                    payment.setStatus(PaymentStatus.FAILED);
                    System.out.println("Payment marked as FAILED with resultCode: " + resultCode);
                }
                
                // Save updated payment
                paymentRepository.save(payment);
                System.out.println("Payment updated in database");
            } else {
                System.out.println("Payment not found in database for orderId: " + orderId);
            }
        } catch (Exception e) {
            System.err.println("Error processing MoMo IPN callback: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error processing MoMo IPN callback: " + e.getMessage(), e);
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
} 