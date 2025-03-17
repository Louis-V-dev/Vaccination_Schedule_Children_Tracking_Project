import React, { useState } from 'react';
import { Button, Modal, Spinner, Alert, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faMoneyBill, faCreditCard, faUniversity } from '@fortawesome/free-solid-svg-icons';
import MomoPaymentService from '../../services/MomoPaymentService';
import './MomoPayment.css';

const MomoPayment = ({ amount, orderInfo, onSuccess, onFailure, show, onClose }) => {
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
            case 'captureWallet':
            default:
                return <FontAwesomeIcon icon={faMoneyBill} />;
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
                return 'MoMo Wallet';
        }
    };

    const initiatePayment = async () => {
        try {
            setLoading(true);
            setError(null);

            // Create payment
            const paymentData = {
                amount: amount,
                orderInfo: orderInfo || "Payment for vaccination services",
                returnUrl: window.location.origin + "/payment/result",
                requestType: paymentMethod
            };

            console.log('Creating MoMo payment with data:', paymentData);
            const response = await MomoPaymentService.createPayment(paymentData);
            console.log('MoMo payment response:', response);

            // Check for successful response - note 0 or 100 can both indicate success
            if (response && (response.resultCode === 0 || response.resultCode === 100)) {
                if (response.payUrl) {
                    // Simply redirect to the MoMo payment page
                    window.location.href = response.payUrl;
                } else {
                    setError("No payment URL received. Please try again.");
                    if (onFailure) {
                        onFailure({ resultCode: 99, message: "No payment URL received" });
                    }
                }
            } else {
                // Handle specific error cases with better messages
                if (!response) {
                    setError("Payment service is unavailable. Please try again later.");
                } else if (response.resultCode === 99) {
                    setError(`Payment initialization failed: ${response.message}`);
                } else if (response.message && response.message.toLowerCase() === "success") {
                    // Don't show "failed: Success" which is confusing 
                    setError("Payment initialization didn't return required data. Please try again.");
                } else {
                    setError(`Payment initialization failed: ${response.message || 'Unknown error'}`);
                }
                
                // Call failure callback with error details
                if (onFailure) {
                    onFailure(response || { resultCode: 99, message: "Failed to initialize payment" });
                }
            }
        } catch (error) {
            console.error("Error creating payment:", error);
            setError(`Error creating payment: ${error.message || 'Unknown error'}`);
            
            // Call failure callback with error details
            if (onFailure) {
                onFailure({ resultCode: 99, message: error.message || "Failed to initialize payment" });
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
                    MoMo Payment
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && (
                    <Alert variant="danger" className="mb-3">
                        {error}
                    </Alert>
                )}

                <div className="text-center p-4">
                    <FontAwesomeIcon icon={faMoneyBill} className="text-success mb-3" size="4x" />
                    <h4>Ready to Pay?</h4>
                    <p>Amount: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}</p>
                    <p className="text-muted">{orderInfo || "Payment for vaccination services"}</p>
                    
                    <Form className="mt-3 mb-4">
                        <Form.Group>
                            <Form.Label>Select Payment Method</Form.Label>
                            <div className="payment-method-options">
                                {['captureWallet', 'payWithATM', 'payWithCC', 'payWithMoMo'].map(method => (
                                    <div
                                        key={method}
                                        className={`payment-method-option ${paymentMethod === method ? 'selected' : ''}`}
                                        onClick={() => setPaymentMethod(method)}
                                    >
                                        <div className="icon-container">
                                            {getPaymentMethodIcon(method)}
                                        </div>
                                        <div className="method-name">
                                            {getPaymentMethodName(method)}
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