import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Nav, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEdit, faCheck, faTimes, faPlus, faChild, faIdCard, faPhone, faMapMarkerAlt, faCalendarAlt, faVenusMars, faAt, faKey, faLock } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import UserLayout from './UserLayout';
import '../css/ProfilePage.css';
import accountService from '../services/accountService';

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
    
    // Add new state for password
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState('');
    
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
    
    // Add handler for password form
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear errors for this field
        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };
    
    const validatePasswordForm = () => {
        const errors = {};
        
        if (!passwordForm.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }
        
        if (!passwordForm.newPassword) {
            errors.newPassword = 'New password is required';
        } else if (passwordForm.newPassword.length < 3 || passwordForm.newPassword.length > 16) {
            errors.newPassword = 'Password must be between 3 and 16 characters';
        }
        
        if (!passwordForm.confirmPassword) {
            errors.confirmPassword = 'Please confirm your new password';
        } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        
        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };
    
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        if (!validatePasswordForm()) {
            return;
        }
        
        try {
            // Check if user is authenticated
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Authentication required. Please log in again.');
                setPasswordErrors({
                    general: 'You need to be logged in to change your password.'
                });
                return;
            }
            
            setIsChangingPassword(true);
            setPasswordErrors({});
            
            const response = await accountService.changePassword(
                passwordForm.currentPassword,
                passwordForm.newPassword
            );
            
            // Add a more prominent success alert
            setPasswordSuccess("Password changed successfully! Your new password is now active.");
            
            // Show toast notification
            toast.success('Password changed successfully!', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            
            // Reset form
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            
        } catch (err) {
            console.error('Error changing password:', err);
            
            // Check for specific error messages
            if (err.message.includes('Current password is incorrect')) {
                setPasswordErrors({
                    currentPassword: 'Current password is incorrect'
                });
            } else if (err.message.includes('Unable to verify your account')) {
                toast.error('Session validation failed. Please log in again.');
                setPasswordErrors({
                    general: 'Your session appears to be invalid. Please log out and log in again.'
                });
                // Optionally redirect to login
                // setTimeout(() => navigate('/login'), 3000);
            } else if (err.message.includes('User not found')) {
                toast.error('User not found. You may need to log in again.');
                setPasswordErrors({
                    general: 'User session error. Please log out and log in again.'
                });
            } else if (err.message.includes('Authentication required') || 
                       err.message.includes('Authentication token not found')) {
                toast.error('Your session has expired. Please log in again.');
                setPasswordErrors({
                    general: 'Authentication error. Please log out and log in again.'
                });
            } else if (err.message.includes('Network Error') || 
                       err.message.includes('connect to server') ||
                       err.message.includes('timed out')) {
                toast.error('Network error. Please check your connection.');
                setPasswordErrors({
                    general: err.message
                });
            } else if (err.message.includes('System error occurred')) {
                toast.error('A system error occurred. Our team has been notified.');
                setPasswordErrors({
                    general: 'System error. Please try again later.'
                });
            } else {
                toast.error(err.message || 'Failed to change password');
                setPasswordErrors({
                    general: err.message || 'Failed to change password. Please try again later.'
                });
            }
            
        } finally {
            setIsChangingPassword(false);
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
    
    // Add renderPasswordTab function
    const renderPasswordTab = () => {
        return (
            <Card className="profile-card">
                <Card.Header>
                    <h4>
                        <FontAwesomeIcon icon={faKey} className="me-2" />
                        Change Password
                    </h4>
                </Card.Header>
                <Card.Body>
                    {passwordErrors.general && (
                        <Alert variant="danger" className="mb-3">
                            {passwordErrors.general}
                        </Alert>
                    )}
                    
                    {passwordSuccess && (
                        <Alert variant="success" className="mb-3">
                            <FontAwesomeIcon icon={faCheck} className="me-2" />
                            {passwordSuccess}
                        </Alert>
                    )}
                    
                    <Form onSubmit={handlePasswordSubmit}>
                        <Form.Group className="mb-3" controlId="currentPassword">
                            <Form.Label>
                                <FontAwesomeIcon icon={faLock} className="me-2" />
                                Current Password
                            </Form.Label>
                            <Form.Control
                                type="password"
                                name="currentPassword"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordChange}
                                isInvalid={!!passwordErrors.currentPassword}
                                placeholder="Enter your current password"
                            />
                            <Form.Control.Feedback type="invalid">
                                {passwordErrors.currentPassword}
                            </Form.Control.Feedback>
                        </Form.Group>
                        
                        <Form.Group className="mb-3" controlId="newPassword">
                            <Form.Label>
                                <FontAwesomeIcon icon={faLock} className="me-2" />
                                New Password
                            </Form.Label>
                            <Form.Control
                                type="password"
                                name="newPassword"
                                value={passwordForm.newPassword}
                                onChange={handlePasswordChange}
                                isInvalid={!!passwordErrors.newPassword}
                                placeholder="Enter new password"
                            />
                            <Form.Control.Feedback type="invalid">
                                {passwordErrors.newPassword}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                                Password must be between 3 and 16 characters.
                            </Form.Text>
                        </Form.Group>
                        
                        <Form.Group className="mb-3" controlId="confirmPassword">
                            <Form.Label>
                                <FontAwesomeIcon icon={faLock} className="me-2" />
                                Confirm New Password
                            </Form.Label>
                            <Form.Control
                                type="password"
                                name="confirmPassword"
                                value={passwordForm.confirmPassword}
                                onChange={handlePasswordChange}
                                isInvalid={!!passwordErrors.confirmPassword}
                                placeholder="Confirm new password"
                            />
                            <Form.Control.Feedback type="invalid">
                                {passwordErrors.confirmPassword}
                            </Form.Control.Feedback>
                        </Form.Group>
                        
                        <div className="d-grid gap-2 mt-4">
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isChangingPassword}
                            >
                                {isChangingPassword ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                            className="me-2"
                                        />
                                        Changing Password...
                                    </>
                                ) : (
                                    'Change Password'
                                )}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        );
    };
    
    const renderProfileTab = () => {
        return (
            <Card className="profile-card">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">
                        <FontAwesomeIcon icon={faUser} className="me-2" />
                        Profile Information
                    </h4>
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
                    {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
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
        );
    };

    const renderChildrenTab = () => {
        return (
            <Card className="profile-card">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">
                        <FontAwesomeIcon icon={faChild} className="me-2" />
                        Children
                    </h4>
                    <Button variant="primary" onClick={() => setShowChildForm(true)}>
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Add Child
                    </Button>
                </Card.Header>
                <Card.Body>
                    {/* Your existing children rendering code */}
                    {children.length === 0 ? (
                        <Alert variant="info">You haven't added any children yet.</Alert>
                    ) : (
                        <div>
                            {children.map(child => (
                                <Card key={child.id} className="mb-3">
                                    <Card.Body>
                                        <Row>
                                            <Col md={8}>
                                                <h5>{child.name}</h5>
                                                <p>
                                                    <strong>Date of Birth:</strong> {child.dateOfBirth}
                                                    <br />
                                                    <strong>Gender:</strong> {getGenderDisplay(child.gender)}
                                                </p>
                                            </Col>
                                            <Col md={4} className="text-end">
                                                <Button 
                                                    variant="outline-primary" 
                                                    size="sm" 
                                                    className="me-2"
                                                    onClick={() => handleEditChild(child.id)}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </Button>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm"
                                                    onClick={() => handleDeleteChild(child.id)}
                                                >
                                                    <FontAwesomeIcon icon={faTimes} />
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    )}
                </Card.Body>
            </Card>
        );
    };
    
    return (
        <UserLayout>
            <Container className="py-4">
                <h1 className="mb-4">Account Management</h1>
                <div className="profile-container">
                    <Tab.Container id="profile-tabs" activeKey={activeTab} onSelect={setActiveTab}>
                        <Row>
                            <Col md={3}>
                                <div className="profile-sidebar">
                                    <Card>
                                        <Card.Body>
                                            <Nav variant="pills" className="flex-column">
                                                <Nav.Item>
                                                    <Nav.Link eventKey="profile">
                                                        <FontAwesomeIcon icon={faUser} className="me-2" />
                                                        Profile Information
                                                    </Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="password">
                                                        <FontAwesomeIcon icon={faKey} className="me-2" />
                                                        Change Password
                                                    </Nav.Link>
                                                </Nav.Item>
                                            </Nav>
                                        </Card.Body>
                                    </Card>
                                </div>
                            </Col>
                            <Col md={9}>
                                <Tab.Content>
                                    <Tab.Pane eventKey="profile">
                                        {renderProfileTab()}
                                    </Tab.Pane>
                                    <Tab.Pane eventKey="password">
                                        {renderPasswordTab()}
                                    </Tab.Pane>
                                </Tab.Content>
                            </Col>
                        </Row>
                    </Tab.Container>
                </div>
            </Container>
        </UserLayout>
    );
};

export default ProfilePage;