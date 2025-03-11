import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Nav, Badge, Table, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { scheduleService } from '../../services/scheduleService';

function WorkScheduleView() {
    const [activeTab, setActiveTab] = useState('calendar');
    const [schedules, setSchedules] = useState([]);
    const [sameRoleSchedules, setSameRoleSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [targetSchedule, setTargetSchedule] = useState(null);
    const [requestReason, setRequestReason] = useState('');
    const [sentRequests, setSentRequests] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 28 days from now
    });

    useEffect(() => {
        fetchSchedules();
        fetchRequests();
    }, [dateRange]);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Get user ID from local storage
            const userId = localStorage.getItem('userId');
            if (!userId) {
                throw new Error('User not authenticated');
            }

            const [mySchedules, roleSchedules] = await Promise.all([
                scheduleService.getMySchedules(dateRange.startDate, dateRange.endDate),
                scheduleService.getSameRoleSchedules(dateRange.startDate, dateRange.endDate)
            ]);
            
            setSchedules(mySchedules || []);
            setSameRoleSchedules(roleSchedules || []);
        } catch (err) {
            setError(err.message || 'Failed to load schedules');
            toast.error(err.message || 'Failed to load schedules');
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        try {
            setError(null);
            const [sent, received] = await Promise.all([
                scheduleService.getSentRequests(),
                scheduleService.getReceivedRequests()
            ]);
            setSentRequests(sent || []);
            setReceivedRequests(received || []);
        } catch (err) {
            setError(err.message || 'Failed to load requests');
            toast.error(err.message || 'Failed to load requests');
        }
    };

    const handleEventClick = (info) => {
        const schedule = info.event.extendedProps.schedule;
        setSelectedSchedule(schedule);
        setShowRequestModal(true);
    };

    const canRequestShiftChange = (schedule) => {
        if (!schedule) return false;
        
        const scheduleDate = new Date(schedule.workDate);
        const today = new Date();
        const daysDifference = Math.floor((scheduleDate - today) / (1000 * 60 * 60 * 24));
        return daysDifference >= 7;
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        if (!targetSchedule) {
            toast.error('Please select a target shift');
            return;
        }

        if (!canRequestShiftChange(selectedSchedule)) {
            toast.error('Shift change requests must be made at least 7 days in advance');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            await scheduleService.requestShiftChange({
                originalScheduleId: selectedSchedule.id,
                targetScheduleId: targetSchedule.id,
                reason: requestReason
            });
            
            toast.success('Shift change request sent successfully');
            setShowRequestModal(false);
            fetchRequests();
        } catch (err) {
            setError(err.message || 'Failed to send request');
            toast.error(err.message || 'Failed to send request');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestResponse = async (requestId, approve, message = '') => {
        try {
            setLoading(true);
            setError(null);
            
            if (approve) {
                await scheduleService.approveShiftChange(requestId, message);
                toast.success('Request approved');
            } else {
                await scheduleService.rejectShiftChange(requestId, message);
                toast.success('Request rejected');
            }
            
            fetchRequests();
        } catch (err) {
            setError(err.message || 'Failed to process request');
            toast.error(err.message || 'Failed to process request');
        } finally {
            setLoading(false);
        }
    };

    const events = [...schedules, ...sameRoleSchedules].map(schedule => ({
        id: schedule.id,
        title: `${schedule.shift.name} - ${schedule.employee.fullName}`,
        start: schedule.workDate + 'T' + schedule.shift.startTime,
        end: schedule.workDate + 'T' + schedule.shift.endTime,
        color: schedule.employee.id === localStorage.getItem('userId') ? '#0d6efd' : '#6c757d',
        extendedProps: { schedule }
    }));

    return (
        <Container fluid className="py-4">
            <Row className="mb-4">
                <Col>
                    <h1>Work Schedule</h1>
                </Col>
                <Col xs="auto">
                    <Form.Group className="d-flex align-items-center">
                        <Form.Label className="me-2 mb-0">Date Range:</Form.Label>
                        <Form.Control
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="me-2"
                        />
                        <Form.Label className="me-2 mb-0">to</Form.Label>
                        <Form.Control
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </Form.Group>
                </Col>
            </Row>

            {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

            <Nav variant="tabs" className="mb-3">
                <Nav.Item>
                    <Nav.Link 
                        onClick={() => setActiveTab('calendar')}
                        className={activeTab === 'calendar' ? 'active' : ''}
                    >
                        Calendar View
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link 
                        onClick={() => setActiveTab('requests')}
                        className={activeTab === 'requests' ? 'active' : ''}
                    >
                        Shift Change Requests
                    </Nav.Link>
                </Nav.Item>
            </Nav>

            {activeTab === 'calendar' && (
                <Card>
                    <Card.Body>
                        {loading ? (
                            <div className="text-center py-5">
                                <span className="spinner-border text-primary"></span>
                                <p className="mt-2">Loading schedules...</p>
                            </div>
                        ) : (
                            <FullCalendar
                                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                                }}
                                events={events}
                                eventClick={handleEventClick}
                                height="auto"
                            />
                        )}
                    </Card.Body>
                </Card>
            )}

            {activeTab === 'requests' && (
                <Row>
                    <Col md={6}>
                        <Card className="mb-4">
                            <Card.Header>
                                <h5 className="mb-0">Sent Requests</h5>
                            </Card.Header>
                            <Card.Body>
                                <Table responsive striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Target Employee</th>
                                            <th>Shifts</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sentRequests.map(request => (
                                            <tr key={request.id}>
                                                <td>{new Date(request.requestTime).toLocaleDateString()}</td>
                                                <td>{request.target.fullName}</td>
                                                <td>
                                                    From: {request.originalSchedule.shift.name}<br/>
                                                    To: {request.targetSchedule.shift.name}
                                                </td>
                                                <td>
                                                    <Badge bg={
                                                        request.status === 'PENDING' ? 'warning' :
                                                        request.status === 'APPROVED' ? 'success' : 'danger'
                                                    }>
                                                        {request.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={6}>
                        <Card>
                            <Card.Header>
                                <h5 className="mb-0">Received Requests</h5>
                            </Card.Header>
                            <Card.Body>
                                <Table responsive striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Requester</th>
                                            <th>Shifts</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {receivedRequests.map(request => (
                                            <tr key={request.id}>
                                                <td>{new Date(request.requestTime).toLocaleDateString()}</td>
                                                <td>{request.requester.fullName}</td>
                                                <td>
                                                    From: {request.originalSchedule.shift.name}<br/>
                                                    To: {request.targetSchedule.shift.name}
                                                </td>
                                                <td>
                                                    <Badge bg={
                                                        request.status === 'PENDING' ? 'warning' :
                                                        request.status === 'APPROVED' ? 'success' : 'danger'
                                                    }>
                                                        {request.status}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {request.status === 'PENDING' && (
                                                        <>
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                className="me-2"
                                                                onClick={() => handleRequestResponse(request.id, true)}
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleRequestResponse(request.id, false)}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Shift Change Request Modal */}
            <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Request Shift Change</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedSchedule && (
                        <Form onSubmit={handleRequestSubmit}>
                            <div className="mb-3">
                                <strong>Current Shift:</strong><br/>
                                Date: {new Date(selectedSchedule.workDate).toLocaleDateString()}<br/>
                                Time: {selectedSchedule.shift.startTime} - {selectedSchedule.shift.endTime}
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label>Select Target Shift</Form.Label>
                                <Form.Select
                                    value={targetSchedule?.id || ''}
                                    onChange={(e) => {
                                        const selected = sameRoleSchedules.find(s => s.id === e.target.value);
                                        setTargetSchedule(selected);
                                    }}
                                    required
                                >
                                    <option value="">Choose a shift to swap with</option>
                                    {sameRoleSchedules
                                        .filter(s => s.id !== selectedSchedule.id)
                                        .map(schedule => (
                                            <option key={schedule.id} value={schedule.id}>
                                                {schedule.employee.fullName} - {schedule.shift.name} - {new Date(schedule.workDate).toLocaleDateString()}
                                            </option>
                                        ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Reason</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={requestReason}
                                    onChange={(e) => setRequestReason(e.target.value)}
                                    required
                                    placeholder="Please provide a reason for the shift change request"
                                />
                            </Form.Group>

                            <div className="d-grid">
                                <Button 
                                    variant="primary" 
                                    type="submit"
                                    disabled={!canRequestShiftChange(selectedSchedule)}
                                >
                                    Send Request
                                </Button>
                                {!canRequestShiftChange(selectedSchedule) && (
                                    <small className="text-danger mt-2">
                                        Shift change requests must be made at least 7 days in advance
                                    </small>
                                )}
                            </div>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
}

export default WorkScheduleView; 