import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Toast, ToastContainer } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import NavBar from '../components/NavBar';
import MomoPayment from '../components/payment/MomoPayment';
import { toast } from 'react-toastify';

const PaymentExample = () => {
    const navigate = useNavigate();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [amount, setAmount] = useState(10000);
    const [orderInfo, setOrderInfo] = useState('Example payment');
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handlePaymentSuccess = (result) => {
        console.log('Payment successful:', result);
        setSuccessMessage(`Payment successful! Transaction ID: ${result.orderId || 'N/A'}`);
        setShowSuccess(true);
        setShowPaymentModal(false);
    };

    const handlePaymentFailure = (error) => {
        console.log('Payment failed:', error);
        setError(`Payment failed: ${error.message || 'Unknown error'}`);
        setShowPaymentModal(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!amount || amount < 100) {
            setError("Please enter a valid amount (minimum 100 VND)");
            return;
        }

        setError('');
        setShowPaymentModal(true);
    };

    return (
        <>
            <NavBar />
            <Container className="py-5">
                <h1 className="mb-4">Payment Example</h1>
                
                <Card className="mb-4">
                    <Card.Header as="h5">MoMo Payment Integration</Card.Header>
                    <Card.Body>
                        <Card.Title>Multi-Method Payment Integration</Card.Title>
                        <Card.Text>
                            This example demonstrates how to integrate MoMo's payment gateway with multiple payment methods:
                        </Card.Text>
                        <ul className="mb-4">
                            <li><strong>MoMo Wallet</strong> - Pay directly with MoMo e-wallet balance</li>
                            <li><strong>ATM Card</strong> - Pay with Vietnamese ATM cards</li>
                            <li><strong>Credit Card</strong> - Pay with international credit cards</li>
                            <li><strong>MoMo (All Methods)</strong> - Let users choose their payment method on MoMo's payment page</li>
                        </ul>
                        <Alert variant="info">
                            <strong>Test Environment:</strong> This demo uses MoMo's test environment. For testing, use:
                            <ul className="mb-0 mt-2">
                                <li>Phone: 0123456789</li>
                                <li>OTP: 000000</li>
                            </ul>
                        </Alert>
                    </Card.Body>
                </Card>

                <Card>
                    <Card.Header as="h5">Try a Payment</Card.Header>
                    <Card.Body>
                        {error && (
                            <Alert variant="danger">
                                {error}
                            </Alert>
                        )}
                        
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Payment Amount (VND)</Form.Label>
                                <Form.Control 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                                    min="100"
                                    step="100"
                                    required
                                />
                                <Form.Text className="text-muted">
                                    Minimum amount: 1,000 VND
                                </Form.Text>
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                                <Form.Label>Order Description</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    value={orderInfo}
                                    onChange={(e) => setOrderInfo(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            
                            <Button 
                                variant="primary" 
                                type="submit"
                                className="w-100"
                            >
                                <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                                Pay with MoMo
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
            
            <MomoPayment 
                show={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                amount={amount}
                orderInfo={orderInfo}
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
            />
            
            <ToastContainer position="top-end" className="p-3">
                <Toast 
                    show={showSuccess} 
                    onClose={() => setShowSuccess(false)} 
                    delay={5000} 
                    autohide
                    bg="success"
                    text="white"
                >
                    <Toast.Header closeButton>
                        <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                        <strong className="me-auto">Payment Successful</strong>
                    </Toast.Header>
                    <Toast.Body>{successMessage}</Toast.Body>
                </Toast>
            </ToastContainer>
        </>
    );
};

export default PaymentExample; 