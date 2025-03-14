import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Tab, Nav, Badge, Alert, Spinner, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEdit, faTrash, faCalendarCheck, faSyringe, faNotesMedical } from '@fortawesome/free-solid-svg-icons';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserLayout from './UserLayout';
import ChildService from '../services/ChildService';
import '../css/ProfilePage.css';

const ChildDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [child, setChild] = useState(null);
    const [healthRecords, setHealthRecords] = useState([]);
    const [vaccineRecords, setVaccineRecords] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    
    useEffect(() => {
        const fetchChildData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // Fetch all child data in parallel
                const [childRes, healthRes, vaccineRes, appointmentsRes] = await Promise.all([
                    ChildService.getChildById(id),
                    ChildService.getChildHealthRecords(id),
                    ChildService.getChildVaccineRecords(id),
                    ChildService.getChildAppointments(id)
                ]);
                
                setChild(childRes.data);
                setHealthRecords(healthRes.data || []);
                setVaccineRecords(vaccineRes.data || []);
                setAppointments(appointmentsRes.data || []);
            } catch (err) {
                const message = err.response?.data?.message || err.message || 'Failed to load child data';
                setError(message);
                toast.error(message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchChildData();
    }, [id]);
    
    const handleEditChild = () => {
        navigate(`/children/${id}/edit`);
    };
    
    const handleDeleteChild = async () => {
        if (window.confirm('Are you sure you want to delete this child?')) {
            setLoading(true);
            try {
                await ChildService.deleteChild(id);
                toast.success('Child deleted successfully');
                navigate('/children');
            } catch (err) {
                const message = err.response?.data?.message || err.message || 'Failed to delete child';
                toast.error(message);
                setLoading(false);
            }
        }
    };
    
    const handleGoBack = () => {
        navigate('/children');
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
    
    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        return date.toLocaleDateString();
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
    
    if (error) {
        return (
            <UserLayout>
                <Container className="mt-4">
                    <Alert variant="danger">{error}</Alert>
                    <Button variant="secondary" onClick={handleGoBack}>
                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                        Back to Children
                    </Button>
                </Container>
            </UserLayout>
        );
    }
    
    if (!child) {
        return (
            <UserLayout>
                <Container className="mt-4">
                    <Alert variant="warning">Child not found</Alert>
                    <Button variant="secondary" onClick={handleGoBack}>
                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                        Back to Children
                    </Button>
                </Container>
            </UserLayout>
        );
    }
    
    return (
        <UserLayout>
            <Container className="mt-4">
                <Button variant="light" className="mb-3" onClick={handleGoBack}>
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
                    Back to Children
                </Button>
                
                <Card className="mb-4">
                    <Card.Body>
                        <Row>
                            <Col md={2} className="text-center">
                                <div className="child-avatar-large">
                                    {child.child_name.charAt(0).toUpperCase()}
                                </div>
                            </Col>
                            <Col md={8}>
                                <h2>{child.child_name}</h2>
                                <p className="text-muted mb-1">Age: {calculateAge(child.dob)}</p>
                                <p className="text-muted mb-1">Date of Birth: {formatDate(child.dob)}</p>
                                <p className="text-muted mb-1">Gender: {child.gender}</p>
                                <p className="text-muted mb-1">
                                    <span>Height: {child.height}</span>
                                    <span className="ms-3">Weight: {child.weight}</span>
                                </p>
                                {child.bloodType && (
                                    <Badge bg="primary" className="me-2 mt-2">
                                        Blood Type: {child.bloodType}
                                    </Badge>
                                )}
                            </Col>
                            <Col md={2} className="d-flex flex-column align-items-end">
                                <Button variant="outline-success" size="sm" className="mb-2" onClick={handleEditChild}>
                                    <FontAwesomeIcon icon={faEdit} className="me-2" />
                                    Edit
                                </Button>
                                <Button variant="outline-danger" size="sm" onClick={handleDeleteChild}>
                                    <FontAwesomeIcon icon={faTrash} className="me-2" />
                                    Delete
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
                
                <Tab.Container id="child-details-tabs" activeKey={activeTab} onSelect={setActiveTab}>
                    <Card>
                        <Card.Header>
                            <Nav variant="tabs">
                                <Nav.Item>
                                    <Nav.Link eventKey="details">Details</Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="health">
                                        Health Records
                                        <Badge bg="success" className="ms-2">{healthRecords.length}</Badge>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="vaccines">
                                        Vaccine Records
                                        <Badge bg="success" className="ms-2">{vaccineRecords.length}</Badge>
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="appointments">
                                        Appointments
                                        <Badge bg="success" className="ms-2">{appointments.length}</Badge>
                                    </Nav.Link>
                                </Nav.Item>
                            </Nav>
                        </Card.Header>
                        <Card.Body>
                            <Tab.Content>
                                <Tab.Pane eventKey="details">
                                    <Row>
                                        <Col md={6}>
                                            <h5>Personal Information</h5>
                                            <Table borderless>
                                                <tbody>
                                                    <tr>
                                                        <td width="30%"><strong>Name:</strong></td>
                                                        <td>{child.child_name}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Date of Birth:</strong></td>
                                                        <td>{formatDate(child.dob)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Age:</strong></td>
                                                        <td>{calculateAge(child.dob)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Gender:</strong></td>
                                                        <td>{child.gender}</td>
                                                    </tr>
                                                </tbody>
                                            </Table>
                                        </Col>
                                        <Col md={6}>
                                            <h5>Medical Information</h5>
                                            <Table borderless>
                                                <tbody>
                                                    <tr>
                                                        <td width="30%"><strong>Height:</strong></td>
                                                        <td>{child.height}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Weight:</strong></td>
                                                        <td>{child.weight}</td>
                                                    </tr>
                                                    <tr>
                                                        <td><strong>Blood Type:</strong></td>
                                                        <td>{child.bloodType || 'Not specified'}</td>
                                                    </tr>
                                                </tbody>
                                            </Table>
                                            
                                            <h5 className="mt-4">Allergies</h5>
                                            <p>{child.allergies || 'No allergies recorded'}</p>
                                            
                                            <h5 className="mt-4">Medical Conditions</h5>
                                            <p>{child.medicalConditions || 'No medical conditions recorded'}</p>
                                        </Col>
                                    </Row>
                                </Tab.Pane>
                                <Tab.Pane eventKey="health">
                                    {healthRecords.length === 0 ? (
                                        <Alert variant="info">
                                            <FontAwesomeIcon icon={faNotesMedical} className="me-2" />
                                            No health records found for this child.
                                        </Alert>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table striped bordered hover>
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Height</th>
                                                        <th>Weight</th>
                                                        <th>Notes</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {healthRecords.map(record => (
                                                        <tr key={record.id}>
                                                            <td>{formatDate(record.date)}</td>
                                                            <td>{record.height}</td>
                                                            <td>{record.weight}</td>
                                                            <td>{record.notes}</td>
                                                            <td>
                                                                <Button variant="link" size="sm">
                                                                    <FontAwesomeIcon icon={faEye} />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </Tab.Pane>
                                <Tab.Pane eventKey="vaccines">
                                    {vaccineRecords.length === 0 ? (
                                        <Alert variant="info">
                                            <FontAwesomeIcon icon={faSyringe} className="me-2" />
                                            No vaccine records found for this child.
                                        </Alert>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table striped bordered hover>
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Vaccine</th>
                                                        <th>Dose</th>
                                                        <th>Status</th>
                                                        <th>Notes</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {vaccineRecords.map(record => (
                                                        <tr key={record.id}>
                                                            <td>{formatDate(record.date)}</td>
                                                            <td>{record.vaccine?.name || 'Unknown'}</td>
                                                            <td>{record.dose || 'N/A'}</td>
                                                            <td>
                                                                <Badge bg={record.status === 'COMPLETED' ? 'success' : 'warning'}>
                                                                    {record.status}
                                                                </Badge>
                                                            </td>
                                                            <td>{record.notes}</td>
                                                            <td>
                                                                <Button variant="link" size="sm">
                                                                    <FontAwesomeIcon icon={faEye} />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </Tab.Pane>
                                <Tab.Pane eventKey="appointments">
                                    {appointments.length === 0 ? (
                                        <Alert variant="info">
                                            <FontAwesomeIcon icon={faCalendarCheck} className="me-2" />
                                            No appointments found for this child.
                                        </Alert>
                                    ) : (
                                        <div className="table-responsive">
                                            <Table striped bordered hover>
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Time</th>
                                                        <th>Reason</th>
                                                        <th>Status</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {appointments.map(appointment => (
                                                        <tr key={appointment.id}>
                                                            <td>{formatDate(appointment.date)}</td>
                                                            <td>{appointment.time}</td>
                                                            <td>{appointment.reason}</td>
                                                            <td>
                                                                <Badge bg={
                                                                    appointment.status === 'COMPLETED' ? 'success' : 
                                                                    appointment.status === 'PENDING' ? 'warning' : 
                                                                    appointment.status === 'CANCELLED' ? 'danger' : 'secondary'
                                                                }>
                                                                    {appointment.status}
                                                                </Badge>
                                                            </td>
                                                            <td>
                                                                <Button variant="link" size="sm">
                                                                    <FontAwesomeIcon icon={faEye} />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    )}
                                </Tab.Pane>
                            </Tab.Content>
                        </Card.Body>
                    </Card>
                </Tab.Container>
            </Container>
        </UserLayout>
    );
};

export default ChildDetails; 