import axios from 'axios';
import appointmentService from './appointmentService';

const API_URL = 'http://localhost:8080/api/payments/momo';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No authentication token found');
        return {
            'Content-Type': 'application/json'
        };
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

/**
 * Service for handling MoMo e-wallet payment integration
 */
class MomoPaymentService {
    /**
     * Creates a new MoMo payment
     * @param {Object} paymentData Payment data
     * @param {number} paymentData.amount Amount to pay in VND
     * @param {string} paymentData.orderInfo Order description
     * @param {string} paymentData.extraData Additional data (optional)
     * @param {string} paymentData.returnUrl Custom return URL (optional)
     * @param {string} paymentData.notifyUrl Custom notify URL (optional)
     * @param {string} paymentData.requestType Payment method: captureWallet, payWithATM, payWithCC, payWithMoMo (optional)
     * @returns {Promise<Object>} Payment response from MoMo
     */
    async createPayment(paymentData) {
        try {
            console.log('Creating MoMo payment with data:', paymentData);
            
            // Extract appointment ID from extraData if available
            const appointmentId = paymentData.extraData;
            let response;
            
            // If we have an appointment ID, use the appointment service
            if (appointmentId) {
                console.log('Creating payment for appointment:', appointmentId);
                
                // Create the payment request
                const paymentRequest = {
                    amount: paymentData.amount,
                    orderInfo: paymentData.orderInfo || `Payment for appointment #${appointmentId}`,
                    extraData: appointmentId,
                    returnUrl: paymentData.returnUrl || window.location.origin + '/payment/status',
                    requestType: paymentData.requestType || 'captureWallet',
                    // This is the critical part - we need to explicitly set the appointmentId
                    appointmentId: appointmentId
                };
                
                console.log('Payment request data:', paymentRequest);
                
                // Use direct API endpoint with proper headers
                response = await axios.post(`${API_URL}/create`, paymentRequest, {
                    headers: getAuthHeaders()
                });
                
                console.log('Direct payment creation response:', response.data);
                
                // Extract the payment URL - this is critical
                let payUrl = null;
                
                // Handle different response formats - payUrl might be at different locations based on MoMo API response
                if (response.data) {
                    // Check if payUrl is directly in response.data
                    if (response.data.payUrl) {
                        payUrl = response.data.payUrl;
                    }
                    // Check if payUrl is in response.data.result (nested)
                    else if (response.data.result && response.data.result.payUrl) {
                        payUrl = response.data.result.payUrl;
                    }
                    // Check if the entire response.data is an URL string
                    else if (typeof response.data === 'string' && response.data.startsWith('http')) {
                        payUrl = response.data;
                    }
                    
                    console.log('Extracted payment URL:', payUrl);
                    
                    // Format the response
                    return {
                        resultCode: 0,
                        payUrl: payUrl,
                        qrCodeUrl: response.data.qrCodeUrl || (response.data.result && response.data.result.qrCodeUrl),
                        orderId: response.data.orderId || (response.data.result && response.data.result.orderId) || `MOMO${Date.now()}`,
                        message: 'Success'
                    };
                }
            } else {
                // For standalone payments (not tied to appointments)
                // Add returnUrl if not provided
                if (!paymentData.returnUrl) {
                    paymentData.returnUrl = window.location.origin + '/payment/status';
                }
                
                // Set default requestType if not provided
                if (!paymentData.requestType) {
                    paymentData.requestType = 'captureWallet';
                }
                
                // Use direct API endpoint
                response = await axios.post(`${API_URL}/create`, paymentData, {
                    headers: getAuthHeaders()
                });
                
                console.log('Direct payment creation response:', response.data);
                
                // Extract the payment URL
                let payUrl = null;
                
                // Handle different response formats
                if (response.data) {
                    // Check if payUrl is directly in response.data
                    if (response.data.payUrl) {
                        payUrl = response.data.payUrl;
                    }
                    // Check if payUrl is in response.data.result (nested)
                    else if (response.data.result && response.data.result.payUrl) {
                        payUrl = response.data.result.payUrl;
                    }
                    // Check if the entire response.data is an URL string
                    else if (typeof response.data === 'string' && response.data.startsWith('http')) {
                        payUrl = response.data;
                    }
                    
                    console.log('Extracted payment URL:', payUrl);
                    
                    // Format the response
                    return {
                        resultCode: 0,
                        payUrl: payUrl,
                        qrCodeUrl: response.data.qrCodeUrl || (response.data.result && response.data.result.qrCodeUrl),
                        orderId: response.data.orderId || (response.data.result && response.data.result.orderId) || `MOMO${Date.now()}`,
                        message: 'Success'
                    };
                }
            }
            
            throw new Error('Invalid response from payment service');
        } catch (error) {
            console.error('Error creating payment:', error);
            return {
                resultCode: 99,
                message: error.response?.data?.message || error.message || 'Failed to create payment',
                orderId: null
            };
        }
    }

