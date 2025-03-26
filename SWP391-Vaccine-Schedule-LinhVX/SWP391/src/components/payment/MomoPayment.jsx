import React, { useState } from 'react';
import { Button, Modal, Spinner, Alert, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faMoneyBill, faCreditCard, faUniversity } from '@fortawesome/free-solid-svg-icons';
import MomoPaymentService from '../../services/MomoPaymentService';
import './MomoPayment.css';

const MomoPayment = ({ amount, orderInfo, extraData, onSuccess, onFailure, show, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('captureWallet'); // Default to MoMo wallet

    const getPaymentMethodIcon = (method) => {
        switch(method) {
            case 'payWithATM':
                return <FontAwesomeIcon icon={faUniversity} />;
            case 'payWithCC':
                return <FontAwesomeIcon icon={faCreditCard} />;
            case 'payWithMoMo':
                return <FontAwesomeIcon icon={faMoneyBill} />;
            case 'captureWallet':
            default:
                return <FontAwesomeIcon icon={faQrcode} />;
        }
    };

    const getPaymentMethodName = (method) => {
        switch(method) {
            case 'payWithATM':
                return 'ATM Card';
            case 'payWithCC':
                return 'Credit Card';
            case 'payWithMoMo':
                return 'MoMo (All Methods)';
            case 'captureWallet':
            default:
                return 'QR Code';
        }
    };

    const initiatePayment = async () => {
        try {
            setLoading(true);
            setError(null);

            // Create payment data object with all required MoMo fields
            const paymentData = {
                amount: amount,
                orderInfo: orderInfo || "Payment for vaccination services",
                extraData: extraData, // This should contain the appointmentId
                returnUrl: window.location.origin + "/payment/status",
                requestType: paymentMethod,
                // If this is an appointment payment, include the appointment ID
                ...(extraData && { appointmentId: extraData })
            };

            console.log('Creating MoMo payment with data:', paymentData);
            const response = await MomoPaymentService.createPayment(paymentData);
            console.log('MoMo payment response:', response);

            // Check for successful response
            if (response && (response.resultCode === 0 || response.resultCode === 100)) {
                if (response.payUrl) {
                    // Redirect to the MoMo payment page
                    console.log('Redirecting to MoMo payment URL:', response.payUrl);
                    window.location.href = response.payUrl;
                } else {
                    // Log more details about the response for debugging
                    console.error('Missing payUrl in successful response:', response);
                    
                    // Check if we have a result object that might contain the payUrl
                    if (response.result && response.result.payUrl) {
                        console.log('Found payUrl in result object, redirecting to:', response.result.payUrl);
                        window.location.href = response.result.payUrl;
                        return;
                    }
                    
                    setError("No payment URL received. Please try a different payment method or contact support.");
                    if (onFailure) {
                        onFailure({ 
                            resultCode: 99, 
                            message: "No payment URL received from MoMo API",
                            details: JSON.stringify(response)
                        });
                    }
                }
            } else {
                // Handle error cases
                const errorMessage = response?.message || 'Failed to initialize payment';
                const errorCode = response?.resultCode || 99;
                
                console.error('Payment initialization failed:', {
                    code: errorCode,
                    message: errorMessage,
                    response: response
                });
                
                setError(`Payment initialization failed: ${errorMessage} (Code: ${errorCode})`);
                
                if (onFailure) {
                    onFailure(response || { 
                        resultCode: errorCode, 
                        message: errorMessage,
                        details: JSON.stringify(response)
                    });
                }
            }
        } catch (error) {
            console.error("Error creating payment:", error);
            setError(`Error creating payment: ${error.message || 'Unknown error'}`);
            
            if (onFailure) {
                onFailure({ 
                    resultCode: 99, 
                    message: error.message || "Failed to initialize payment",
                    details: error.stack
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose} backdrop="static" keyboard={false} centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    <FontAwesomeIcon icon={faQrcode} className="text-primary me-2" />
                    CHILD VACCINATION SCHEDULE 
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && (
                    <Alert variant="danger" className="mb-3">
                        {error}
                    </Alert>
                )}

                <div className="text-center p-4">
                    <img 
                        src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" 
                        alt="MoMo Logo" 
                        style={{ height: '60px', marginBottom: '20px' }} 
                    />
                    <h4>Payment Methods</h4>
                    <p>Amount: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}</p>
                    <p className="text-muted">{orderInfo || "Payment for vaccination services"}</p>
                    
                    <Form className="mt-3 mb-4">
                        <Form.Group>
                            <Form.Label>Select Payment Method</Form.Label>
                            <div className="payment-method-options">
                                {[
                                    { id: 'captureWallet', name: 'QR Code' },
                                    { id: 'payWithATM', name: 'ATM Card' },
                                    { id: 'payWithCC', name: 'Credit Card' },
                                    { id: 'payWithMoMo', name: 'All Methods' }
                                ].map(method => (
                                    <div
                                        key={method.id}
                                        className={`payment-method-option ${paymentMethod === method.id ? 'selected' : ''}`}
                                        onClick={() => setPaymentMethod(method.id)}
                                    >
                                        <div className="icon-container">
                                            {getPaymentMethodIcon(method.id)}
                                        </div>
                                        <div className="method-name">
                                            {method.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Form.Group>
                    </Form>
                    
                    <Button 
                        variant="danger" 
                        size="lg" 
                        onClick={initiatePayment}
                        disabled={loading}
                        className="mt-3 momo-pay-button"
                    >
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Processing...
                            </>
                        ) : (
                            <>
                                {getPaymentMethodIcon(paymentMethod)}
                                <span className="ms-2">Proceed to Payment</span>
                            </>
                        )}
                    </Button>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default MomoPayment; 