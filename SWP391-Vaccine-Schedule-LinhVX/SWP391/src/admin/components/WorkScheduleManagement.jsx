import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Alert, Nav } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaCalendarAlt, FaList } from 'react-icons/fa';
import axios from 'axios';
import { scheduleService } from '../../services/scheduleService';
import { validateSchedule } from '../../utils/validation';
import TablePaginationFilter from '../../components/TablePaginationFilter';
import ScheduleCalendar from '../../components/ScheduleCalendar';

const WorkScheduleManagement = () => {
    const [view, setView] = useState('calendar'); // 'calendar' or 'list'
    const [schedules, setSchedules] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [scheduleRows, setScheduleRows] = useState([{
        dayOfWeek: 1,
        shiftId: ''
    }]);
    const [formData, setFormData] = useState({
        employeeId: '',
        applyFromThisWeek: false
    });
    const [errors, setErrors] = useState({});

    // Pagination state
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [sortField, setSortField] = useState('workDate');
    const [sortDirection, setSortDirection] = useState('asc');
    const [filterText, setFilterText] = useState('');

    // Date range for calendar
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(new Date().setDate(new Date().getDate() + 28)));

    const sortOptions = [
        { value: 'workDate', label: 'Date' },
        { value: 'shift.name', label: 'Shift' },
        { value: 'employee.firstName', label: 'Employee' }
    ];

    useEffect(() => {
        fetchShifts();
        fetchRoles();
        if (view === 'list') {
            fetchSchedules();
        } else {
            fetchCalendarSchedules();
        }
    }, [view, page, pageSize, sortField, sortDirection, filterText]);

    useEffect(() => {
        if (selectedRole) {
            fetchEmployeesByRole();
        }
    }, [selectedRole]);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const response = await scheduleService.getEmployeeSchedules(
                null,
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0],
                page,
                pageSize,
                `${sortField},${sortDirection}`
            );
            setSchedules(response.result.content);
            setTotalPages(response.result.totalPages);
            setTotalElements(response.result.totalElements);
        } catch (error) {
            toast.error(error.message || 'Failed to fetch schedules');
            console.error('Error fetching schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCalendarSchedules = async () => {
        try {
            setLoading(true);
            const response = await scheduleService.getEmployeeSchedules(
                null,
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            );
            setSchedules(response.result);
        } catch (error) {
            toast.error(error.message || 'Failed to fetch schedules');
            console.error('Error fetching schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchShifts = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/admin/shifts', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setShifts(response.data.result.filter(shift => shift.status));
        } catch (error) {
            toast.error('Failed to fetch shifts');
            console.error('Error fetching shifts:', error);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await axios.get('http://localhost:8080/api/admin/roles', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setRoles(response.data.result);
        } catch (error) {
            toast.error('Failed to fetch roles');
            console.error('Error fetching roles:', error);
        }
    };

    const fetchEmployeesByRole = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/admin/schedules/employees/by-role/${selectedRole}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setEmployees(response.data.result);
        } catch (error) {
            toast.error('Failed to fetch employees');
            console.error('Error fetching employees:', error);
        }
    };

    const handleModalShow = () => {
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setScheduleRows([{ dayOfWeek: 1, shiftId: '' }]);
        setFormData({
            employeeId: '',
            applyFromThisWeek: false
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddRow = () => {
        const lastRow = scheduleRows[scheduleRows.length - 1];
        const nextDayOfWeek = lastRow.dayOfWeek < 7 ? lastRow.dayOfWeek + 1 : 1;
        
        setScheduleRows(prev => [...prev, {
            dayOfWeek: nextDayOfWeek,
            shiftId: ''
        }]);
    };

    const handleRemoveRow = (index) => {
        setScheduleRows(prev => prev.filter((_, i) => i !== index));
    };

    const handleRowChange = (index, field, value) => {
        setScheduleRows(prev => prev.map((row, i) => {
            if (i === index) {
                return { ...row, [field]: value };
            }
            return row;
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const scheduleData = {
            employeeId: formData.employeeId,
            applyFromThisWeek: formData.applyFromThisWeek,
            weeklySchedules: [{
                dailySchedules: scheduleRows.map(row => ({
                    dayOfWeek: row.dayOfWeek,
                    shiftId: row.shiftId
                }))
            }]
        };

        const validationErrors = validateSchedule(scheduleData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setLoading(true);
            await scheduleService.createSchedule(scheduleData);
            toast.success('Schedule created successfully');
            handleModalClose();
            if (view === 'list') {
                fetchSchedules();
            } else {
                fetchCalendarSchedules();
            }
        } catch (error) {
            toast.error(error.message || 'Failed to create schedule');
            console.error('Error creating schedule:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelect = (selectInfo) => {
        // Handle date selection in calendar view
        const selectedDate = selectInfo.start;
        setShowModal(true);
        setFormData(prev => ({
            ...prev,
            applyFromThisWeek: false
        }));
    };

    const handleEventClick = (schedule) => {
        // Handle schedule click in calendar view
        toast.info(`${schedule.employee.fullName}'s shift: ${schedule.shift.name}`);
    };

    const getDayName = (dayOfWeek) => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days[dayOfWeek - 1];
    };

    return (
        <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                    <h4 className="mb-0 me-4">Work Schedule Management</h4>
                    <Nav variant="pills">
                        <Nav.Item>
                            <Nav.Link 
                                active={view === 'calendar'} 
                                onClick={() => setView('calendar')}
                            >
                                <FaCalendarAlt className="me-2" />
                                Calendar View
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link 
                                active={view === 'list'} 
                                onClick={() => setView('list')}
                            >
                                <FaList className="me-2" />
                                List View
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>
                </div>
                <Button variant="success" onClick={() => setShowModal(true)}>
                    <FaPlus className="me-2" />
                    Create Schedule
                </Button>
            </Card.Header>
            <Card.Body>
                {view === 'list' ? (
                    <>
                        <TablePaginationFilter
                            page={page}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalElements={totalElements}
                            sortField={sortField}
                            sortDirection={sortDirection}
                            filterText={filterText}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                            onSortChange={(field, direction) => {
                                setSortField(field);
                                setSortDirection(direction);
                            }}
                            onFilterChange={setFilterText}
                            sortOptions={sortOptions}
                        />

                        <Table responsive striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Employee</th>
                                    <th>Shift</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.map(schedule => (
                                    <tr key={schedule.id}>
                                        <td>{new Date(schedule.workDate).toLocaleDateString()}</td>
                                        <td>{schedule.employee.fullName}</td>
                                        <td>{schedule.shift.name}</td>
                                        <td>{schedule.shift.startTime} - {schedule.shift.endTime}</td>
                                        <td>{schedule.isPatternGenerated ? 'Pattern Generated' : 'Manual'}</td>
                                    </tr>
                                ))}
                                {schedules.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center">
                                            {loading ? 'Loading...' : 'No schedules found'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </>
                ) : (
                    <ScheduleCalendar
                        schedules={schedules}
                        onEventClick={handleEventClick}
                        isAdmin={true}
                        onDateSelect={handleDateSelect}
                    />
                )}
            </Card.Body>

            <Modal show={showModal} onHide={handleModalClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Create Work Schedule</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Select Role</Form.Label>
                                    <Form.Select
                                        value={selectedRole}
                                        onChange={(e) => setSelectedRole(e.target.value)}
                                        required
                                    >
                                        <option value="">Choose role...</option>
                                        {roles.map(role => (
                                            <option key={role.id} value={role.name}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Select Employee</Form.Label>
                                    <Form.Select
                                        name="employeeId"
                                        value={formData.employeeId}
                                        onChange={handleInputChange}
                                        required
                                        disabled={!selectedRole}
                                    >
                                        <option value="">Choose employee...</option>
                                        {employees.map(employee => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.firstName} {employee.lastName}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Apply from this week"
                                name="applyFromThisWeek"
                                checked={formData.applyFromThisWeek}
                                onChange={handleInputChange}
                            />
                        </Form.Group>

                        <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h5>Weekly Schedule</h5>
                                <Button variant="outline-primary" size="sm" onClick={handleAddRow}>
                                    <FaPlus className="me-1" /> Add Day
                                </Button>
                            </div>

                            {scheduleRows.map((row, index) => (
                                <Row key={index} className="mb-2 align-items-end">
                                    <Col md={4}>
                                        <Form.Group>
                                            <Form.Label>Day</Form.Label>
                                            <Form.Select
                                                value={row.dayOfWeek}
                                                onChange={(e) => handleRowChange(index, 'dayOfWeek', parseInt(e.target.value))}
                                                required
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                                                    <option key={day} value={day}>
                                                        {getDayName(day)}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Shift</Form.Label>
                                            <Form.Select
                                                value={row.shiftId}
                                                onChange={(e) => handleRowChange(index, 'shiftId', e.target.value)}
                                                required
                                            >
                                                <option value="">Select shift...</option>
                                                {shifts.map(shift => (
                                                    <option key={shift.id} value={shift.id}>
                                                        {shift.name} ({shift.startTime} - {shift.endTime})
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={2}>
                                        <Button 
                                            variant="danger" 
                                            size="sm" 
                                            onClick={() => handleRemoveRow(index)}
                                            disabled={scheduleRows.length === 1}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </Col>
                                </Row>
                            ))}
                        </div>

                        <Alert variant="info">
                            This schedule will be repeated for 4 weeks.
                        </Alert>

                        <div className="d-grid gap-2">
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'Creating Schedule...' : 'Create Schedule'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Card>
    );
};

export default WorkScheduleManagement; 