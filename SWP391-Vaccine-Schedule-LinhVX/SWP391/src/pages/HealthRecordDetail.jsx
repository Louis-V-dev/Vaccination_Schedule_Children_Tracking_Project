import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMedkit, 
  faUser, 
  faBirthdayCake, 
  faVenusMars,
  faTint, 
  faAllergies, 
  faHeartbeat,
  faTemperatureHigh, 
  faWeight, 
  faRulerVertical, 
  faHeadSideCough, 
  faNotesMedical, 
  faCalendarCheck, 
  faCalendarTimes, 
  faCalendarDay, 
  faStethoscope,
  faCommentMedical,
  faArrowLeft,
  faClock,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../css/HealthRecordDetail.css';

const HealthRecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [healthRecord, setHealthRecord] = useState(null);
  const [error, setError] = useState(null);

  // Fetch health record details
  useEffect(() => {
    const fetchHealthRecord = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/health-records/${id}`);
        setHealthRecord(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching health record:', err);
        setError('Failed to load health record. Please try again later.');
        toast.error('Could not load health record');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchHealthRecord();
    }
  }, [id]);

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

  if (!healthRecord) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          Health record not found or you don't have permission to view it.
        </Alert>
        <Button variant="primary" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-1" /> Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0">
            <FontAwesomeIcon icon={faMedkit} className="me-2" />
            Health Record
          </h3>
          <div>
            {getEligibilityBadge(healthRecord.eligibility)}
          </div>
        </Card.Header>
        
        <Card.Body>
          {/* Child Information Section */}
          <section className="mb-4">
            <h4 className="section-title">
              <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
              Child Information
            </h4>
            <Row className="mt-3">
              <Col md={6}>
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{healthRecord.child?.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date of Birth:</span>
                  <span className="info-value">{formatDate(healthRecord.child?.dob)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Gender:</span>
                  <span className="info-value">{healthRecord.child?.gender}</span>
                </div>
              </Col>
              <Col md={6}>
                <div className="info-item">
                  <span className="info-label">Blood Type:</span>
                  <span className="info-value">{healthRecord.child?.bloodType || 'Not specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Known Allergies:</span>
                  <span className="info-value">{healthRecord.child?.allergies || 'None'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Medical Conditions:</span>
                  <span className="info-value">{healthRecord.child?.medicalConditions || 'None'}</span>
                </div>
              </Col>
            </Row>
          </section>
          
          <hr />
          
          {/* Vital Signs Section */}
          <section className="mb-4">
            <h4 className="section-title">
              <FontAwesomeIcon icon={faHeartbeat} className="me-2 text-primary" />
              Vital Signs
            </h4>
            <div className="vital-signs mt-3">
              <Row className="text-center">
                {healthRecord.temperature && (
                  <Col xs={6} md={3} className="vital-sign-item">
                    <div className="vital-icon">
                      <FontAwesomeIcon icon={faTemperatureHigh} size="2x" className="text-primary" />
                    </div>
                    <div className="vital-label">Temperature</div>
                    <div className="vital-value">{healthRecord.temperature} °C</div>
                  </Col>
                )}
                
                {healthRecord.weight && (
                  <Col xs={6} md={3} className="vital-sign-item">
                    <div className="vital-icon">
                      <FontAwesomeIcon icon={faWeight} size="2x" className="text-primary" />
                    </div>
                    <div className="vital-label">Weight</div>
                    <div className="vital-value">{healthRecord.weight} kg</div>
                  </Col>
                )}
                
                {healthRecord.height && (
                  <Col xs={6} md={3} className="vital-sign-item">
                    <div className="vital-icon">
                      <FontAwesomeIcon icon={faRulerVertical} size="2x" className="text-primary" />
                    </div>
                    <div className="vital-label">Height</div>
                    <div className="vital-value">{healthRecord.height} cm</div>
                  </Col>
                )}
                
                {healthRecord.bloodPressure && (
                  <Col xs={6} md={3} className="vital-sign-item">
                    <div className="vital-icon">
                      <FontAwesomeIcon icon={faTint} size="2x" className="text-primary" />
                    </div>
                    <div className="vital-label">Blood Pressure</div>
                    <div className="vital-value">{healthRecord.bloodPressure}</div>
                  </Col>
                )}
              </Row>
            </div>
          </section>
          
          <hr />
          
          {/* Medical Assessment Section */}
          <section className="mb-4">
            <h4 className="section-title">
              <FontAwesomeIcon icon={faStethoscope} className="me-2 text-primary" />
              Medical Assessment
            </h4>
            <div className="medical-assessment mt-3">
              {healthRecord.allergies && (
                <div className="assessment-item">
                  <div className="assessment-label">
                    <FontAwesomeIcon icon={faAllergies} className="me-2 text-danger" />
                    Allergies:
                  </div>
                  <div className="assessment-value">{healthRecord.allergies}</div>
                </div>
              )}
              
              {healthRecord.symptoms && (
                <div className="assessment-item">
                  <div className="assessment-label">
                    <FontAwesomeIcon icon={faHeadSideCough} className="me-2 text-warning" />
                    Symptoms:
                  </div>
                  <div className="assessment-value">{healthRecord.symptoms}</div>
                </div>
              )}
              
              {healthRecord.diagnosis && (
                <div className="assessment-item">
                  <div className="assessment-label">
                    <FontAwesomeIcon icon={faNotesMedical} className="me-2 text-info" />
                    Diagnosis:
                  </div>
                  <div className="assessment-value">{healthRecord.diagnosis}</div>
                </div>
              )}
              
              {healthRecord.recommendations && (
                <div className="assessment-item">
                  <div className="assessment-label">
                    <FontAwesomeIcon icon={faCommentMedical} className="me-2 text-success" />
                    Recommendations:
                  </div>
                  <div className="assessment-value">{healthRecord.recommendations}</div>
                </div>
              )}
            </div>
          </section>
          
          <hr />
          
          {/* Vaccination Eligibility Section */}
          <section className="mb-4">
            <h4 className="section-title">
              <FontAwesomeIcon icon={faCalendarCheck} className="me-2 text-primary" />
              Vaccination Eligibility
            </h4>
            <div className="eligibility-details mt-3">
              <div className="d-flex align-items-center mb-3">
                <span className="me-2">Status:</span>
                {getEligibilityBadge(healthRecord.eligibility)}
              </div>
              
              {healthRecord.eligibility !== 'ELIGIBLE' && (
                <>
                  {healthRecord.reasonIfNotEligible && (
                    <Alert variant="warning">
                      <strong>Reason for {healthRecord.eligibility === 'POSTPONED' ? 'postponement' : 'ineligibility'}:</strong><br />
                      {healthRecord.reasonIfNotEligible}
                    </Alert>
                  )}
                  
                  {healthRecord.rescheduledDate && (
                    <div className="rescheduled-date mt-3">
                      <FontAwesomeIcon icon={faCalendarDay} className="me-2 text-primary" />
                      <strong>Rescheduled Date:</strong> {formatDate(healthRecord.rescheduledDate)}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
          
          <hr />
          
          {/* Record Information Section */}
          <section>
            <h4 className="section-title">
              <FontAwesomeIcon icon={faClock} className="me-2 text-primary" />
              Record Information
            </h4>
            <Row className="mt-3">
              <Col md={6}>
                <div className="info-item">
                  <span className="info-label">Record ID:</span>
                  <span className="info-value">{healthRecord.id}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Appointment Date:</span>
                  <span className="info-value">{formatDateTime(healthRecord.appointment?.appointmentDate)}</span>
                </div>
              </Col>
              <Col md={6}>
                <div className="info-item">
                  <span className="info-label">Doctor:</span>
                  <span className="info-value">
                    {healthRecord.doctor ? `Dr. ${healthRecord.doctor.firstName} ${healthRecord.doctor.lastName}` : 'Not specified'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Recorded At:</span>
                  <span className="info-value">{formatDateTime(healthRecord.recordedAt)}</span>
                </div>
              </Col>
            </Row>
          </section>
        </Card.Body>
      </Card>
      
      <div className="d-flex justify-content-between">
        <Button variant="outline-secondary" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-1" /> Back
        </Button>
        
        {healthRecord.appointment && (
          <Button 
            as={Link} 
            to={`/appointments/${healthRecord.appointment.id}`}
            variant="primary"
          >
            <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
            View Appointment
          </Button>
        )}
      </div>
    </Container>
  );
};

export default HealthRecordDetail; 