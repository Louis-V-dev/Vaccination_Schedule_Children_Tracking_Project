import axios from 'axios';

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
    createPayment(paymentData) {
        try {
            console.log('Creating MoMo payment with data:', paymentData);
            
            // Add returnUrl if not provided
            if (!paymentData.returnUrl) {
                paymentData.returnUrl = window.location.origin + '/payment/result';
            }
            
            // Set default requestType if not provided
            if (!paymentData.requestType) {
                paymentData.requestType = 'captureWallet';
            }
            
            return axios.post('/api/payments/momo/create', paymentData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            .then(response => {
                console.log('Raw payment creation response:', response.data);
                
                // Handle different response formats
                if (response.data) {
                    // If the response is in the format: {code: number, message: string, data: object}
                    if (response.data.code !== undefined) {
                        console.log('Backend controller response:', response.data);
                        
                        // Check if success (code 0 or 1000 or 100)
                        if (response.data.code === 0 || response.data.code === 1000 || response.data.code === 100) {
                            // Extract data from the response
                            const result = response.data.data || response.data.result || {};
                            
                            // Construct a standard response format
                            return {
                                resultCode: response.data.code === 100 ? 100 : 0, // Preserve code 100 for compatibility
                                qrCodeUrl: result.qrCodeUrl || result.qrCode || response.data.qrCodeUrl || response.data.qrCode,
                                qrCode: result.qrCodeUrl || result.qrCode || response.data.qrCodeUrl || response.data.qrCode,
                                payUrl: result.payUrl || response.data.payUrl,
                                orderId: result.orderId || response.data.orderId || ("MOMO" + Date.now()),
                                message: response.data.message || 'Success'
                            };
                        } else {
                            // Error response
                            return {
                                resultCode: response.data.code,
                                message: response.data.message || 'Error in payment creation',
                                orderId: null
                            };
                        }
                    }
                    
                    // If response is directly a MoMo response with resultCode
                    if (response.data.resultCode !== undefined) {
                        console.log('Direct MoMo response:', response.data);
                        
                        // Ensure qrCode and qrCodeUrl are the same (for compatibility)
                        if (response.data.qrCodeUrl && !response.data.qrCode) {
                            response.data.qrCode = response.data.qrCodeUrl;
                        } else if (response.data.qrCode && !response.data.qrCodeUrl) {
                            response.data.qrCodeUrl = response.data.qrCode;
                        }
                        
                        return response.data;
                    }
                    
                    // If response is wrapped in a result property
                    if (response.data.result) {
                        console.log('Wrapped payment creation response:', response.data.result);
                        
                        // Ensure qrCode and qrCodeUrl are the same (for compatibility)
                        if (response.data.result.qrCodeUrl && !response.data.result.qrCode) {
                            response.data.result.qrCode = response.data.result.qrCodeUrl;
                        } else if (response.data.result.qrCode && !response.data.result.qrCodeUrl) {
                            response.data.result.qrCodeUrl = response.data.result.qrCode;
                        }
                        
                        return response.data.result;
                    }
                    
                    // If response has direct properties for QR code
                    if (response.data.qrCodeUrl || response.data.qrCode) {
                        console.log('Backend response with QR code:', response.data);
                        
                        // Ensure both properties exist for compatibility
                        const qrCodeUrl = response.data.qrCodeUrl || response.data.qrCode;
                        
                        // Map to expected format
                        return {
                            resultCode: 0,  // Assuming success if QR code is present
                            qrCodeUrl: qrCodeUrl,
                            qrCode: qrCodeUrl,
                            orderId: response.data.orderId,
                            payUrl: response.data.payUrl,
                            message: response.data.message || 'Success'
                        };
                    }
                }
                
                console.error('Invalid response format:', response.data);
                throw new Error('Invalid response format');
            })
            .catch(error => {
                // Look for specific error types and provide better error messages
                let errorMessage = 'Failed to create payment';
                
                if (error instanceof TypeError && error.message.includes('Image is not a constructor')) {
                    errorMessage = 'Error loading QR code - will use redirect payment instead';
                    console.warn('Image constructor not available, using fallback payment method');
                } else {
                    console.error('Error creating payment:', error.response?.data || error.message);
                }
                
                return {
                    resultCode: 99,
                    message: errorMessage,
                    orderId: null
                };
            });
        } catch (error) {
            // Look for specific error types and provide better error messages
            let errorMessage = 'Unexpected error occurred';
            
            if (error instanceof TypeError && error.message.includes('Image is not a constructor')) {
                errorMessage = 'Error loading QR code - will use redirect payment instead';
                console.warn('Image constructor not available, using fallback payment method');
            } else {
                console.error('Unexpected error in createPayment:', error);
            }
            
            return {
                resultCode: 99,
                message: errorMessage,
                orderId: null
            };
        }
    }

    /**
     * Checks the status of a MoMo payment
     * @param {string} orderId Order ID to check
     * @returns {Promise<Object>} Payment status response
     */
    checkPaymentStatus(orderId) {
        try {
            if (!orderId) {
                console.error('Invalid order ID provided');
                return Promise.resolve({
                    resultCode: 98,
                    message: 'Invalid order ID',
                    orderId: orderId
                });
            }
            
            console.log('Checking payment status for order:', orderId);
            
            return axios.get(`/api/payments/momo/status/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                // Increase timeout to avoid quick failures
                timeout: 10000
            })
            .then(response => {
                // Check if we have a valid response structure
                if (response.data) {
                    // Handle the direct response format from the backend
                    // The backend returns {code: number, message: string, result: object}
                    if (response.data.code !== undefined) {
                        console.log('Backend response with code:', response.data);
                        
                        // Map the response to the expected format
                        if (response.data.code === 0) {
                            // Successfully completed payment
                            return {
                                resultCode: 0,
                                message: response.data.message,
                                orderId: orderId
                            };
                        } else if (response.data.code === 1000) {
                            // Payment is pending/processing
                            return {
                                resultCode: 1,
                                message: response.data.message || 'Payment is being processed',
                                orderId: orderId
                            };
                        } else {
                            // Other response codes
                            return {
                                resultCode: response.data.code,
                                message: response.data.message,
                                orderId: orderId
                            };
                        }
                    }
                    
                    // Also handle the previous success/result format if it exists
                    if (response.data.success && response.data.result) {
                        console.log('Payment status response:', response.data.result);
                        return response.data.result;
                    } else if (response.data.error) {
                        // Handle error response from API
                        console.warn('API returned error:', response.data.error);
                        return {
                            resultCode: 97,
                            message: response.data.error || 'Error checking payment status',
                            orderId: orderId
                        };
                    }
                }
                
                console.warn('Invalid response format from status API:', response.data);
                return {
                    resultCode: 96,
                    message: 'Invalid response format',
                    orderId: orderId
                };
            })
            .catch(error => {
                // Detailed error logging
                console.error('Error checking payment status:', error.message);
                if (error.response) {
                    console.error('Response data:', error.response.data);
                    console.error('Response status:', error.response.status);
                }
                
                // Return formatted error for frontend to handle
                return {
                    resultCode: 95,
                    message: error.response?.data?.message || 'Failed to check payment status',
                    orderId: orderId,
                    error: error.message
                };
            });
        } catch (error) {
            console.error('Unexpected error in checkPaymentStatus:', error);
            return Promise.resolve({
                resultCode: 94,
                message: 'Unexpected error occurred',
                orderId: orderId
            });
        }
    }
}

export default new MomoPaymentService(); 