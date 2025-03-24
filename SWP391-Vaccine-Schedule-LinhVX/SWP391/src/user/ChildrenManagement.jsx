import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCheck, faTimes, faPlus, faEye } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import UserLayout from './UserLayout';
import ChildService from '../services/ChildService';
import '../css/ProfilePage.css';

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const ChildrenManagement = () => {
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showChildForm, setShowChildForm] = useState(false);
    const [editingChildId, setEditingChildId] = useState(null);
    
    const [childForm, setChildForm] = useState({
        child_name: '',
        dob: '',
        height: '',
        weight: '',
        gender: 'Male',
        bloodType: '',
        allergies: '',
        medicalConditions: ''
    });
    
    const navigate = useNavigate();
    
    // Fetch all children
    const fetchChildren = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Check for authentication token
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please log in to view children');
                toast.error('Please log in to view children');
                navigate('/login');
                return;
            }

            // Always use getChildrenForGuardian to ensure we only get children belonging to the logged-in user
            // regardless of the user's role (even for admins/staff)
            const response = await ChildService.getChildrenForGuardian();
            
            console.log('Children data received:', response.data);
            
            // Ensure we have an array of children
            const childrenData = response.data || [];
            if (!Array.isArray(childrenData)) {
                console.error('Invalid children data format:', childrenData);
                setError('Invalid data format received from server');
                setChildren([]);
                return;
            }
            
            setChildren(childrenData);
        } catch (err) {
            console.error('Error fetching children:', err);
            
            // Handle different types of errors
            if (err.response) {
                if (err.response.status === 401) {
                    // Unauthorized - token expired or invalid
                    localStorage.removeItem('token');
                    toast.error('Session expired. Please log in again.');
                    navigate('/login');
                    return;
                } else if (err.response.status === 403) {
                    // Forbidden - user doesn't have permission
                    toast.error('You do not have permission to view children');
                } else if (err.response.status === 400) {
                    // Bad request - likely missing or invalid parameters
                    toast.error('Invalid request. Please try again.');
                }
            }
            
            const message = err.response?.data?.message || err.message || 'Failed to fetch children';
            setError(message);
            toast.error(message);
            setChildren([]); // Ensure children is always an array
        } finally {
            setLoading(false);
        }
    };
    
    // Load children when component mounts
    useEffect(() => {
        fetchChildren();
    }, []);
    
    const handleAddChild = () => {
        setChildForm({
            child_name: '',
            dob: '',
            height: '',
            weight: '',
            gender: 'Male',
            bloodType: '',
            allergies: '',
            medicalConditions: ''
        });
        setShowChildForm(true);
        setEditingChildId(null);
    };
    
    const handleEditChild = async (childId) => {
        setLoading(true);
        try {
            const response = await ChildService.getChildById(childId);
            const child = response.data;
            
        setChildForm({
                child_name: child.child_name || '',
                dob: child.dob ? new Date(child.dob).toISOString().split('T')[0] : '',
                height: child.height || '',
                weight: child.weight || '',
                gender: child.gender || 'Male',
                bloodType: child.bloodType || '',
                allergies: child.allergies || '',
                medicalConditions: child.medicalConditions || ''
            });
            
        setShowChildForm(true);
            setEditingChildId(childId);
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Failed to load child data';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleViewChild = (childId) => {
        navigate(`/children/${childId}`);
    };
    
    const handleDeleteChild = async (childId) => {
        if (window.confirm('Are you sure you want to delete this child?')) {
            setLoading(true);
            try {
                await ChildService.deleteChild(childId);
                setChildren(children.filter(child => child.child_id !== childId));
            toast.success('Child deleted successfully');
            } catch (err) {
                const message = err.response?.data?.message || err.message || 'Failed to delete child';
                toast.error(message);
            } finally {
                setLoading(false);
            }
        }
    };
    
    const handleChildFormChange = (e) => {
        const { name, value } = e.target;
        setChildForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const calculateAge = (birthdate) => {
        if (!birthdate) return 'Unknown';
        
        const birth = new Date(birthdate);
        const now = new Date();
        const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
        
        if (months < 12) {
            return `${months} month${months !== 1 ? 's' : ''}`;
        } else {
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;
            return `${years} year${years !== 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''}`;
        }
    };
    
    const handleSaveChild = async () => {
        // Form validation
        if (!childForm.child_name || !childForm.dob || !childForm.height || !childForm.weight || !childForm.gender) {
            toast.error('Please fill in all required fields');
            return;
        }
        
        // Format data for API
        const childData = {
            ...childForm,
            dob: new Date(childForm.dob + 'T00:00:00').toISOString()
        };
        
        setLoading(true);
        try {
            let response;
        
        if (editingChildId) {
            // Update existing child
                response = await ChildService.updateChild(editingChildId, childData);
                setChildren(children.map(child => 
                    child.child_id === editingChildId ? response.data : child
                ));
            toast.success('Child updated successfully');
        } else {
            // Add new child
                response = await ChildService.createChild(childData);
                setChildren([...children, response.data]);
            toast.success('Child added successfully');
        }
        
        setShowChildForm(false);
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Failed to save child';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleCancelChildForm = () => {
        setShowChildForm(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };
    
    // If page is loading
    if (loading && !showChildForm) {
        return (
            <UserLayout>
                <Container className="d-flex justify-content-center align-items-center min-vh-100">
                    <Spinner animation="border" variant="success" />
                </Container>
            </UserLayout>
        );
    }
    
    return (
        <UserLayout>
            <Container className="mt-4">
                <div className="children-management">
                    {!showChildForm ? (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h2>Children Management</h2>
                                <Button variant="success" onClick={handleAddChild}>
                                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                                    Add Child
                                </Button>
                            </div>
                            
                            {error && <Alert variant="danger">{error}</Alert>}
                            
                            {children.length === 0 ? (
                                <Card className="text-center p-5">
                                    <Card.Body>
                                        <h4>No Children Added Yet</h4>
                                        <p className="text-muted">Click the "Add Child" button to add your first child.</p>
                                    </Card.Body>
                                </Card>
                            ) : (
                                children.map(child => (
                                    <Card key={child.child_id} className="child-card mb-3">
                                        <Card.Body>
                                            <div className="d-flex align-items-center">
                                                <div className="child-avatar">
                                                    {child.child_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="child-info ms-3">
                                                    <h5 className="mb-1">{child.child_name}</h5>
                                                    <p className="mb-0 text-muted">Age: {calculateAge(child.dob)}</p>
                                                    <p className="mb-0 text-muted">Birthday: {formatDate(child.dob)}</p>
                                                    <p className="mb-0 text-muted">
                                                        <span>Height: {child.height}</span>
                                                        <span className="ms-3">Weight: {child.weight}</span>
                                                        <span className="ms-3">Gender: {child.gender}</span>
                                                    </p>
                                                    {child.bloodType && (
                                                        <Badge bg="primary" className="me-2 mt-2">
                                                            Blood Type: {child.bloodType}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="ms-auto">
                                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleViewChild(child.child_id)}>
                                                        <FontAwesomeIcon icon={faEye} />
                                                    </Button>
                                                    <Button variant="outline-success" size="sm" className="me-2" onClick={() => handleEditChild(child.child_id)}>
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </Button>
                                                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteChild(child.child_id)}>
                                                        <FontAwesomeIcon icon={faTimes} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))
                            )}
                        </>
                    ) : (
                        <Card>
                            <Card.Header className="bg-success text-white">
                                <h5 className="mb-0">{editingChildId ? 'Edit Child' : 'Add Child'}</h5>
                            </Card.Header>
                            <Card.Body>
                                {loading && (
                                    <div className="text-center my-3">
                                        <Spinner animation="border" variant="success" />
                                    </div>
                                )}
                                
                                <Form onSubmit={(e) => { e.preventDefault(); handleSaveChild(); }}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Child's full name: <span className="text-danger">*</span></Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            name="child_name" 
                                            value={childForm.child_name}
                                            onChange={handleChildFormChange}
                                            required
                                            disabled={loading}
                                        />
                                    </Form.Group>
                                    
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Date of Birth: <span className="text-danger">*</span></Form.Label>
                                                <Form.Control 
                                                    type="date" 
                                                    name="dob" 
                                                    value={childForm.dob}
                                                    onChange={handleChildFormChange}
                                                    required
                                                    disabled={loading}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Gender: <span className="text-danger">*</span></Form.Label>
                                        <div>
                                            <Form.Check
                                                inline
                                                type="radio"
                                                label="Male"
                                                name="gender"
                                                value="Male"
                                                checked={childForm.gender === 'Male'}
                                                onChange={handleChildFormChange}
                                                id="gender-male"
                                                        disabled={loading}
                                            />
                                            <Form.Check
                                                inline
                                                type="radio"
                                                label="Female"
                                                name="gender"
                                                value="Female"
                                                checked={childForm.gender === 'Female'}
                                                onChange={handleChildFormChange}
                                                id="gender-female"
                                                        disabled={loading}
                                            />
                                        </div>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Height (cm): <span className="text-danger">*</span></Form.Label>
                                                <Form.Control 
                                                    type="text" 
                                                    name="height" 
                                                    value={childForm.height}
                                                    onChange={handleChildFormChange}
                                                    placeholder="e.g., 50"
                                                    required
                                                    disabled={loading}
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Weight (kg): <span className="text-danger">*</span></Form.Label>
                                                <Form.Control 
                                                    type="text" 
                                                    name="weight" 
                                                    value={childForm.weight}
                                                    onChange={handleChildFormChange}
                                                    placeholder="e.g., 5"
                                                    required
                                                    disabled={loading}
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label>Blood Type:</Form.Label>
                                        <Form.Select
                                            name="bloodType"
                                            value={childForm.bloodType}
                                            onChange={handleChildFormChange}
                                            disabled={loading}
                                        >
                                            <option value="">Select blood type</option>
                                            {bloodTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label>Allergies:</Form.Label>
                                        <Form.Control 
                                            as="textarea" 
                                            rows={2}
                                            name="allergies" 
                                            value={childForm.allergies}
                                            onChange={handleChildFormChange}
                                            placeholder="List any allergies, separated by commas"
                                            disabled={loading}
                                        />
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label>Medical Conditions:</Form.Label>
                                        <Form.Control 
                                            as="textarea" 
                                            rows={2}
                                            name="medicalConditions" 
                                            value={childForm.medicalConditions}
                                            onChange={handleChildFormChange}
                                            placeholder="List any medical conditions, separated by commas"
                                            disabled={loading}
                                        />
                                    </Form.Group>
                                    
                                    <div className="d-flex justify-content-end">
                                        <Button 
                                            variant="secondary" 
                                            className="me-2" 
                                            onClick={handleCancelChildForm}
                                            disabled={loading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit"
                                            variant="success"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                                    {editingChildId ? 'Updating...' : 'Adding...'}
                                                </>
                                            ) : (
                                                editingChildId ? 'Update' : 'Add'
                                            )}
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    )}
                </div>
            </Container>
        </UserLayout>
    );
};

export default ChildrenManagement; 