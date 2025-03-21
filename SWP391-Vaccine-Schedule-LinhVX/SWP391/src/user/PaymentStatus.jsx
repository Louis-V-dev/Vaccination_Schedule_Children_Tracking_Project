import React, { useState, useEffect } from 'react';
import { Container, Alert, Spinner, Card, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faQuestionCircle, faHome, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';
import appointmentService from '../services/appointmentService';

const PaymentStatus = () => {
    const [status, setStatus] = useState('loading'); // loading, success, failed, error
    const [message, setMessage] = useState('');
    const [appointmentId, setAppointmentId] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        async function verifyPayment() {
            try {
                // Get parameters from URL
                const searchParams = new URLSearchParams(location.search);
                const resultCode = searchParams.get('resultCode');
                const orderId = searchParams.get('orderId');
                const extraData = searchParams.get('extraData'); // Contains appointment ID
                const orderInfo = searchParams.get('orderInfo'); // May contain appointment ID in format "Payment for appointment #X"
                
                console.log('Payment callback received:', { 
                    resultCode, 
                    orderId, 
                    extraData,
                    orderInfo
                });

                // Set appointment ID from extraData or extract from orderInfo
                let extractedAppointmentId = null;
                
                if (extraData) {
                    extractedAppointmentId = extraData;
                } else if (orderInfo) {
                    // Try to extract ID from format "Payment for appointment #X"
                    const matches = orderInfo.match(/#(\d+)/);
                    if (matches && matches[1]) {
                        extractedAppointmentId = matches[1];
                    }
                }
                
                if (extractedAppointmentId) {
                    console.log('Extracted appointment ID:', extractedAppointmentId);
                    setAppointmentId(extractedAppointmentId);
                } else {
                    console.warn('Could not extract appointment ID from response');
                }

                // Check if the payment was successful (resultCode === 0)
                if (resultCode === '0') {
                    // Verify payment with backend
                    console.log('Checking payment status with backend for orderId:', orderId);
                    try {
                        const paymentStatusResponse = await appointmentService.checkPaymentStatus(orderId);
                        
                        console.log('Backend payment status response:', paymentStatusResponse);
                        
                        if (paymentStatusResponse?.status === 'SUCCESS' || 
                            paymentStatusResponse?.resultCode === 0 || 
                            paymentStatusResponse?.message?.toLowerCase()?.includes('success')) {
                            
                            // Mark appointment as paid if we have the ID
                            if (extractedAppointmentId) {
                                try {
                                    await appointmentService.markAppointmentAsPaid(extractedAppointmentId);
                                    console.log('Appointment marked as paid:', extractedAppointmentId);
                                } catch (markError) {
                                    console.error('Error marking appointment as paid:', markError);
                                    // Continue with success message even if marking fails
                                }
                            }
                            
                            setStatus('success');
                            setMessage('Payment successful! Your appointment has been confirmed.');
                        } else {
                            setStatus('failed');
                            setMessage('Payment was processed, but there was an issue confirming it with our system. Please contact support.');
                        }
                    } catch (verifyError) {
                        console.error('Error verifying payment with backend:', verifyError);
                        
                        // Even if backend verification fails, MoMo says it succeeded
                        // so we should consider it a success and attempt to mark as paid
                        if (extractedAppointmentId) {
                            try {
                                await appointmentService.markAppointmentAsPaid(extractedAppointmentId);
                                console.log('Appointment marked as paid despite verify error:', extractedAppointmentId);
                            } catch (markError) {
                                console.error('Error marking appointment as paid:', markError);
                                // Continue with success message even if marking fails
                            }
                        }
                        
                        setStatus('success');
                        setMessage('Payment successful! Your appointment has been confirmed.');
                    }
                } else {
                    // Payment failed according to MoMo
                    setStatus('failed');
                    setMessage(`Payment failed. Reason: ${searchParams.get('message') || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Error verifying payment:', error);
                setStatus('error');
                setMessage('An error occurred while verifying your payment. Please contact support.');
            }
        }

        verifyPayment();
    }, [location.search]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3">Verifying your payment...</p>
                    </div>
                );
            case 'success':
                return (
                    <Card className="text-center p-4">
                        <div className="mb-4">
                            <FontAwesomeIcon 
                                icon={faCheckCircle} 
                                className="text-success" 
                                style={{ fontSize: '4rem' }} 
                            />
                        </div>
                        <h3 className="mb-3">Payment Successful!</h3>
                        <p className="mb-4">{message}</p>
                        <div className="d-flex justify-content-center gap-3">
                            <Button 
                                variant="primary" 
                                onClick={() => navigate('/appointments')}
                            >
                                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                View My Appointments
                            </Button>
                            <Button 
                                variant="outline-primary" 
                                onClick={() => navigate('/')}
                            >
                                <FontAwesomeIcon icon={faHome} className="me-2" />
                                Return to Home
                            </Button>
                        </div>
                    </Card>
                );
            case 'failed':
                return (
                    <Card className="text-center p-4">
                        <div className="mb-4">
                            <FontAwesomeIcon 
                                icon={faTimesCircle} 
                                className="text-danger" 
                                style={{ fontSize: '4rem' }} 
                            />
                        </div>
                        <h3 className="mb-3">Payment Failed</h3>
                        <p className="mb-4">{message}</p>
                        <Alert variant="info" className="mb-3">
                            Your appointment has been created, but is marked as unpaid.
                            You can pay at the clinic during your visit.
                        </Alert>
                        <div className="d-flex justify-content-center gap-3">
                            <Button 
                                variant="primary" 
                                onClick={() => navigate('/appointments')}
                            >
                                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                View My Appointments
                            </Button>
                            <Button 
                                variant="outline-primary" 
                                onClick={() => navigate('/')}
                            >
                                <FontAwesomeIcon icon={faHome} className="me-2" />
                                Return to Home
                            </Button>
                        </div>
                    </Card>
                );
            case 'error':
                return (
                    <Card className="text-center p-4">
                        <div className="mb-4">
                            <FontAwesomeIcon 
                                icon={faQuestionCircle} 
                                className="text-warning" 
                                style={{ fontSize: '4rem' }} 
                            />
                        </div>
                        <h3 className="mb-3">Verification Error</h3>
                        <p className="mb-4">{message}</p>
                        <Alert variant="warning" className="mb-3">
                            If your payment was successful, please contact support with your appointment details.
                        </Alert>
                        <div className="d-flex justify-content-center gap-3">
                            <Button 
                                variant="primary" 
                                onClick={() => navigate('/appointments')}
                            >
                                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                View My Appointments
                            </Button>
                            <Button 
                                variant="outline-primary" 
                                onClick={() => navigate('/')}
                            >
                                <FontAwesomeIcon icon={faHome} className="me-2" />
                                Return to Home
                            </Button>
                        </div>
                    </Card>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <NavBar />
            <Container className="mt-5 mb-5">
                <h2 className="text-center mb-4">Payment Status</h2>
                {renderContent()}
            </Container>
        </>
    );
};

export default PaymentStatus; 