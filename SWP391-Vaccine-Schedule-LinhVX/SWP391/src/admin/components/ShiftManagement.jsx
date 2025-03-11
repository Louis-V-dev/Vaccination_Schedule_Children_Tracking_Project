import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { shiftService } from '../../services/scheduleService';
import { validateShift } from '../../utils/validation';
import TablePaginationFilter from '../../components/TablePaginationFilter';

const ShiftManagement = () => {
    const [shifts, setShifts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingShift, setEditingShift] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        startTime: '',
        endTime: '',
        status: true
    });
    const [errors, setErrors] = useState({});

    // Pagination and filtering state
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const [filterText, setFilterText] = useState('');

    const sortOptions = [
        { value: 'name', label: 'Name' },
        { value: 'startTime', label: 'Start Time' },
        { value: 'endTime', label: 'End Time' },
        { value: 'status', label: 'Status' }
    ];

    useEffect(() => {
        fetchShifts();
    }, [page, pageSize, sortField, sortDirection, filterText]);

    const fetchShifts = async () => {
        try {
            setLoading(true);
            const response = await shiftService.getAllShifts(
                page,
                pageSize,
                `${sortField},${sortDirection}`,
                filterText
            );
            setShifts(response.result.content);
            setTotalPages(response.result.totalPages);
            setTotalElements(response.result.totalElements);
        } catch (error) {
            toast.error(error.message || 'Failed to fetch shifts');
            console.error('Error fetching shifts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleModalShow = (shift = null) => {
        if (shift) {
            setEditingShift(shift);
            setFormData({
                name: shift.name,
                startTime: shift.startTime,
                endTime: shift.endTime,
                status: shift.status
            });
        } else {
            setEditingShift(null);
            setFormData({
                name: '',
                startTime: '',
                endTime: '',
                status: true
            });
        }
        setErrors({});
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingShift(null);
        setFormData({
            name: '',
            startTime: '',
            endTime: '',
            status: true
        });
        setErrors({});
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
        
        // Clear error for the field being edited
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form
        const validationErrors = validateShift(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setLoading(true);
            
            if (editingShift) {
                await shiftService.updateShift(editingShift.id, formData);
                toast.success('Shift updated successfully');
            } else {
                const response = await shiftService.createShift(formData);
                if (response.code === 100) {
                    toast.success('Shift created successfully');
                    // Reset form immediately after successful creation
                    setFormData({
                        name: '',
                        startTime: '',
                        endTime: '',
                        status: true
                    });
                    handleModalClose();
                    await fetchShifts(); // Refresh the shifts list
                }
            }
        } catch (error) {
            toast.error(error.message || 'Failed to save shift');
            console.error('Error saving shift:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (shiftId) => {
        if (!window.confirm('Are you sure you want to delete this shift?')) {
            return;
        }

        try {
            setLoading(true);
            await shiftService.deleteShift(shiftId);
            toast.success('Shift deleted successfully');
            fetchShifts();
        } catch (error) {
            toast.error(error.message || 'Failed to delete shift');
            console.error('Error deleting shift:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Manage Shifts</h4>
                <Button variant="success" onClick={() => handleModalShow()}>
                    <FaPlus className="me-2" />
                    Add New Shift
                </Button>
            </Card.Header>
            <Card.Body>
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
                            <th>Name</th>
                            <th>Start Time</th>
                            <th>End Time</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shifts.map(shift => (
                            <tr key={shift.id}>
                                <td>{shift.name}</td>
                                <td>{shift.startTime}</td>
                                <td>{shift.endTime}</td>
                                <td>{shift.status ? 'Active' : 'Inactive'}</td>
                                <td>
                                    <Button 
                                        variant="primary" 
                                        size="sm" 
                                        className="me-2"
                                        onClick={() => handleModalShow(shift)}
                                    >
                                        <FaEdit />
                                    </Button>
                                    <Button 
                                        variant="danger" 
                                        size="sm"
                                        onClick={() => handleDelete(shift.id)}
                                    >
                                        <FaTrash />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {shifts.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center">
                                    {loading ? 'Loading...' : 'No shifts found'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </Card.Body>

            <Modal show={showModal} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingShift ? 'Edit Shift' : 'Add New Shift'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit} key={`shift-form-${showModal}`}>
                        <Form.Group className="mb-3">
                            <Form.Label>Shift Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleInputChange}
                                isInvalid={!!errors.name}
                                placeholder="Enter shift name"
                                autoFocus
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.name}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Start Time</Form.Label>
                                    <Form.Control
                                        type="time"
                                        name="startTime"
                                        value={formData.startTime || ''}
                                        onChange={handleInputChange}
                                        isInvalid={!!errors.startTime}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.startTime}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>End Time</Form.Label>
                                    <Form.Control
                                        type="time"
                                        name="endTime"
                                        value={formData.endTime || ''}
                                        onChange={handleInputChange}
                                        isInvalid={!!errors.endTime}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.endTime}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Active"
                                name="status"
                                checked={formData.status}
                                onChange={handleInputChange}
                            />
                        </Form.Group>

                        <div className="d-grid gap-2">
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        {editingShift ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    editingShift ? 'Update Shift' : 'Create Shift'
                                )}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </Card>
    );
};

export default ShiftManagement; 