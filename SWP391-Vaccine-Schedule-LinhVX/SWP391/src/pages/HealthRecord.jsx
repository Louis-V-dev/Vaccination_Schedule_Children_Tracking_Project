import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Spinner, Alert, Form, Accordion, Nav } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMedkit, faChild, faTemperatureHigh, faWeight, faRulerVertical, faHeartbeat, faAllergies, faNotesMedical, faCalendarCheck, faCalendarTimes, faHistory, faVial, faCheck, faTimes, faCalendarDay, faClock, faChevronLeft, faChevronRight, faUser } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../css/HealthRecord.css';
import NavBar from '../components/NavBar';
import ChildService from '../services/ChildService';

const HealthRecord = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedChildData, setSelectedChildData] = useState(null);
  const [expandedRecords, setExpandedRecords] = useState({});
  const [vaccineRecords, setVaccineRecords] = useState([]);
  const [expandedVaccines, setExpandedVaccines] = useState({});
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('health');

  // Fetch children on component mount
  useEffect(() => {
    const fetchChildren = async () => {
      setLoading(true);
      setError(null);
      try {
        // Check for authentication token
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view health records');
          toast.error('Please log in to view health records');
          navigate('/login');
          return;
        }

        // Get children using ChildService
        const response = await ChildService.getChildrenForGuardian();
        const childrenData = Array.isArray(response.data) ? response.data : [];
        setChildren(childrenData);
        
        // If children exist, select the first one and fetch their records
        if (childrenData.length > 0) {
          setSelectedChild(childrenData[0].child_id);
          setSelectedChildData(childrenData[0]);
        }
      } catch (error) {
        console.error('Error fetching children:', error);
        const message = error.response?.data?.message || error.message || 'Failed to load your children';
        setError(message);
        toast.error('Could not load your children');
        setChildren([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [navigate]);

  // Fetch health records when selected child changes
  useEffect(() => {
    if (selectedChild) {
      fetchHealthRecords();
      fetchVaccineRecords();
      
      // Update selected child data
      const childData = children.find(child => child.child_id === selectedChild);
      setSelectedChildData(childData || null);
    }
  }, [selectedChild]);

  const fetchHealthRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/health-records/child/${selectedChild}`);
      setRecords(Array.isArray(response.data) ? response.data.sort((a, b) => 
        new Date(b.recordedAt) - new Date(a.recordedAt)
      ) : []);
      setError(null);
    } catch (error) {
      console.error('Error fetching health records:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load health records';
      setError(message);
      
      // Handle specific error cases
      if (error.response) {
        if (error.response.status === 401) {
          // Unauthorized - token expired or invalid
          localStorage.removeItem('token');
          toast.error('Session expired. Please log in again.');
          navigate('/login');
          return;
        } else if (error.response.status === 403) {
          // Forbidden - user doesn't have permission
          toast.error('You do not have permission to view these health records');
        }
      }
      
      toast.error('Could not load health records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVaccineRecords = async () => {
    try {
      const response = await axios.get(`/api/vaccine-records/child/${selectedChild}`);
      setVaccineRecords(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching vaccine records:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load vaccine records';
      
      // Handle specific error cases
      if (error.response) {
        if (error.response.status === 401) {
          // Unauthorized - token expired or invalid
          localStorage.removeItem('token');
          toast.error('Session expired. Please log in again.');
          navigate('/login');
          return;
        }
      }
      
      toast.error('Could not load vaccine records');
      setVaccineRecords([]);
    }
  };

  const handleChildChange = (childId) => {
    setSelectedChild(childId);
  };

  const toggleRecordDetails = (recordId) => {
    setExpandedRecords(prev => ({
      ...prev,
      [recordId]: !prev[recordId]
    }));
  };

  const toggleVaccineDetails = (vaccineId) => {
    setExpandedVaccines(prev => ({
      ...prev,
      [vaccineId]: !prev[vaccineId]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ADMINISTERED':
        return <Badge bg="success">Administered</Badge>;
      case 'SCHEDULED':
        return <Badge bg="primary">Scheduled</Badge>;
      case 'MISSED':
        return <Badge bg="danger">Missed</Badge>;
      case 'POSTPONED':
        return <Badge bg="warning">Postponed</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getEligibilityBadge = (eligibility) => {
    switch (eligibility) {
      case 'ELIGIBLE':
        return <Badge bg="success"><FontAwesomeIcon icon={faCalendarCheck} className="me-1" /> Eligible</Badge>;
      case 'NOT_ELIGIBLE':
        return <Badge bg="danger"><FontAwesomeIcon icon={faCalendarTimes} className="me-1" /> Not Eligible</Badge>;
      case 'POSTPONED':
        return <Badge bg="warning"><FontAwesomeIcon icon={faCalendarDay} className="me-1" /> Postponed</Badge>;
      default:
        return <Badge bg="secondary">{eligibility}</Badge>;
    }
  };

  const getChildAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age < 1 
      ? `${Math.floor((today - birthDate) / (1000 * 60 * 60 * 24 * 30))} months` 
      : `${age} years`;
  };

  if (loading && children.length === 0) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  // Extract the latest health record
  const latestRecord = records && records.length > 0 ? records[0] : null;
  // Previous health records (exclude the latest one)
  const previousRecords = records && records.length > 1 ? records.slice(1) : [];

  return (
    <>
      <NavBar />
      <Container fluid className="py-4">
        <Row>
          {/* Left Sidebar for Child Selection */}
          <Col md={3} lg={2} className="mb-4">
            <Card className="shadow-sm sticky-top" style={{ top: '1rem' }}>
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faChild} className="me-2" /> 
                  My Children
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                {children.length === 0 ? (
                  <Alert variant="info" className="m-3">
                    No children registered
                  </Alert>
                ) : (
                  <Nav className="flex-column">
                    {Array.isArray(children) && children.map(child => (
                      <Nav.Link 
                        key={child.child_id}
                        className={`d-flex align-items-center px-3 py-2 border-bottom ${selectedChild === child.child_id ? 'active bg-light' : ''}`}
                        onClick={() => handleChildChange(child.child_id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <FontAwesomeIcon icon={faUser} className="me-2" />
                        <div>
                          <div>{child.child_name}</div>
                          <small className="text-muted">{getChildAge(child.dob)}</small>
                        </div>
                      </Nav.Link>
                    ))}
                  </Nav>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Right Content Area */}
          <Col md={9} lg={10}>
            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}

            {!selectedChild ? (
              <Alert variant="info">
                Please select a child from the sidebar to view their health records.
              </Alert>
            ) : (
              <>
                {/* Child Information Header */}
                {selectedChildData && (
                  <Card className="shadow-sm mb-4">
                    <Card.Header className="bg-primary text-white">
                      <h4 className="mb-0">{selectedChildData.child_name}'s Health Information</h4>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={6}>
                          <p><strong>Age:</strong> {getChildAge(selectedChildData.dob)}</p>
                          <p><strong>Gender:</strong> {selectedChildData.gender}</p>
                        </Col>
                        <Col md={6}>
                          <p><strong>Height:</strong> {selectedChildData.height} cm</p>
                          <p><strong>Weight:</strong> {selectedChildData.weight} kg</p>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                {/* Navigation Tabs */}
                <Nav variant="tabs" className="mb-4">
                  <Nav.Item>
                    <Nav.Link 
                      active={activeTab === 'health'} 
                      onClick={() => setActiveTab('health')}
                    >
                      <FontAwesomeIcon icon={faMedkit} className="me-2" />
                      Health Records
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link 
                      active={activeTab === 'vaccines'} 
                      onClick={() => setActiveTab('vaccines')}
                    >
                      <FontAwesomeIcon icon={faVial} className="me-2" />
                      Vaccination Records
                    </Nav.Link>
                  </Nav.Item>
                </Nav>

                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : (
                  <>
                    {/* Health Records Tab Content */}
                    {activeTab === 'health' && (
                      <>
                        {/* Latest Health Record Section */}
                        <h4 className="mb-3">
                          <FontAwesomeIcon icon={faNotesMedical} className="me-2" />
                          Latest Health Record
                        </h4>
                        
                        {!latestRecord ? (
                          <Alert variant="info">
                            No health records found for this child.
                          </Alert>
                        ) : (
                          <Card className="mb-4 health-record-card shadow-sm">
                            <Card.Header className="bg-light">
                              <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                  <strong>Recorded on:</strong> {formatDateTime(latestRecord.recordedAt)}
                                </h5>
                                <div>
                                  {getEligibilityBadge(latestRecord.eligibility)}
                                </div>
                              </div>
                            </Card.Header>
                            
                            <Card.Body>
                              <Row>
                                <Col md={6}>
                                  <h5 className="mb-3">Vital Signs</h5>
                                  <Table bordered hover size="sm">
                                    <tbody>
                                      {latestRecord.temperature && (
                                        <tr>
                                          <td><FontAwesomeIcon icon={faTemperatureHigh} className="me-2" /> Temperature</td>
                                          <td>{latestRecord.temperature}°C</td>
                                        </tr>
                                      )}
                                      {latestRecord.weight && (
                                        <tr>
                                          <td><FontAwesomeIcon icon={faWeight} className="me-2" /> Weight</td>
                                          <td>{latestRecord.weight} kg</td>
                                        </tr>
                                      )}
                                      {latestRecord.height && (
                                        <tr>
                                          <td><FontAwesomeIcon icon={faRulerVertical} className="me-2" /> Height</td>
                                          <td>{latestRecord.height} cm</td>
                                        </tr>
                                      )}
                                      {latestRecord.bloodPressure && (
                                        <tr>
                                          <td><FontAwesomeIcon icon={faHeartbeat} className="me-2" /> Blood Pressure</td>
                                          <td>{latestRecord.bloodPressure}</td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </Table>
                                </Col>
                                <Col md={6}>
                                  <h5 className="mb-3">Medical Assessment</h5>
                                  {latestRecord.allergies && (
                                    <div className="mb-2">
                                      <strong><FontAwesomeIcon icon={faAllergies} className="me-1" /> Allergies:</strong> {latestRecord.allergies}
                                    </div>
                                  )}
                                  {latestRecord.symptoms && (
                                    <div className="mb-2">
                                      <strong>Symptoms:</strong> {latestRecord.symptoms}
                                    </div>
                                  )}
                                  {latestRecord.diagnosis && (
                                    <div className="mb-2">
                                      <strong>Diagnosis:</strong> {latestRecord.diagnosis}
                                    </div>
                                  )}
                                  {latestRecord.recommendations && (
                                    <div className="mb-2">
                                      <strong>Recommendations:</strong> {latestRecord.recommendations}
                                    </div>
                                  )}
                                </Col>
                              </Row>
                              
                              <div className="mt-3">
                                <strong>Doctor:</strong> {latestRecord.doctor ? `Dr. ${latestRecord.doctor.firstName} ${latestRecord.doctor.lastName}` : 'N/A'}
                              </div>
                              
                              {latestRecord.eligibility !== 'ELIGIBLE' && latestRecord.reasonIfNotEligible && (
                                <Alert variant="warning" className="mt-3">
                                  <strong>Reason for {latestRecord.eligibility === 'POSTPONED' ? 'postponement' : 'ineligibility'}:</strong> {latestRecord.reasonIfNotEligible}
                                  {latestRecord.rescheduledDate && (
                                    <div className="mt-2">
                                      <strong>Rescheduled Date:</strong> {formatDate(latestRecord.rescheduledDate)}
                                    </div>
                                  )}
                                </Alert>
                              )}
                              
                              <div className="text-end mt-3">
                                <Button 
                                  as={Link} 
                                  to={`/appointments/${latestRecord.appointment?.id}`}
                                  variant="outline-primary"
                                  size="sm"
                                >
                                  <FontAwesomeIcon icon={faClock} className="me-1" />
                                  View Appointment
                                </Button>
                              </div>
                            </Card.Body>
                          </Card>
                        )}
                        
                        {/* Previous Health Records Section */}
                        {previousRecords.length > 0 && (
                          <>
                            <h4 className="mb-3 mt-5">
                              <FontAwesomeIcon icon={faHistory} className="me-2" />
                              Previous Health Records
                            </h4>
                            
                            <Accordion className="mb-4">
                              {previousRecords.map((record, index) => (
                                <Accordion.Item key={record.id} eventKey={index.toString()}>
                                  <Accordion.Header>
                                    <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                      <span><strong>Date:</strong> {formatDateTime(record.recordedAt)}</span>
                                      <div>{getEligibilityBadge(record.eligibility)}</div>
                                    </div>
                                  </Accordion.Header>
                                  <Accordion.Body>
                                    <Row>
                                      <Col md={6}>
                                        <h5 className="mb-3">Vital Signs</h5>
                                        <Table bordered hover size="sm">
                                          <tbody>
                                            {record.temperature && (
                                              <tr>
                                                <td><FontAwesomeIcon icon={faTemperatureHigh} className="me-2" /> Temperature</td>
                                                <td>{record.temperature}°C</td>
                                              </tr>
                                            )}
                                            {record.weight && (
                                              <tr>
                                                <td><FontAwesomeIcon icon={faWeight} className="me-2" /> Weight</td>
                                                <td>{record.weight} kg</td>
                                              </tr>
                                            )}
                                            {record.height && (
                                              <tr>
                                                <td><FontAwesomeIcon icon={faRulerVertical} className="me-2" /> Height</td>
                                                <td>{record.height} cm</td>
                                              </tr>
                                            )}
                                            {record.bloodPressure && (
                                              <tr>
                                                <td><FontAwesomeIcon icon={faHeartbeat} className="me-2" /> Blood Pressure</td>
                                                <td>{record.bloodPressure}</td>
                                              </tr>
                                            )}
                                          </tbody>
                                        </Table>
                                      </Col>
                                      <Col md={6}>
                                        <h5 className="mb-3">Medical Assessment</h5>
                                        {record.allergies && (
                                          <div className="mb-2">
                                            <strong><FontAwesomeIcon icon={faAllergies} className="me-1" /> Allergies:</strong> {record.allergies}
                                          </div>
                                        )}
                                        {record.symptoms && (
                                          <div className="mb-2">
                                            <strong>Symptoms:</strong> {record.symptoms}
                                          </div>
                                        )}
                                        {record.diagnosis && (
                                          <div className="mb-2">
                                            <strong>Diagnosis:</strong> {record.diagnosis}
                                          </div>
                                        )}
                                        {record.recommendations && (
                                          <div className="mb-2">
                                            <strong>Recommendations:</strong> {record.recommendations}
                                          </div>
                                        )}
                                      </Col>
                                    </Row>
                                    
                                    <div className="mt-3">
                                      <strong>Doctor:</strong> {record.doctor ? `Dr. ${record.doctor.firstName} ${record.doctor.lastName}` : 'N/A'}
                                    </div>
                                    
                                    {record.eligibility !== 'ELIGIBLE' && record.reasonIfNotEligible && (
                                      <Alert variant="warning" className="mt-3">
                                        <strong>Reason for {record.eligibility === 'POSTPONED' ? 'postponement' : 'ineligibility'}:</strong> {record.reasonIfNotEligible}
                                        {record.rescheduledDate && (
                                          <div className="mt-2">
                                            <strong>Rescheduled Date:</strong> {formatDate(record.rescheduledDate)}
                                          </div>
                                        )}
                                      </Alert>
                                    )}
                                    
                                    <div className="text-end mt-3">
                                      <Button 
                                        as={Link} 
                                        to={`/appointments/${record.appointment?.id}`}
                                        variant="outline-primary"
                                        size="sm"
                                      >
                                        <FontAwesomeIcon icon={faClock} className="me-1" />
                                        View Appointment
                                      </Button>
                                    </div>
                                  </Accordion.Body>
                                </Accordion.Item>
                              ))}
                            </Accordion>
                          </>
                        )}
                      </>
                    )}
                    
                    {/* Vaccine Records Tab Content */}
                    {activeTab === 'vaccines' && (
                      <>
                        <h4 className="mb-3">
                          <FontAwesomeIcon icon={faVial} className="me-2" />
                          Vaccination Records
                        </h4>
                        
                        {!Array.isArray(vaccineRecords) || vaccineRecords.length === 0 ? (
                          <Alert variant="info">
                            No vaccine records found for this child.
                          </Alert>
                        ) : (
                          <div className="vaccine-records-container">
                            {vaccineRecords.map(vaccine => (
                              <Card key={vaccine.id} className="mb-3 shadow-sm">
                                <Card.Header className="bg-light">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">{vaccine.vaccineName}</h5>
                                    <div>
                                      <Badge bg="info" className="me-2">Dose {vaccine.currentDose}/{vaccine.totalDoses}</Badge>
                                      {getStatusBadge(vaccine.status)}
                                    </div>
                                  </div>
                                </Card.Header>
                                <Card.Body>
                                  <Table bordered hover responsive>
                                    <thead>
                                      <tr>
                                        <th>Dose</th>
                                        <th>Status</th>
                                        <th>Scheduled Date</th>
                                        <th>Administered Date</th>
                                        <th>Notes</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Array.isArray(vaccine.doses) && vaccine.doses.map((dose, doseIndex) => (
                                        <tr key={doseIndex}>
                                          <td>{doseIndex + 1}</td>
                                          <td>
                                            {dose.status === 'ADMINISTERED' ? (
                                              <Badge bg="success"><FontAwesomeIcon icon={faCheck} /> Administered</Badge>
                                            ) : dose.status === 'SCHEDULED' ? (
                                              <Badge bg="primary"><FontAwesomeIcon icon={faCalendarDay} /> Scheduled</Badge>
                                            ) : dose.status === 'MISSED' ? (
                                              <Badge bg="danger"><FontAwesomeIcon icon={faTimes} /> Missed</Badge>
                                            ) : (
                                              <Badge bg="warning"><FontAwesomeIcon icon={faCalendarDay} /> Postponed</Badge>
                                            )}
                                          </td>
                                          <td>{formatDate(dose.scheduledDate)}</td>
                                          <td>{dose.administeredDate ? formatDate(dose.administeredDate) : '-'}</td>
                                          <td>{dose.notes || '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                  
                                  {vaccine.notes && (
                                    <Alert variant="info" className="mt-2">
                                      <strong>Additional Notes:</strong> {vaccine.notes}
                                    </Alert>
                                  )}
                                </Card.Body>
                              </Card>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default HealthRecord; 