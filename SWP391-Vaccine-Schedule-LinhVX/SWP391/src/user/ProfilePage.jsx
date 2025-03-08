import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Nav } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEdit, faCheck, faTimes, faPlus, faChild, faIdCard, faPhone, faMapMarkerAlt, faCalendarAlt, faVenusMars, faAt } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import UserLayout from './UserLayout';
import '../css/ProfilePage.css';

const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState({
        accountId: '',
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        address: '',
        dateOfBirth: '',
        gender: '',
        status: true,
        urlImage: '',
        roles: []
    });
    
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({});
    
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                setError('');
                
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('Authentication token not found');
                }

                const response = await fetch('http://localhost:8080/api/users/current', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch profile');
                }

                const userData = await response.json();
                setProfile(userData);
                setEditForm(userData);
            } catch (err) {
                console.error('Error fetching user profile:', err);
                setError('Failed to load user profile. Please try again later.');
                toast.error('Failed to load profile information');
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserProfile();
    }, []);
    
    const handleEdit = () => {
        setEditMode(true);
    };
    
    const handleCancel = () => {
        setEditMode(false);
        setEditForm(profile);
    };
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!window.confirm('Are you sure you want to save these changes?')) {
            return;
        }

        try {
            setLoading(true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const response = await fetch(`http://localhost:8080/api/users/${profile.accountId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName: editForm.firstName,
                    lastName: editForm.lastName,
                    email: editForm.email,
                    phoneNumber: editForm.phoneNumber,
                    address: editForm.address,
                    dateOfBirth: editForm.dateOfBirth,
                    gender: editForm.gender,
                    urlImage: editForm.urlImage
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const updatedProfile = await response.json();
            setProfile(updatedProfile);
            setEditMode(false);
            toast.success('Profile updated successfully');
        } catch (err) {
            console.error('Error updating profile:', err);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };
    
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
    
    const getGenderDisplay = (genderValue) => {
        switch(genderValue) {
            case 'MALE':
                return 'Male';
            case 'FEMALE':
                return 'Female';
            case 'OTHER':
                return 'Other';
            default:
                return genderValue;
        }
    };
    
    if (loading && !profile.username) {
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
            <div className="profile-content">
                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                
                <Card className="profile-card mt-4">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">Profile Information</h4>
                        {!editMode ? (
                            <Button variant="success" onClick={handleEdit}>
                                <FontAwesomeIcon icon={faEdit} className="me-2" />
                                Edit Profile
                            </Button>
                        ) : (
                            <div>
                                <Button variant="success" className="me-2" onClick={handleSubmit} disabled={loading}>
                                    <FontAwesomeIcon icon={faCheck} className="me-2" />
                                    Save
                                </Button>
                                <Button variant="outline-secondary" onClick={handleCancel}>
                                    <FontAwesomeIcon icon={faTimes} className="me-2" />
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </Card.Header>
                    <Card.Body>
                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            <FontAwesomeIcon icon={faIdCard} className="me-2" />
                                            Username
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={profile.username}
                                            disabled
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            <FontAwesomeIcon icon={faAt} className="me-2" />
                                            Email
                                        </Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={editMode ? editForm.email : profile.email}
                                            onChange={handleChange}
                                            disabled={!editMode}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            <FontAwesomeIcon icon={faUser} className="me-2" />
                                            First Name
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="firstName"
                                            value={editMode ? editForm.firstName : profile.firstName}
                                            onChange={handleChange}
                                            disabled={!editMode}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            <FontAwesomeIcon icon={faUser} className="me-2" />
                                            Last Name
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="lastName"
                                            value={editMode ? editForm.lastName : profile.lastName}
                                            onChange={handleChange}
                                            disabled={!editMode}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            <FontAwesomeIcon icon={faPhone} className="me-2" />
                                            Phone Number
                                        </Form.Label>
                                        <Form.Control
                                            type="tel"
                                            name="phoneNumber"
                                            value={editMode ? editForm.phoneNumber : profile.phoneNumber}
                                            onChange={handleChange}
                                            disabled={!editMode}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                                            Address
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="address"
                                            value={editMode ? editForm.address : profile.address}
                                            onChange={handleChange}
                                            disabled={!editMode}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                            Date of Birth
                                        </Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="dateOfBirth"
                                            value={editMode ? editForm.dateOfBirth : profile.dateOfBirth}
                                            onChange={handleChange}
                                            disabled={!editMode}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            <FontAwesomeIcon icon={faVenusMars} className="me-2" />
                                            Gender
                                        </Form.Label>
                                        {editMode ? (
                                            <Form.Select
                                                name="gender"
                                                value={editForm.gender}
                                                onChange={handleChange}
                                            >
                                                <option value="MALE">Male</option>
                                                <option value="FEMALE">Female</option>
                                                <option value="OTHER">Other</option>
                                            </Form.Select>
                                        ) : (
                                            <Form.Control
                                                type="text"
                                                value={getGenderDisplay(profile.gender)}
                                                disabled
                                            />
                                        )}
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        </UserLayout>
    );
};

export default ProfilePage;