    /**
     * Checks the status of a MoMo payment
     * @param {string} orderId Order ID to check
     * @returns {Promise<Object>} Payment status response
     */
    async checkPaymentStatus(orderId) {
        try {
            // Use appointmentService to check payment status
            return await appointmentService.checkPaymentStatus(orderId);
        } catch (error) {
            console.error('Error checking payment status:', error);
            return {
                resultCode: 99,
                message: error.message || 'Failed to check payment status',
                orderId: orderId
            };
        }
    }

    /**
     * Debug method to test MoMo API directly
     * This can help identify exactly what the backend is returning
     */
    async debugDirectMomoAPI(appointmentId, requestType = 'payWithCC') {
        try {
            console.log('Debug MoMo API for appointment:', appointmentId);
            
            // Create a test payment request with minimal data
            const testPaymentRequest = {
                appointmentId: appointmentId,
                amount: 10000, // Test with a small amount
                orderInfo: `Test payment for appointment #${appointmentId}`,
                extraData: appointmentId.toString(),
                returnUrl: window.location.origin + '/payment/status',
                requestType: requestType
            };
            
            console.log('Debug payment request:', testPaymentRequest);
            
            // Make direct API call
            const response = await axios.post(`${API_URL}/create`, testPaymentRequest, {
                headers: getAuthHeaders()
            });
            
            // Log the entire raw response
            console.log('Debug - Raw MoMo API response:', response);
            console.log('Debug - Response data:', response.data);
            console.log('Debug - Response status:', response.status);
            
            // Check for nested response structures
            if (response.data && response.data.result) {
                console.log('Debug - Nested result:', response.data.result);
            }
            
            // Look for payUrl in different places
            const possiblePayUrlLocations = [
                response.data?.payUrl,
                response.data?.result?.payUrl,
                typeof response.data === 'string' ? response.data : null
            ];
            
            console.log('Debug - Possible payUrl locations:', possiblePayUrlLocations);
            
            return {
                rawResponse: response.data,
                payUrlAttempts: possiblePayUrlLocations,
                foundPayUrl: possiblePayUrlLocations.find(url => url && typeof url === 'string' && url.startsWith('http'))
            };
        } catch (error) {
            console.error('Debug - Error calling MoMo API:', error);
            return {
                error: error.message,
                responseData: error.response?.data,
                responseStatus: error.response?.status
            };
        }
    }

    /**
     * Test direct MoMo API integration based on official documentation
     * This adds all the required MoMo parameters that may be missing in the current implementation
     */
    async testDirectMomoAPI(paymentOptions = {}) {
        try {
            console.log('Testing direct MoMo API integration');
            
            // Create request data following MoMo documentation format
            const requestId = `MOMO${Date.now()}`;
            const orderId = requestId;
            
            // Prepare payment request data
            const directRequest = {
                // Standard MoMo API parameters
                partnerCode: 'MOMO', // This should be your actual partner code in production
                accessKey: 'F8BBA842ECF85', // Example from docs - use your actual key
                requestId: requestId,
                amount: paymentOptions.amount?.toString() || '10000',
                orderId: orderId,
                orderInfo: paymentOptions.orderInfo || 'Test payment via MoMo API',
                redirectUrl: paymentOptions.returnUrl || window.location.origin + '/payment/status',
                ipnUrl: paymentOptions.ipnUrl || window.location.origin + '/api/payments/momo/ipn',
                extraData: paymentOptions.extraData || '',
                requestType: paymentOptions.requestType || 'captureWallet',
                
                // Other required parameters for signature generation
                // The signature should be generated on the backend for security
                // This is just for testing purposes
                signatureTest: true, // Signal to backend this needs signature
                
                // Optional parameters
                lang: 'vi',
                
                // Include appointment ID if provided
                ...(paymentOptions.appointmentId && { appointmentId: paymentOptions.appointmentId })
            };
            
            console.log('Direct MoMo API request data:', directRequest);
            
            // Send the request to your backend endpoint that handles MoMo API
            const response = await axios.post(`${API_URL}/direct-test`, directRequest, {
                headers: getAuthHeaders()
            });
            
            console.log('Direct MoMo API response:', response.data);
            
            // Return formatted response
            return {
                ...response.data,
                testRequest: directRequest
            };
        } catch (error) {
            console.error('Error testing direct MoMo API:', error);
            return {
                error: error.message,
                errorDetails: error.response?.data,
                errorStatus: error.response?.status
            };
        }
    }
}

export default new MomoPaymentService(); 