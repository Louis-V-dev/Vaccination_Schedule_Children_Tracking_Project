import React, { useState } from 'react';
import { Card, Form, Button, Spinner, Alert, Container, Tabs, Tab } from 'react-bootstrap';
import MomoPaymentService from '../../services/MomoPaymentService';
import NavBar from '../../components/NavBar';

const MomoDebug = () => {
    const [loading, setLoading] = useState(false);
    const [appointmentId, setAppointmentId] = useState('');
    const [requestType, setRequestType] = useState('captureWallet');
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    
    // Direct MoMo API parameters
    const [amount, setAmount] = useState(10000);
    const [orderInfo, setOrderInfo] = useState('Test payment');
    const [directResult, setDirectResult] = useState(null);
    const [directError, setDirectError] = useState(null);
    const [directLoading, setDirectLoading] = useState(false);

    const handleDebugTest = async () => {
        if (!appointmentId) {
            setError('Please enter an appointment ID');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Call our debug method
            const debugResult = await MomoPaymentService.debugDirectMomoAPI(appointmentId, requestType);
            console.log('Debug result:', debugResult);
            setResult(debugResult);

            // Check if we found a payment URL
            if (debugResult.foundPayUrl) {
                setResult({
                    ...debugResult,
                    message: 'Payment URL found! You can redirect to this URL.'
                });
            } else {
                setResult({
                    ...debugResult,
                    message: 'No valid payment URL found. Check console for details.'
                });
            }
        } catch (err) {
            console.error('Error in debug test:', err);
            setError(`Test failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    const handleDirectMomoTest = async () => {
        setDirectLoading(true);
        setDirectError(null);
        setDirectResult(null);
        
        try {
            // Create a direct MoMo API request based on the documentation
            const directRequest = {
                // These are the required MoMo API parameters
                partnerCode: 'MOMO',
                partnerName: 'Test',
                storeId: 'MomoTestStore',
                requestId: `MOMO${Date.now()}`,
                amount: amount.toString(),
                orderId: `MOMO${Date.now()}`,
                orderInfo: orderInfo,
                redirectUrl: window.location.origin + '/payment/status',
                ipnUrl: window.location.origin + '/api/payments/momo/ipn',
                extraData: '',
                requestType: requestType,
                lang: 'vi',
                autoCapture: true,
                
                // Add these as needed
                // paymentCode: '', 
                // orderGroupId: '',
                
                // The signature would normally be generated on the backend
                // This is just for testing - the backend should handle this
                testMode: true // Signal to backend this is a test request
            };
            
            console.log('Direct MoMo API request:', directRequest);
            
            // Make direct request to your backend endpoint that handles MoMo API
            const response = await fetch('/api/debug/momo/direct-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(directRequest)
            });
            
            const responseData = await response.json();
            console.log('Direct MoMo API response:', responseData);
            
            setDirectResult(responseData);
            
            // Check if we got a payment URL
            if (responseData.payUrl) {
                setDirectResult({
                    ...responseData,
                    message: 'Payment URL found! You can redirect to this URL.'
                });
            } else {
                setDirectResult({
                    ...responseData,
                    message: 'No payment URL found in response.'
                });
            }
        } catch (err) {
            console.error('Error in direct MoMo test:', err);
            setDirectError(`Test failed: ${err.message}`);
        } finally {
            setDirectLoading(false);
        }
    };

    return (
        <>
            <NavBar />
            <Container className="py-4">
                <h2>MoMo API Debug Tool</h2>
                <p className="text-muted">
                    Use this tool to debug MoMo payment integration issues by testing API calls directly.
                </p>
                
                <Tabs defaultActiveKey="backend" className="mb-3">
                    <Tab eventKey="backend" title="Backend Integration Test">
                        <Card className="mb-4">
                            <Card.Body>
                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Appointment ID</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={appointmentId}
                                            onChange={(e) => setAppointmentId(e.target.value)}
                                            placeholder="Enter appointment ID"
                                        />
                                        <Form.Text className="text-muted">
                                            Enter an existing appointment ID to test payment creation.
                                        </Form.Text>
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Payment Method (requestType)</Form.Label>
                                        <Form.Select 
                                            value={requestType}
                                            onChange={(e) => setRequestType(e.target.value)}
                                        >
                                            <option value="captureWallet">QR Code (captureWallet)</option>
                                            <option value="payWithATM">ATM Card (payWithATM)</option>
                                            <option value="payWithCC">Credit Card (payWithCC)</option>
                                            <option value="payWithMoMo">All Methods (payWithMoMo)</option>
                                        </Form.Select>
                                        <Form.Text className="text-muted">
                                            Select the payment method to test.
                                        </Form.Text>
                                    </Form.Group>

                                    <Button 
                                        variant="primary" 
                                        onClick={handleDebugTest}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Testing...
                                            </>
                                        ) : 'Test Backend Integration'}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>

                        {error && (
                            <Alert variant="danger">
                                {error}
                            </Alert>
                        )}

                        {result && (
                            <Card>
                                <Card.Header>
                                    <h4 className="mb-0">Test Results</h4>
                                </Card.Header>
                                <Card.Body>
                                    <p><strong>Message:</strong> {result.message}</p>
                                    
                                    {result.foundPayUrl && (
                                        <div className="mb-3">
                                            <p><strong>Payment URL Found:</strong></p>
                                            <div className="border p-2 bg-light">
                                                <a href={result.foundPayUrl} target="_blank" rel="noopener noreferrer">
                                                    {result.foundPayUrl}
                                                </a>
                                            </div>
                                            <Button 
                                                variant="success" 
                                                className="mt-2"
                                                onClick={() => window.open(result.foundPayUrl, '_blank')}
                                            >
                                                Test Redirect
                                            </Button>
                                        </div>
                                    )}
                                    
                                    <div className="mt-3">
                                        <h5>Raw Response</h5>
                                        <pre className="border p-2 bg-light" style={{ maxHeight: '300px', overflow: 'auto' }}>
                                            {JSON.stringify(result.rawResponse || result, null, 2)}
                                        </pre>
                                    </div>
                                </Card.Body>
                            </Card>
                        )}
                    </Tab>
                    
                    <Tab eventKey="direct" title="Direct MoMo API Test">
                        <Card className="mb-4">
                            <Card.Body>
                                <Alert variant="info">
                                    This tab tests the direct MoMo API based on the official documentation at 
                                    <a href="https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method" target="_blank" rel="noopener noreferrer">
                                        {" "}developers.momo.vn
                                    </a>
                                </Alert>
                                
                                <Form>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Amount (VND)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(parseInt(e.target.value))}
                                            placeholder="Enter amount in VND"
                                            min={1000}
                                        />
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label>Order Info</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={orderInfo}
                                            onChange={(e) => setOrderInfo(e.target.value)}
                                            placeholder="Enter order description"
                                        />
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label>Payment Method (requestType)</Form.Label>
                                        <Form.Select 
                                            value={requestType}
                                            onChange={(e) => setRequestType(e.target.value)}
                                        >
                                            <option value="captureWallet">QR Code (captureWallet)</option>
                                            <option value="payWithATM">ATM Card (payWithATM)</option>
                                            <option value="payWithCC">Credit Card (payWithCC)</option>
                                            <option value="payWithMoMo">All Methods (payWithMoMo)</option>
                                        </Form.Select>
                                    </Form.Group>
                                    
                                    <Button 
                                        variant="danger" 
                                        onClick={handleDirectMomoTest}
                                        disabled={directLoading}
                                    >
                                        {directLoading ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Testing...
                                            </>
                                        ) : 'Test Direct MoMo API'}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                        
                        {directError && (
                            <Alert variant="danger">
                                {directError}
                            </Alert>
                        )}
                        
                        {directResult && (
                            <Card>
                                <Card.Header>
                                    <h4 className="mb-0">Direct API Test Results</h4>
                                </Card.Header>
                                <Card.Body>
                                    <p><strong>Message:</strong> {directResult.message}</p>
                                    
                                    {directResult.payUrl && (
                                        <div className="mb-3">
                                            <p><strong>Payment URL Found:</strong></p>
                                            <div className="border p-2 bg-light">
                                                <a href={directResult.payUrl} target="_blank" rel="noopener noreferrer">
                                                    {directResult.payUrl}
                                                </a>
                                            </div>
                                            <Button 
                                                variant="success" 
                                                className="mt-2"
                                                onClick={() => window.open(directResult.payUrl, '_blank')}
                                            >
                                                Test Redirect
                                            </Button>
                                        </div>
                                    )}
                                    
                                    <div className="mt-3">
                                        <h5>Raw Response</h5>
                                        <pre className="border p-2 bg-light" style={{ maxHeight: '300px', overflow: 'auto' }}>
                                            {JSON.stringify(directResult, null, 2)}
                                        </pre>
                                    </div>
                                </Card.Body>
                            </Card>
                        )}
                    </Tab>
                </Tabs>
                
                <Card className="mt-4">
                    <Card.Header>
                        <h4 className="mb-0">MoMo API Reference</h4>
                    </Card.Header>
                    <Card.Body>
                        <h5>MoMo API Sample Code</h5>
                        <pre className="border p-2 bg-light" style={{ maxHeight: '400px', overflow: 'auto' }}>
{`//https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
//parameters
var partnerCode = "MOMO";
var accessKey = "F8BBA842ECF85";
var secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
var requestId = partnerCode + new Date().getTime();
var orderId = requestId;
var orderInfo = "pay with MoMo";
var redirectUrl = "https://momo.vn/return";
var ipnUrl = "https://callback.url/notify";
var amount = "50000";
var requestType = "captureWallet"
var extraData = ""; 

//before sign HMAC SHA256 with format
var rawSignature = "accessKey="+accessKey+"&amount=" + amount+"&extraData=" + extraData+"&ipnUrl=" + ipnUrl+"&orderId=" + orderId+"&orderInfo=" + orderInfo+"&partnerCode=" + partnerCode +"&redirectUrl=" + redirectUrl+"&requestId=" + requestId+"&requestType=" + requestType
//puts raw signature
console.log("--------------------RAW SIGNATURE----------------")
console.log(rawSignature)
//signature
const crypto = require('crypto');
var signature = crypto.createHmac('sha256', secretkey)
    .update(rawSignature)
    .digest('hex');
console.log("--------------------SIGNATURE----------------")
console.log(signature)

//json object send to MoMo endpoint
const requestBody = JSON.stringify({
    partnerCode : partnerCode,
    accessKey : accessKey,
    requestId : requestId,
    amount : amount,
    orderId : orderId,
    orderInfo : orderInfo,
    redirectUrl : redirectUrl,
    ipnUrl : ipnUrl,
    extraData : extraData,
    requestType : requestType,
    signature : signature,
    lang: 'en'
});`}
                        </pre>
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
};

export default MomoDebug; 