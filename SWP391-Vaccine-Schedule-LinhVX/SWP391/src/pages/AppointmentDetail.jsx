import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Collapse, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faUser, faMapMarkerAlt, faNotesMedical, faVial, faChevronDown, faChevronUp, faHistory, faTemperatureHigh, faWeight, faRulerVertical, faHeartbeat, faAllergies, faCalendarCheck, faCalendarTimes, faCalendarDay, faArrowLeft, faCheck, faTimes, faClock } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../css/AppointmentDetail.css';

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
  const [healthRecord, setHealthRecord] = useState(null);
  const [previousRecords, setPreviousRecords] = useState([]);
  const [showPreviousRecords, setShowPreviousRecords] = useState(false);
  const [vaccineRecords, setVaccineRecords] = useState([]);
  const [expandedVaccines, setExpandedVaccines] = useState({});
  const [error, setError] = useState(null);

  // Fetch appointment details
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get appointment details
        const appointmentResponse = await axios.get(`/api/appointments/${id}`);
        const appointmentData = appointmentResponse.data;
        setAppointment(appointmentData);
        
        // Try to get health record for this appointment
        try {
          const healthRecordResponse = await axios.get(`/api/health-records/appointment/${id}`);
          setHealthRecord(healthRecordResponse.data);
          
          // Get previous health records for this child
          const childId = appointmentData.child.child_id;
          const previousRecordsResponse = await axios.get(`/api/health-records/child/${childId}`);
          // Filter out the current record
          const filteredRecords = previousRecordsResponse.data.filter(
            record => record.id !== healthRecordResponse.data.id
          );
          setPreviousRecords(filteredRecords);
          
          // Get vaccine records for this child
          const vaccineRecordsResponse = await axios.get(`/api/vaccine-records/child/${childId}`);
          setVaccineRecords(vaccineRecordsResponse.data);
        } catch (err) {
          // It's okay if no health record exists yet
          if (err.response && err.response.status !== 404) {
            console.error('Error fetching health record:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching appointment details:', err);
        setError('Failed to load appointment data. Please try again later.');
        toast.error('Could not load appointment details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

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
      case 'SCHEDULED':
        return <Badge bg="primary">Scheduled</Badge>;
      case 'COMPLETED':
        return <Badge bg="success">Completed</Badge>;
      case 'CANCELLED':
        return <Badge bg="danger">Cancelled</Badge>;
      case 'MISSED':
        return <Badge bg="warning">Missed</Badge>;
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

  const getVaccineStatusBadge = (status) => {
    switch (status) {
      case 'ADMINISTERED':
        return <Badge bg="success"><FontAwesomeIcon icon={faCheck} /> Administered</Badge>;
      case 'SCHEDULED':
        return <Badge bg="primary"><FontAwesomeIcon icon={faCalendarDay} /> Scheduled</Badge>;
      case 'MISSED':
        return <Badge bg="danger"><FontAwesomeIcon icon={faTimes} /> Missed</Badge>;
      case 'POSTPONED':
        return <Badge bg="warning"><FontAwesomeIcon icon={faCalendarDay} /> Postponed</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          {error}
        </Alert>
        <Button variant="primary" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-1" /> Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {appointment && (
        <>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Appointment Details</h3>
              {getStatusBadge(appointment.status)}
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-primary me-2" />
                      <h5 className="mb-0">Date & Time</h5>
                    </div>
                    <p className="ms-4">{formatDateTime(appointment.appointmentDate)}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <FontAwesomeIcon icon={faUser} className="text-primary me-2" />
                      <h5 className="mb-0">Child</h5>
                    </div>
                    <p className="ms-4">{appointment.child?.child_name}</p>
                  </div>
                </Col>
                
                <Col md={6}>
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary me-2" />
                      <h5 className="mb-0">Clinic</h5>
                    </div>
                    <p className="ms-4">{appointment.clinic?.name || 'N/A'}</p>
                  </div>
                  
                  <div className="mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <FontAwesomeIcon icon={faNotesMedical} className="text-primary me-2" />
                      <h5 className="mb-0">Notes</h5>
                    </div>
                    <p className="ms-4">{appointment.notes || 'No notes provided'}</p>
                  </div>
                </Col>
              </Row>
              
              {appointment.vaccinesList && appointment.vaccinesList.length > 0 && (
                <div className="mt-3">
                  <div className="d-flex align-items-center mb-2">
                    <FontAwesomeIcon icon={faVial} className="text-primary me-2" />
                    <h5 className="mb-0">Vaccines</h5>
                  </div>
                  <div className="ms-4">
                    <Row className="row-cols-1 row-cols-md-3 g-2">
                      {appointment.vaccinesList.map((vaccine, index) => (
                        <Col key={index}>
                          <Badge 
                            bg="light" 
                            text="dark" 
                            className="vaccine-badge p-2 d-flex align-items-center"
                          >
                            <FontAwesomeIcon icon={faVial} className="text-primary me-2" />
                            {vaccine.vaccineName}
                          </Badge>
                        </Col>
                      ))}
                    </Row>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
          
          {/* Health Record Section */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-info text-white">
              <h3 className="mb-0">Health Record</h3>
            </Card.Header>
            <Card.Body>
              {healthRecord ? (
                <>
                  <div className="d-flex justify-content-between mb-3">
                    <h5>
                      <FontAwesomeIcon icon={faNotesMedical} className="me-2" />
                      Record Details
                    </h5>
                    <div>
                      {getEligibilityBadge(healthRecord.eligibility)}
                    </div>
                  </div>
                  
                  <Row>
                    <Col md={6}>
                      <h6 className="mb-3">Vital Signs</h6>
                      <div className="ms-3 mb-4">
                        {healthRecord.temperature && (
                          <div className="mb-2">
                            <FontAwesomeIcon icon={faTemperatureHigh} className="text-primary me-2" />
                            <strong>Temperature:</strong> {healthRecord.temperature}°C
                          </div>
                        )}
                        
                        {healthRecord.weight && (
                          <div className="mb-2">
                            <FontAwesomeIcon icon={faWeight} className="text-primary me-2" />
                            <strong>Weight:</strong> {healthRecord.weight} kg
                          </div>
                        )}
                        
                        {healthRecord.height && (
                          <div className="mb-2">
                            <FontAwesomeIcon icon={faRulerVertical} className="text-primary me-2" />
                            <strong>Height:</strong> {healthRecord.height} cm
                          </div>
                        )}
                        
                        {healthRecord.bloodPressure && (
                          <div className="mb-2">
                            <FontAwesomeIcon icon={faHeartbeat} className="text-primary me-2" />
                            <strong>Blood Pressure:</strong> {healthRecord.bloodPressure}
                          </div>
                        )}
                      </div>
                    </Col>
                    
                    <Col md={6}>
                      <h6 className="mb-3">Medical Assessment</h6>
                      <div className="ms-3 mb-4">
                        {healthRecord.allergies && (
                          <div className="mb-2">
                            <FontAwesomeIcon icon={faAllergies} className="text-primary me-2" />
                            <strong>Allergies:</strong> {healthRecord.allergies}
                          </div>
                        )}
                        
                        {healthRecord.symptoms && (
                          <div className="mb-2">
                            <strong>Symptoms:</strong> {healthRecord.symptoms}
                          </div>
                        )}
                        
                        {healthRecord.diagnosis && (
                          <div className="mb-2">
                            <strong>Diagnosis:</strong> {healthRecord.diagnosis}
                          </div>
                        )}
                        
                        {healthRecord.recommendations && (
                          <div className="mb-2">
                            <strong>Recommendations:</strong> {healthRecord.recommendations}
                          </div>
                        )}
                      </div>
                    </Col>
                  </Row>
                  
                  {healthRecord.eligibility !== 'ELIGIBLE' && healthRecord.reasonIfNotEligible && (
                    <Alert variant="warning" className="mt-3">
                      <strong>Reason for {healthRecord.eligibility === 'POSTPONED' ? 'postponement' : 'ineligibility'}:</strong> {healthRecord.reasonIfNotEligible}
                      {healthRecord.rescheduledDate && (
                        <div className="mt-2">
                          <strong>Rescheduled Date:</strong> {formatDate(healthRecord.rescheduledDate)}
                        </div>
                      )}
                    </Alert>
                  )}
                  
                  <div className="d-flex justify-content-between mt-3">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setShowPreviousRecords(!showPreviousRecords)}
                      className="d-flex align-items-center"
                    >
                      <FontAwesomeIcon icon={faHistory} className="me-1" />
                      {showPreviousRecords ? 'Hide' : 'Show'} Previous Records 
                      ({previousRecords.length})
                      <FontAwesomeIcon 
                        icon={showPreviousRecords ? faChevronUp : faChevronDown} 
                        className="ms-1" 
                      />
                    </Button>
                    
                    <Button
                      as={Link}
                      to={`/health-records/${healthRecord.id}`}
                      variant="primary"
                      size="sm"
                    >
                      <FontAwesomeIcon icon={faNotesMedical} className="me-1" />
                      View Full Record
                    </Button>
                  </div>
                  
                  <Collapse in={showPreviousRecords}>
                    <div className="mt-3">
                      <h6 className="mb-2">Previous Health Records</h6>
                      {previousRecords.length === 0 ? (
                        <Alert variant="info">No previous health records found.</Alert>
                      ) : (
                        <ListGroup>
                          {previousRecords.map(record => (
                            <ListGroup.Item 
                              key={record.id}
                              action
                              as={Link}
                              to={`/health-records/${record.id}`}
                              className="d-flex justify-content-between align-items-center"
                            >
                              <div>
                                <FontAwesomeIcon icon={faClock} className="me-2 text-secondary" />
                                {formatDateTime(record.recordedAt)}
                              </div>
                              <div>
                                {getEligibilityBadge(record.eligibility)}
                              </div>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      )}
                    </div>
                  </Collapse>
                </>
              ) : (
                <Alert variant="info">
                  <h5>No health record available</h5>
                  <p>A health record will be created by the doctor during your appointment.</p>
                </Alert>
              )}
            </Card.Body>
          </Card>
          
          {/* Vaccine Records Section */}
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-success text-white">
              <h3 className="mb-0">Vaccine Records</h3>
            </Card.Header>
            <Card.Body>
              {vaccineRecords.length === 0 ? (
                <Alert variant="info">No vaccine records found for this child.</Alert>
              ) : (
                <div className="vaccine-records">
                  {vaccineRecords.map((vaccine) => (
                    <Card key={vaccine.id} className="mb-3 border-0 shadow-sm">
                      <Card.Header 
                        className="d-flex justify-content-between align-items-center"
                        onClick={() => toggleVaccineDetails(vaccine.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div>
                          <FontAwesomeIcon icon={faVial} className="me-2 text-primary" />
                          <strong>{vaccine.vaccineName}</strong>
                        </div>
                        <div className="d-flex align-items-center">
                          <Badge bg="info" className="me-2">
                            Dose {vaccine.currentDose}/{vaccine.totalDoses}
                          </Badge>
                          {getStatusBadge(vaccine.status)}
                          <Button variant="link" className="p-0 ms-2">
                            <FontAwesomeIcon 
                              icon={expandedVaccines[vaccine.id] ? faChevronUp : faChevronDown}
                            />
                          </Button>
                        </div>
                      </Card.Header>
                      
                      <Collapse in={expandedVaccines[vaccine.id]}>
                        <div>
                          <Card.Body>
                            <h6>Dose Schedule</h6>
                            
                            <ListGroup className="mt-2">
                              {vaccine.doses && vaccine.doses.map((dose, index) => (
                                <ListGroup.Item key={index} className="d-flex justify-content-between">
                                  <div>
                                    <strong>Dose {index + 1}:</strong> {getVaccineStatusBadge(dose.status)}
                                  </div>
                                  <div>
                                    {dose.scheduledDate && (
                                      <span className="me-3">
                                        <strong>Scheduled:</strong> {formatDate(dose.scheduledDate)}
                                      </span>
                                    )}
                                    {dose.administeredDate && (
                                      <span>
                                        <strong>Administered:</strong> {formatDate(dose.administeredDate)}
                                      </span>
                                    )}
                                  </div>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                            
                            {vaccine.notes && (
                              <Alert variant="info" className="mt-3">
                                <strong>Notes:</strong> {vaccine.notes}
                              </Alert>
                            )}
                          </Card.Body>
                        </div>
                      </Collapse>
                    </Card>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
          
          <div className="d-flex justify-content-between">
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
              <FontAwesomeIcon icon={faArrowLeft} className="me-1" /> Back
            </Button>
            
            <Button 
              as={Link} 
              to="/appointments"
              variant="primary"
            >
              <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
              All Appointments
            </Button>
          </div>
        </>
      )}
    </Container>
  );
};

export default AppointmentDetail; 