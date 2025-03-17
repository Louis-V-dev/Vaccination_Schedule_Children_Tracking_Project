import React, { useState, useEffect } from 'react';
import { Container, Alert, Card, Button, Spinner } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faExclamationTriangle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import MomoPaymentService from '../services/MomoPaymentService';
import NavBar from '../components/NavBar';

const PaymentResult = () => {
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('');
    const [orderId, setOrderId] = useState('');
    const [amount, setAmount] = useState(0);
    const [loading, setLoading] = useState(true);
    
    const navigate = useNavigate();
    const location = useLocation();
    
    useEffect(() => {
        const checkPaymentStatus = async () => {
            try {
                // Get query parameters from URL
                const searchParams = new URLSearchParams(location.search);
                const orderIdParam = searchParams.get('orderId');
                const resultCode = searchParams.get('resultCode');
                
                if (!orderIdParam) {
                    setStatus('error');
                    setMessage('No order ID provided');
                    setLoading(false);
                    return;
                }
                
                setOrderId(orderIdParam);
                
                // If resultCode is present in URL, use it directly
                if (resultCode) {
                    if (resultCode === '0') {
                        setStatus('success');
                        setMessage('Payment completed successfully');
                        // You can also get amount and other details from URL params
                        const amountParam = searchParams.get('amount');
                        if (amountParam) {
                            setAmount(parseInt(amountParam, 10));
                        }
                    } else if (resultCode === '1003') {
                        setStatus('error');
                        setMessage('Payment was cancelled');
                    } else {
                        setStatus('error');
                        setMessage(`Payment failed with code: ${resultCode}`);
                    }
                    
                    setLoading(false);
                } else {
                    // If no resultCode in URL, check status from backend
                    const statusCheck = await MomoPaymentService.checkPaymentStatus(orderIdParam);
                    
                    if (statusCheck.resultCode === 0) {
                        setStatus('success');
                        setMessage('Payment completed successfully');
                        if (statusCheck.amount) {
                            setAmount(statusCheck.amount);
                        }
                    } else if (statusCheck.resultCode === 1003) {
                        setStatus('error');
                        setMessage('Payment was cancelled');
                    } else if (statusCheck.resultCode === 1006 || statusCheck.resultCode === 1005) {
                        setStatus('pending');
                        setMessage('Payment is still being processed');
                    } else {
                        setStatus('error');
                        setMessage(statusCheck.message || 'Payment failed');
                    }
                    
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
                setStatus('error');
                setMessage('Error checking payment status: ' + (error.message || 'Unknown error'));
                setLoading(false);
            }
        };
        
        checkPaymentStatus();
    }, [location.search]);
    
    const renderStatusIcon = () => {
        switch (status) {
            case 'success':
                return <FontAwesomeIcon icon={faCheckCircle} className="text-success mb-4" size="5x" />;
            case 'error':
                return <FontAwesomeIcon icon={faTimesCircle} className="text-danger mb-4" size="5x" />;
            case 'pending':
                return <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning mb-4" size="5x" />;
            default:
                return <Spinner animation="border" variant="primary" className="mb-4" />;
        }
    };
    
    const goBack = () => {
        // Navigate back to a specific page or the home page
        navigate('/');
    };
    
    return (
        <>
            <NavBar />
            <Container className="py-5">
                <Card className="shadow-sm">
                    <Card.Body className="p-5 text-center">
                        {loading ? (
                            <div className="text-center p-5">
                                <Spinner animation="border" variant="primary" />
                                <p className="mt-3">Checking payment status...</p>
                            </div>
                        ) : (
                            <>
                                {renderStatusIcon()}
                                
                                <h2 className="mb-4">
                                    {status === 'success' ? 'Payment Successful' : 
                                     status === 'pending' ? 'Payment Processing' : 'Payment Failed'}
                                </h2>
                                
                                <p className="mb-4">{message}</p>
                                
                                {orderId && (
                                    <p className="mb-1"><strong>Order ID:</strong> {orderId}</p>
                                )}
                                
                                {amount > 0 && (
                                    <p className="mb-4"><strong>Amount:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}</p>
                                )}
                                
                                {status === 'success' && (
                                    <Alert variant="success" className="mt-3">
                                        Thank you for your payment! Your transaction has been completed successfully.
                                    </Alert>
                                )}
                                
                                {status === 'pending' && (
                                    <Alert variant="warning" className="mt-3">
                                        Your payment is being processed. Please do not refresh this page.
                                    </Alert>
                                )}
                                
                                {status === 'error' && (
                                    <Alert variant="danger" className="mt-3">
                                        There was a problem processing your payment. Please try again or contact support if the issue persists.
                                    </Alert>
                                )}
                                
                                <Button 
                                    variant="primary" 
                                    onClick={goBack} 
                                    className="mt-4"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                                    Return to Homepage
                                </Button>
                            </>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
};

export default PaymentResult; 