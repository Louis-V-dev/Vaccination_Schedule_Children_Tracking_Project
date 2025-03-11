import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Nav } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaCheck, FaTimes } from 'react-icons/fa';
import axios from 'axios';

const ShiftChangeRequestStatus = () => {
    const [activeTab, setActiveTab] = useState('sent');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [action, setAction] = useState(''); // 'approve' or 'reject'

    useEffect(() => {
        fetchRequests();
    }, [activeTab]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const endpoint = activeTab === 'sent' ? 'sent' : 'received';
            const response = await axios.get(`http://localhost:8080/api/employee/schedules/shift-change-requests/${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setRequests(response.data.result);
        } catch (error) {
            toast.error('Failed to fetch shift change requests');
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleModalShow = (request, actionType) => {
        setSelectedRequest(request);
        setAction(actionType);
        setResponseMessage('');
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedRequest(null);
        setResponseMessage('');
        setAction('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            const url = `http://localhost:8080/api/employee/schedules/shift-change-requests/${selectedRequest.id}/${action}`;
            await axios.post(url, { message: responseMessage }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            toast.success(`Request ${action}ed successfully`);
            handleModalClose();
            fetchRequests();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${action} request`);
            console.error(`Error ${action}ing request:`, error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateTimeString) => {
        return new Date(dateTimeString).toLocaleString();
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return <Badge bg="warning">Pending</Badge>;
            case 'APPROVED':
                return <Badge bg="success">Approved</Badge>;
            case 'REJECTED':
                return <Badge bg="danger">Rejected</Badge>;
            default:
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    return (
        <Card>
            <Card.Header>
                <Nav variant="tabs">
                    <Nav.Item>
                        <Nav.Link 
                            active={activeTab === 'sent'} 
                            onClick={() => setActiveTab('sent')}
                        >
                            Sent Requests
                        </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link 
                            active={activeTab === 'received'} 
                            onClick={() => setActiveTab('received')}
                        >
                            Received Requests
                        </Nav.Link>
                    </Nav.Item>
                </Nav>
            </Card.Header>
            <Card.Body>
                <Table responsive striped bordered hover>
                    <thead>
                        <tr>
                            <th>Request Time</th>
                            {activeTab === 'sent' ? <th>Target</th> : <th>Requester</th>}
                            <th>Original Shift</th>
                            <th>Target Shift</th>
                            <th>Target Status</th>
                            <th>Admin Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(request => (
                            <tr key={request.id}>
                                <td>{formatDateTime(request.requestTime)}</td>
                                <td>
                                    {activeTab === 'sent' 
                                        ? request.target.fullName 
                                        : request.requester.fullName}
                                </td>
                                <td>
                                    {request.originalSchedule.shift.name}<br />
                                    <small>{new Date(request.originalSchedule.workDate).toLocaleDateString()}</small>
                                </td>
                                <td>
                                    {request.targetSchedule.shift.name}<br />
                                    <small>{new Date(request.targetSchedule.workDate).toLocaleDateString()}</small>
                                </td>
                                <td>{getStatusBadge(request.targetStatus)}</td>
                                <td>{getStatusBadge(request.adminStatus)}</td>
                                <td>
                                    {activeTab === 'received' && request.targetStatus === 'PENDING' && (
                                        <>
                                            <Button 
                                                variant="success" 
                                                size="sm" 
                                                className="me-2"
                                                onClick={() => handleModalShow(request, 'approve')}
                                            >
                                                <FaCheck />
                                            </Button>
                                            <Button 
                                                variant="danger" 
                                                size="sm"
                                                onClick={() => handleModalShow(request, 'reject')}
                                            >
                                                <FaTimes />
                                            </Button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {requests.length === 0 && (
                            <tr>
                                <td colSpan="7" className="text-center">
                                    No {activeTab} requests found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </Card.Body>

            <Modal show={showModal} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {action === 'approve' ? 'Approve' : 'Reject'} Shift Change Request
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedRequest && (
                        <Form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <strong>Requester:</strong> {selectedRequest.requester.fullName}<br />
                                <strong>Original Shift:</strong> {selectedRequest.originalSchedule.shift.name} on {new Date(selectedRequest.originalSchedule.workDate).toLocaleDateString()}<br />
                                <strong>Target Shift:</strong> {selectedRequest.targetSchedule.shift.name} on {new Date(selectedRequest.targetSchedule.workDate).toLocaleDateString()}<br />
                                <strong>Reason:</strong> {selectedRequest.reason}
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label>Response Message</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={responseMessage}
                                    onChange={(e) => setResponseMessage(e.target.value)}
                                    placeholder="Enter your response message (optional)"
                                />
                            </Form.Group>

                            <div className="d-grid gap-2">
                                <Button 
                                    variant={action === 'approve' ? 'success' : 'danger'} 
                                    type="submit" 
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : action === 'approve' ? 'Approve Request' : 'Reject Request'}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </Card>
    );
};

export default ShiftChangeRequestStatus; 