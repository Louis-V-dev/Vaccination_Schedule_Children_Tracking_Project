import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Form, Modal, Tabs, Tab, Row, Col, Alert, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { scheduleService, shiftService } from '../../services/scheduleService';
import { FaPlus, FaEdit, FaTrash, FaSync } from 'react-icons/fa';

const PatternManagement = () => {
    const [patterns, setPatterns] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create, edit
    const [selectedPattern, setSelectedPattern] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        employeeId: '',
        shifts: [],
        regenerateSchedules: false
    });
    
    useEffect(() => {
        fetchPatterns();
        fetchEmployees();
        fetchShifts();
        fetchRoles();
    }, []);
    
    const fetchPatterns = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await scheduleService.getAllPatterns();
            setPatterns(data || []);
        } catch (err) {
            setError(err.message || 'Failed to load patterns');
            toast.error(err.message || 'Failed to load patterns');
        } finally {
            setLoading(false);
        }
    };
    
    const fetchEmployees = async () => {
        try {
            if (selectedRole) {
                const data = await scheduleService.getEmployeesByRole(selectedRole);
                setEmployees(data || []);
            } else {
                // Fetch all employees if no role is selected
                // This is a placeholder - you may need to implement an endpoint to get all employees
                const data = await scheduleService.getEmployeesByRole('EMPLOYEE');
                setEmployees(data || []);
            }
        } catch (err) {
            toast.error('Failed to load employees');
        }
    };
    
    const fetchShifts = async () => {
        try {
            const response = await shiftService.getAllShifts();
            console.log('Fetched shifts:', response); // Debug log
            
            if (response && Array.isArray(response.result)) {
                const activeShifts = response.result.filter(shift => shift.status);
                console.log('Active shifts:', activeShifts); // Debug log
                setShifts(activeShifts);
            } else {
                console.error('Invalid shifts response structure:', response);
                toast.error('Failed to load shifts: Invalid response format');
                setShifts([]); // Set empty array as fallback
            }
        } catch (err) {
            console.error('Error fetching shifts:', err); // Debug log
            toast.error('Failed to load shifts');
            setShifts([]); // Set empty array as fallback
        }
    };
    
    const fetchRoles = async () => {
        try {
            // This is a placeholder - you may need to implement an endpoint to get all roles
            setRoles([
                { id: 'DOCTOR', name: 'Doctor' },
                { id: 'NURSE', name: 'Nurse' },
                { id: 'STAFF', name: 'Staff' }
            ]);
        } catch (err) {
            toast.error('Failed to load roles');
        }
    };
    
    const handleRoleChange = (roleId) => {
        setSelectedRole(roleId);
        fetchEmployees();
    };
    
    const handleCreatePattern = () => {
        // Initialize empty pattern with 4 weeks
        const emptyShifts = [];
        for (let week = 1; week <= 4; week++) {
            for (let day = 1; day <= 7; day++) {
                // Only add entries for weekdays (1-5)
                if (day <= 5) {
                    emptyShifts.push({
                        weekNumber: week,
                        dayOfWeek: day,
                        shiftId: null
                    });
                }
            }
        }
        
        setFormData({
            name: '',
            employeeId: '',
            shifts: emptyShifts,
            regenerateSchedules: false
        });
        
        setModalMode('create');
        setShowModal(true);
    };
    
    const handleEditPattern = (pattern) => {
        setSelectedPattern(pattern);
        console.log('Pattern data:', pattern);
        
        // Initialize with empty shifts for all days
        const emptyShifts = [];
        for (let week = 1; week <= 4; week++) {
            for (let day = 1; day <= 7; day++) {
                emptyShifts.push({
                    weekNumber: week,
                    dayOfWeek: day,
                    shiftId: null
                });
            }
        }
        
        // Fill in the shifts from the pattern's patternShifts
        if (pattern.patternShifts && Array.isArray(pattern.patternShifts)) {
            console.log('Pattern shifts:', pattern.patternShifts); // Debug log
            pattern.patternShifts.forEach(patternShift => {
                console.log('Processing shift:', patternShift); // Debug log
                const shiftIndex = emptyShifts.findIndex(
                    shift => shift.weekNumber === patternShift.weekNumber && 
                            shift.dayOfWeek === patternShift.dayOfWeek
                );
                console.log('Found at index:', shiftIndex); // Debug log
                if (shiftIndex !== -1) {
                    // Get the shift ID directly from patternShift
                    const shiftId = patternShift.shiftId || (patternShift.shift ? patternShift.shift.id : null);
                    console.log('Setting shift ID:', shiftId); // Debug log
                    emptyShifts[shiftIndex].shiftId = shiftId;
                }
            });
        }

        console.log('Final shifts array:', emptyShifts); // Debug log

        setFormData({
            name: pattern.name || '',
            employeeId: pattern.employeeId || '',
            shifts: emptyShifts,
            regenerateSchedules: false
        });
        
        setSelectedRole('');
        setModalMode('edit');
        setShowModal(true);
    };
    
    const handleRegenerateSchedules = async (patternId) => {
        try {
            setLoading(true);
            await scheduleService.regenerateSchedules(patternId);
            toast.success('Schedules regenerated successfully');
        } catch (err) {
            toast.error(err.message || 'Failed to regenerate schedules');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePattern = async (patternId) => {
        if (!window.confirm('Are you sure you want to delete this pattern? This will also delete all associated schedules.')) {
            return;
        }

        try {
            setLoading(true);
            await scheduleService.deletePattern(patternId);
            toast.success('Pattern deleted successfully');
            // Refresh the patterns list
            fetchPatterns();
        } catch (err) {
            toast.error(err.message || 'Failed to delete pattern');
        } finally {
            setLoading(false);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            // Filter out shifts with null shiftId
            const validShifts = formData.shifts.filter(shift => shift.shiftId);
            
            if (validShifts.length === 0) {
                toast.error('Please assign at least one shift');
                return;
            }
            
            const submitData = {
                ...formData,
                shifts: validShifts.map(shift => ({
                    weekNumber: shift.weekNumber,
                    dayOfWeek: shift.dayOfWeek,
                    shiftId: shift.shiftId
                }))
            };
            
            if (modalMode === 'create') {
                await scheduleService.createPattern(submitData);
                toast.success('Pattern created successfully');
            } else {
                await scheduleService.updatePattern(selectedPattern.id, submitData);
                toast.success('Pattern updated successfully');
            }
            
            setShowModal(false);
            fetchPatterns();
        } catch (err) {
            toast.error(err.message || 'Failed to save pattern');
        } finally {
            setLoading(false);
        }
    };
    
    const getShiftForDay = (weekNum, dayOfWeek) => {
        const shift = formData.shifts.find(
            s => s.weekNumber === weekNum && s.dayOfWeek === dayOfWeek
        );
        return shift ? shift.shiftId || '' : '';
    };
    
    const getShiftName = (shiftId) => {
        if (!shiftId) return 'No Shift';
        console.log('Looking for shift with ID:', shiftId); // Debug log
        console.log('Available shifts:', shifts); // Debug log
        const shift = shifts.find(s => s.id === shiftId);
        if (!shift) {
            console.log('Shift not found for ID:', shiftId); // Debug log
            return 'No Shift';
        }
        return `${shift.name} (${shift.startTime} - ${shift.endTime})`;
    };
    
    const updateShiftForDay = (weekNum, dayOfWeek, shiftId) => {
        const newShifts = [...formData.shifts];
        const shiftIndex = newShifts.findIndex(
            s => s.weekNumber === weekNum && s.dayOfWeek === dayOfWeek
        );
        
        if (shiftIndex !== -1) {
            newShifts[shiftIndex].shiftId = shiftId || null;
        } else {
            newShifts.push({
                weekNumber: weekNum,
                dayOfWeek: dayOfWeek,
                shiftId: shiftId || null
            });
        }
        
        setFormData({
            ...formData,
            shifts: newShifts
        });
    };
    
    const getDayName = (dayOfWeek) => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return days[dayOfWeek - 1];
    };
    
    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Schedule Pattern Management</h2>
                <Button variant="primary" onClick={handleCreatePattern}>
                    <FaPlus className="me-1" /> Create New Pattern
                </Button>
            </div>
            
            {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
            
            {loading ? (
                <div className="text-center py-5">
                    <span className="spinner-border text-primary"></span>
                    <p className="mt-2">Loading patterns...</p>
                </div>
            ) : (
                <Card>
                    <Card.Body>
                        <Table responsive striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Employee</th>
                                    <th>Created</th>
                                    <th>Last Modified</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patterns.map(pattern => (
                                    <tr key={pattern.id}>
                                        <td>{pattern.name}</td>
                                        <td>{pattern.employeeName}</td>
                                        <td>{new Date(pattern.creationDate).toLocaleString()}</td>
                                        <td>{new Date(pattern.lastModified).toLocaleString()}</td>
                                        <td>
                                            <Badge bg={pattern.active ? 'success' : 'danger'}>
                                                {pattern.active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Button 
                                                variant="warning" 
                                                size="sm" 
                                                className="me-2"
                                                onClick={() => handleEditPattern(pattern)}
                                            >
                                                <FaEdit /> Edit
                                            </Button>
                                            <Button 
                                                variant="info" 
                                                size="sm"
                                                className="me-2"
                                                onClick={() => handleRegenerateSchedules(pattern.id)}
                                            >
                                                <FaSync /> Regenerate
                                            </Button>
                                            <Button 
                                                variant="danger" 
                                                size="sm"
                                                onClick={() => handleDeletePattern(pattern.id)}
                                            >
                                                <FaTrash /> Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {patterns.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center">No patterns found</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Card.Body>
                </Card>
            )}
            
            {/* Pattern Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{modalMode === 'create' ? 'Create Pattern' : 'Edit Pattern'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Pattern Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                            />
                        </Form.Group>
                        
                        {modalMode === 'create' && (
                            <Row className="mb-3">
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Role</Form.Label>
                                        <Form.Select 
                                            value={selectedRole}
                                            onChange={(e) => handleRoleChange(e.target.value)}
                                        >
                                            <option value="">Select Role</option>
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Employee</Form.Label>
                                        <Form.Select
                                            value={formData.employeeId}
                                            onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                                            required
                                        >
                                            <option value="">Select Employee</option>
                                            {employees.map(employee => (
                                                <option key={employee.id} value={employee.id}>
                                                    {employee.fullName}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}
                        
                        {modalMode === 'edit' && (
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    label="Regenerate future schedules from this pattern"
                                    checked={formData.regenerateSchedules}
                                    onChange={(e) => setFormData({...formData, regenerateSchedules: e.target.checked})}
                                />
                            </Form.Group>
                        )}
                        
                        <Tabs defaultActiveKey="week1" id="pattern-weeks" className="mb-3">
                            {[1, 2, 3, 4].map(weekNum => (
                                <Tab key={weekNum} eventKey={`week${weekNum}`} title={`Week ${weekNum}`}>
                                    <div className="pattern-week p-3 border rounded">
                                        {[1, 2, 3, 4, 5, 6, 7].map(dayOfWeek => (
                                            <Row key={`${weekNum}-${dayOfWeek}`} className="mb-2">
                                                <Col md={3}>
                                                    <Form.Label>{getDayName(dayOfWeek)}</Form.Label>
                                                </Col>
                                                <Col md={9}>
                                                    <Form.Select
                                                        value={getShiftForDay(weekNum, dayOfWeek)}
                                                        onChange={(e) => updateShiftForDay(weekNum, dayOfWeek, e.target.value)}
                                                    >
                                                        <option value="">No Shift</option>
                                                        {shifts.map(shift => (
                                                            <option key={shift.id} value={shift.id}>
                                                                {shift.name} ({shift.startTime} - {shift.endTime})
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Col>
                                            </Row>
                                        ))}
                                    </div>
                                </Tab>
                            ))}
                        </Tabs>
                        
                        <div className="d-grid mt-3">
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Pattern'}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default PatternManagement; 