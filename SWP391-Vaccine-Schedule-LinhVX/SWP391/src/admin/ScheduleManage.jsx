import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Nav, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import AdminLayout from './AdminLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { scheduleService, shiftService } from '../services/scheduleService';
import { FaPlus, FaEdit, FaTrash, FaEye, FaCalendarAlt } from 'react-icons/fa';
import PatternManagement from './components/PatternManagement';
import axios from 'axios';

function ScheduleManage() {
    const [activeTab, setActiveTab] = useState('calendar');
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [shiftChangeRequests, setShiftChangeRequests] = useState([]);
    const [showShiftsModal, setShowShiftsModal] = useState(false);
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);
    const [scheduleForm, setScheduleForm] = useState({
        employeeId: '',
        weeklySchedules: [],
        applyFromThisWeek: false,
        isPattern: true
    });
    const [dateRange, setDateRange] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 28 days from now
    });

    useEffect(() => {
        fetchSchedules();
        fetchEmployees();
        fetchShifts();
        fetchRoles();
        fetchShiftChangeRequests();
        setupAutoScheduleExtension();
    }, [dateRange]);

    // Auto extend schedules on Monday
    const setupAutoScheduleExtension = () => {
        const checkAndExtendSchedules = async () => {
            const today = new Date();
            if (today.getDay() === 1) { // Monday
                try {
                    await scheduleService.extendSchedules();
                    toast.success('Schedules extended for next 4 weeks');
                    fetchSchedules();
                } catch (err) {
                    toast.error('Failed to extend schedules');
                }
            }
        };

        // Check daily
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        const timeUntilTomorrow = tomorrow - now;

        setTimeout(() => {
            checkAndExtendSchedules();
            setInterval(checkAndExtendSchedules, 24 * 60 * 60 * 1000); // Check every 24 hours
        }, timeUntilTomorrow);
    };

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const data = await scheduleService.getAllSchedules(dateRange.startDate, dateRange.endDate);
            setSchedules(data || []);
        } catch (err) {
            setError(err.message || 'Failed to load schedules');
            toast.error(err.message || 'Failed to load schedules');
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            if (selectedRole) {
                const response = await axios.get(`http://localhost:8080/api/admin/schedules/employees/by-role/${selectedRole}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.data && response.data.result) {
                    setEmployees(response.data.result);
                } else {
                    setEmployees([]);
                }
            } else {
                setEmployees([]);
            }
        } catch (err) {
            console.error('Error fetching employees:', err);
            toast.error('Failed to load employees');
            setEmployees([]);
        }
    };

    const fetchShifts = async () => {
        try {
            const response = await shiftService.getAllShifts();
            console.log('Shifts fetched:', response);
            
            if (response?.result && Array.isArray(response.result)) {
                // Don't filter by status - show all shifts
                console.log('All shifts:', response.result);
                setShifts(response.result || []);
            } else {
                console.error('Invalid shifts response structure:', response);
                setShifts([]); // Set empty array as fallback
            }
        } catch (error) {
            console.error('Error in fetchShifts:', error);
            setShifts([]); // Set empty array as fallback
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/users/roles', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.data && response.data.result) {
                console.log('Raw roles data:', response.data.result);
                const rolesData = response.data.result.map(role => ({
                    id: role.roleId.toString(),
                    name: role.role_Name
                }));
                console.log('Mapped roles data:', rolesData);
                setRoles(rolesData);
            } else {
                // Fallback roles if API fails
                setRoles([
                    { id: '1', name: 'DOCTOR' },
                    { id: '2', name: 'NURSE' },
                    { id: '3', name: 'STAFF' }
                ]);
            }
        } catch (err) {
            console.error('Error fetching roles:', err);
            toast.error('Failed to load roles');
            // Set fallback roles
            setRoles([
                { id: '1', name: 'DOCTOR' },
                { id: '2', name: 'NURSE' },
                { id: '3', name: 'STAFF' }
            ]);
        }
    };

    const fetchShiftChangeRequests = async () => {
        try {
            setLoading(true);
            console.log('Fetching shift change requests...');
            const data = await scheduleService.fetchShiftChangeRequests();
            console.log('Shift change requests fetched:', data);
            
            // If data is null or undefined, use an empty array
            setShiftChangeRequests(data || []);
        } catch (err) {
            console.error('Error in fetchShiftChangeRequests:', err);
            setError(err.message || 'Failed to load shift change requests');
            toast.error(err.message || 'Failed to load shift change requests');
            setShiftChangeRequests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (roleId) => {
        try {
            console.log('Selected role ID:', roleId);
            if (!roleId) {
                setSelectedRoleId('');
                setSelectedRole('');
                setEmployees([]);
                return;
            }

            const selectedRoleObj = roles.find(role => role.id === roleId);
            console.log('Found role object:', selectedRoleObj);

            if (selectedRoleObj) {
                setSelectedRoleId(roleId);
                setSelectedRole(selectedRoleObj.name);
                console.log('Setting role name:', selectedRoleObj.name);
                
                // Fetch employees for the selected role
                await fetchEmployeesByRole(selectedRoleObj.name);
            }
        } catch (error) {
            console.error('Error in handleRoleChange:', error);
            toast.error('Failed to update role selection');
        }
    };

    const fetchEmployeesByRole = async (roleName) => {
        try {
            console.log('Fetching employees for role:', roleName);
            const response = await axios.get(`http://localhost:8080/api/admin/schedules/employees/by-role/${roleName}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            console.log('Employee API response:', response.data);
            
            if (response.data && response.data.result) {
                const employeeData = response.data.result;
                console.log('Setting employees:', employeeData);
                setEmployees(employeeData);
            } else {
                console.log('No employees found for role:', roleName);
                setEmployees([]);
            }
        } catch (err) {
            console.error('Error fetching employees:', err);
            toast.error('Failed to load employees');
            setEmployees([]);
        }
    };

    const handleShiftSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form data
        const errors = [];
        
        // Check required fields
        if (!selectedShift.name || selectedShift.name.trim() === '') {
            errors.push('Shift name is required');
        }
        
        // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(selectedShift.startTime)) {
            errors.push('Start time must be in HH:mm format');
        }
        if (!timeRegex.test(selectedShift.endTime)) {
            errors.push('End time must be in HH:mm format');
        }
        
        // Display validation errors if any
        if (errors.length > 0) {
            toast.error(`Please fix the following errors: ${errors.join(', ')}`);
            return;
        }
        
        setLoading(true);
        try {
            // If shift has ID, it's an update, otherwise a new shift
            if (selectedShift.id) {
                await shiftService.updateShift(selectedShift.id, selectedShift);
                toast.success('Shift updated successfully');
            } else {
                // For new shifts, just pass the data directly to createShift
                // Our updated shiftService will handle both name and shift_name
                console.log('Creating shift with data:', selectedShift);
                await shiftService.createShift(selectedShift);
                toast.success('Shift created successfully');
            }
            setSelectedShift(null); // Close modal by setting selectedShift to null
            fetchShifts();
        } catch (error) {
            console.error('Error saving shift:', error);
            toast.error(`Error saving shift: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            
            // Validate required fields
            if (!scheduleForm.employeeId) {
                toast.error('Please select an employee');
                return;
            }

            // Filter out empty shifts and format weekly schedules
            const weeklySchedules = [];
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            
            days.forEach((day, index) => {
                const shiftId = scheduleForm.weeklySchedules[index]?.shiftId;
                if (shiftId) {
                    // If there's no week in the array yet or the current week is full, create a new week
                    if (weeklySchedules.length === 0 || weeklySchedules[weeklySchedules.length - 1].dailySchedules.length >= 7) {
                        weeklySchedules.push({
                            weekNumber: weeklySchedules.length + 1,
                            dailySchedules: []
                        });
                    }
                    
                    // Add the daily schedule to the current week
                    weeklySchedules[weeklySchedules.length - 1].dailySchedules.push({
                        dayOfWeek: index + 1,
                        shiftId: shiftId
                    });
                }
            });

            if (weeklySchedules.length === 0 || weeklySchedules[0].dailySchedules.length === 0) {
                toast.error('Please assign at least one shift');
                return;
            }

            const scheduleData = {
                employeeId: scheduleForm.employeeId,
                applyFromThisWeek: scheduleForm.applyFromThisWeek,
                weeklySchedules: weeklySchedules,
                numberOfWeeks: scheduleForm.applyFromThisWeek ? 4 : 1 // Only generate 4 weeks if applying from this week
            };
            
            console.log('Submitting schedule data:', scheduleData);
            
            // First, deactivate old patterns
            try {
                await axios.post(`http://localhost:8080/api/admin/patterns/deactivate/${scheduleForm.employeeId}`, null, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                console.log('Old patterns deactivated');
            } catch (error) {
                console.error('Error deactivating old patterns:', error);
                // Continue with schedule creation even if pattern deactivation fails
            }

            // Create new schedule
            const response = await axios.post('http://localhost:8080/api/admin/schedules', scheduleData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.code === 100) {
                toast.success('Schedule pattern created successfully');
                if (scheduleForm.applyFromThisWeek) {
                    toast.info('Schedules generated for the next 4 weeks');
                } else {
                    toast.info('Schedule pattern saved. Use regenerate to apply it.');
                }
                setShowAddModal(false);
                fetchSchedules(); // Refresh the schedules list
            } else {
                throw new Error(response.data?.message || 'Failed to create schedule');
            }
        } catch (err) {
            console.error('Error creating schedule:', err);
            toast.error(err.message || 'Failed to create schedule');
        } finally {
            setLoading(false);
        }
    };

    // Add a function to handle shift selection
    const handleShiftSelection = (dayIndex, shiftId) => {
        setScheduleForm(prev => {
            const newWeeklySchedules = [...prev.weeklySchedules];
            newWeeklySchedules[dayIndex] = {
                dayOfWeek: dayIndex + 1,
                shiftId: shiftId
            };
            return {
                ...prev,
                weeklySchedules: newWeeklySchedules
            };
        });
    };

    const handleShiftChangeResponse = async (requestId, approve, message) => {
        try {
            if (approve) {
                await scheduleService.adminApproveShiftChange(requestId, message);
                toast.success('Shift change request approved');
            } else {
                await scheduleService.adminRejectShiftChange(requestId, message);
                toast.success('Shift change request rejected');
            }
            fetchShiftChangeRequests();
            fetchSchedules();
        } catch (err) {
            toast.error(err.message || 'Failed to process request');
        }
    };

    const events = schedules.map(schedule => ({
        id: schedule.id,
        title: `${schedule.employee.fullName} - ${schedule.shift.name}`,
        start: schedule.workDate + 'T' + schedule.shift.startTime,
        end: schedule.workDate + 'T' + schedule.shift.endTime,
        color: schedule.isPattern ? '#6c757d' : '#0d6efd',
        extendedProps: { schedule }
    }));

    const handleViewShifts = () => {
        setShowShiftsModal(true);
    };

    const handleEditShift = (shift) => {
        setSelectedShift(shift);
        setShowShiftModal(true);
        setShowShiftsModal(false);
    };

    const handleAddShift = () => {
        setSelectedShift({
            name: '',
            startTime: '08:00',
            endTime: '17:00',
            status: true
        });
        setShowShiftModal(true);
    };
    
    const handleDateRangeChange = (field, value) => {
        setDateRange(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <AdminLayout>
            <Container fluid className="py-4">
                {error && <Alert variant="danger">{error}</Alert>}
                
                <Row className="mb-4">
                    <Col>
                        <h1>Schedule Management</h1>
                    </Col>
                    <Col xs="auto">
                        <Button variant="info" className="me-2" onClick={handleViewShifts}>
                            <FaEye className="me-1" /> View Shifts
                        </Button>
                        <Button variant="success" className="me-2" onClick={handleAddShift}>
                            <FaPlus className="me-1" /> Add Shift
                        </Button>
                        <Button variant="primary" onClick={() => setShowAddModal(true)}>
                            <FaPlus className="me-1" /> Add Schedule
                        </Button>
                    </Col>
                </Row>

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
                            onClick={() => setActiveTab('patterns')}
                            className={activeTab === 'patterns' ? 'active' : ''}
                        >
                            <FaCalendarAlt className="me-1" /> Pattern Management
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
                    <>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group className="d-flex align-items-center">
                                    <Form.Label className="me-2 mb-0">Date Range:</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={dateRange.startDate}
                                        onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                                        className="me-2"
                                    />
                                    <Form.Label className="me-2 mb-0">to</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={dateRange.endDate}
                                        onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        
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
                                        firstDay={1}  // Start week from Monday
                                        editable={false}
                                        selectable={true}
                                        selectMirror={true}
                                        dayMaxEvents={true}
                                        weekends={true}
                                        events={events}
                                        height="auto"
                                    />
                                )}
                            </Card.Body>
                        </Card>
                    </>
                )}
                
                {activeTab === 'patterns' && (
                    <PatternManagement />
                )}

                {activeTab === 'requests' && (
                    <Card>
                        <Card.Body>
                            <Table responsive striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Requester</th>
                                        <th>Original Shift</th>
                                        <th>Target Shift</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shiftChangeRequests.map(request => (
                                        <tr key={request.id}>
                                            <td>{new Date(request.requestTime).toLocaleDateString()}</td>
                                            <td>{request.requester.fullName}</td>
                                            <td>
                                                {request.originalSchedule.shift.name}<br/>
                                                <small>{new Date(request.originalSchedule.workDate).toLocaleDateString()}</small>
                                            </td>
                                            <td>
                                                {request.targetSchedule.shift.name}<br/>
                                                <small>{new Date(request.targetSchedule.workDate).toLocaleDateString()}</small>
                                            </td>
                                            <td>{request.reason}</td>
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
                                                            onClick={() => handleShiftChangeResponse(request.id, true)}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleShiftChangeResponse(request.id, false)}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {shiftChangeRequests.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="text-center">No shift change requests found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                )}

                {/* Add Schedule Modal */}
                <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Create Work Schedule</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleScheduleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Role</Form.Label>
                                <Form.Select 
                                    value={selectedRoleId || ''}
                                    onChange={(e) => handleRoleChange(e.target.value)}
                                    required
                                >
                                    <option value="">Select Role</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Employee</Form.Label>
                                <Form.Select
                                    value={scheduleForm.employeeId}
                                    onChange={(e) => setScheduleForm({
                                        ...scheduleForm,
                                        employeeId: e.target.value
                                    })}
                                    disabled={!selectedRole}
                                    required
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.fullName}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <div className="mb-3">
                                <h6>Weekly Schedule</h6>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
                                    <Row key={day} className="mb-2">
                                        <Col md={3}>
                                            <Form.Label>{day}</Form.Label>
                                        </Col>
                                        <Col md={9}>
                                            <Form.Select
                                                value={scheduleForm.weeklySchedules[index]?.shiftId || ''}
                                                onChange={(e) => handleShiftSelection(index, e.target.value)}
                                                disabled={!scheduleForm.employeeId}
                                            >
                                                <option value="">No Shift</option>
                                                {shifts.filter(shift => shift.status).map(shift => (
                                                    <option key={shift.id} value={shift.id}>
                                                        {shift.name} ({shift.startTime} - {shift.endTime})
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Col>
                                    </Row>
                                ))}
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    label="Apply from this week (generates schedules for next 4 weeks)"
                                    checked={scheduleForm.applyFromThisWeek}
                                    onChange={(e) => setScheduleForm({
                                        ...scheduleForm,
                                        applyFromThisWeek: e.target.checked
                                    })}
                                />
                            </Form.Group>

                            <div className="d-grid">
                                <Button variant="primary" type="submit" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Schedule Pattern'}
                                </Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>

                {/* Shifts View Modal */}
                <Modal show={showShiftsModal} onHide={() => setShowShiftsModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>All Shifts</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {loading ? (
                            <div className="text-center py-3">
                                <span className="spinner-border text-primary"></span>
                                <p className="mt-2">Loading shifts...</p>
                            </div>
                        ) : (
                            <Table responsive striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Start Time</th>
                                        <th>End Time</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shifts.map((shift, index) => (
                                        <tr key={shift.id} className={!shift.status ? 'table-secondary' : ''}>
                                            <td>{index + 1}</td>
                                            <td>{shift.name}</td>
                                            <td>{shift.startTime}</td>
                                            <td>{shift.endTime}</td>
                                            <td>
                                                <Badge bg={shift.status ? 'success' : 'danger'}>
                                                    {shift.status ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Button 
                                                    variant="warning" 
                                                    size="sm" 
                                                    onClick={() => handleEditShift(shift)}
                                                >
                                                    <FaEdit /> Edit
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {shifts.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center">No shifts found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowShiftsModal(false)}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={() => {
                            setShowShiftsModal(false);
                            handleAddShift();
                        }}>
                            <FaPlus className="me-1" /> Add New Shift
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Shift Modal */}
                <Modal show={selectedShift !== null} onHide={() => setSelectedShift(null)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{selectedShift?.id ? 'Edit Shift' : 'Add New Shift'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleShiftSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Shift Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={selectedShift?.name || ''}
                                    onChange={(e) => setSelectedShift({
                                        ...selectedShift,
                                        name: e.target.value
                                    })}
                                    required
                                />
                            </Form.Group>

                            <Row>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Start Time</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={selectedShift?.startTime || ''}
                                            onChange={(e) => setSelectedShift({
                                                ...selectedShift,
                                                startTime: e.target.value
                                            })}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>End Time</Form.Label>
                                        <Form.Control
                                            type="time"
                                            value={selectedShift?.endTime || ''}
                                            onChange={(e) => setSelectedShift({
                                                ...selectedShift,
                                                endTime: e.target.value
                                            })}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    label="Active"
                                    checked={selectedShift?.status || false}
                                    onChange={(e) => setSelectedShift({
                                        ...selectedShift,
                                        status: e.target.checked
                                    })}
                                />
                            </Form.Group>

                            <div className="d-grid">
                                <Button variant="primary" type="submit">
                                    {selectedShift?.id ? 'Update Shift' : 'Create Shift'}
                                </Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>
            </Container>
        </AdminLayout>
    );
}

export default ScheduleManage; 