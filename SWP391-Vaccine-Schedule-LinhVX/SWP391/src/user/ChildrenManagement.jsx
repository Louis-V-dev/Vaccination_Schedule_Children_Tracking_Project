import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faCheck, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import UserLayout from './UserLayout';
import '../css/ProfilePage.css';

const ChildrenManagement = () => {
    const [children, setChildren] = useState([
        {
            id: 1,
            name: 'Child 1',
            age: '1 month',
            firstName: 'John',
            lastName: 'Doe',
            gender: 'Male',
            birthday: '2023-12-15',
            weight: '5 kg'
        }
    ]);
    
    const [childForm, setChildForm] = useState({
        firstName: '',
        lastName: '',
        birthday: '',
        weight: '',
        gender: 'Male'
    });
    
    const [showChildForm, setShowChildForm] = useState(false);
    const [editingChildId, setEditingChildId] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const handleAddChild = () => {
        setChildForm({
            firstName: '',
            lastName: '',
            birthday: '',
            weight: '',
            gender: 'Male'
        });
        setShowChildForm(true);
        setEditingChildId(null);
    };
    
    const handleEditChild = (child) => {
        setChildForm({
            firstName: child.firstName,
            lastName: child.lastName,
            birthday: child.birthday,
            weight: child.weight,
            gender: child.gender
        });
        setShowChildForm(true);
        setEditingChildId(child.id);
    };
    
    const handleDeleteChild = (childId) => {
        if (window.confirm('Are you sure you want to delete this child?')) {
            setChildren(children.filter(child => child.id !== childId));
            toast.success('Child deleted successfully');
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
    
    const handleSaveChild = () => {
        if (!childForm.firstName || !childForm.lastName || !childForm.birthday) {
            toast.error('Please fill in all required fields');
            return;
        }
        
        // Get first letter of first name for the avatar
        const firstLetter = childForm.firstName.charAt(0).toUpperCase();
        
        // Calculate age based on birthday
        const age = calculateAge(childForm.birthday);
        
        if (editingChildId) {
            // Update existing child
            setChildren(children.map(child => {
                if (child.id === editingChildId) {
                    return {
                        ...child,
                        name: `${childForm.firstName} ${childForm.lastName}`,
                        age,
                        ...childForm
                    };
                }
                return child;
            }));
            toast.success('Child updated successfully');
        } else {
            // Add new child
            const newId = Math.max(...children.map(c => c.id), 0) + 1;
            setChildren([
                ...children,
                {
                    id: newId,
                    name: `${childForm.firstName} ${childForm.lastName}`,
                    age,
                    ...childForm,
                    firstLetter
                }
            ]);
            toast.success('Child added successfully');
        }
        
        setShowChildForm(false);
    };
    
    const handleCancelChildForm = () => {
        setShowChildForm(false);
    };

    if (loading) {
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
                            
                            {children.length === 0 ? (
                                <Card className="text-center p-5">
                                    <Card.Body>
                                        <h4>No Children Added Yet</h4>
                                        <p className="text-muted">Click the "Add Child" button to add your first child.</p>
                                    </Card.Body>
                                </Card>
                            ) : (
                                children.map(child => (
                                    <Card key={child.id} className="child-card mb-3">
                                        <Card.Body>
                                            <div className="d-flex align-items-center">
                                                <div className="child-avatar">
                                                    {child.firstLetter || child.name.charAt(0)}
                                                </div>
                                                <div className="child-info ms-3">
                                                    <h5 className="mb-1">{child.name}</h5>
                                                    <p className="mb-0 text-muted">Age: {child.age}</p>
                                                    <p className="mb-0 text-muted">Birthday: {child.birthday}</p>
                                                    <p className="mb-0 text-muted">Weight: {child.weight}</p>
                                                </div>
                                                <div className="ms-auto">
                                                    <Button variant="outline-success" size="sm" className="me-2" onClick={() => handleEditChild(child)}>
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </Button>
                                                    <Button variant="outline-danger" size="sm" onClick={() => handleDeleteChild(child.id)}>
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
                                <Form>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>First name:</Form.Label>
                                                <Form.Control 
                                                    type="text" 
                                                    name="firstName" 
                                                    value={childForm.firstName}
                                                    onChange={handleChildFormChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Last name:</Form.Label>
                                                <Form.Control 
                                                    type="text" 
                                                    name="lastName" 
                                                    value={childForm.lastName}
                                                    onChange={handleChildFormChange}
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label>Gender:</Form.Label>
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
                                            />
                                        </div>
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label>Birthday:</Form.Label>
                                        <Form.Control 
                                            type="date" 
                                            name="birthday" 
                                            value={childForm.birthday}
                                            onChange={handleChildFormChange}
                                            required
                                        />
                                    </Form.Group>
                                    
                                    <Form.Group className="mb-3">
                                        <Form.Label>Weight:</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            name="weight" 
                                            value={childForm.weight}
                                            onChange={handleChildFormChange}
                                            placeholder="e.g., 5 kg"
                                        />
                                    </Form.Group>
                                    
                                    <div className="d-flex justify-content-end">
                                        <Button variant="secondary" className="me-2" onClick={handleCancelChildForm}>
                                            Cancel
                                        </Button>
                                        <Button variant="success" onClick={handleSaveChild}>
                                            {editingChildId ? 'Update' : 'Add'}
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