import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faEye, faCheckCircle, faTimesCircle, faClock, faUser, faNotesMedical, faSyringe, faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import UserLayout from './UserLayout';
import appointmentService from '../services/appointmentService';
import '../css/AppointmentList.css';

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getUserAppointments();
      setAppointments(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load your appointments. Please try again later.');
      toast.error('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge bg="success"><FontAwesomeIcon icon={faCheckCircle} /> Completed</Badge>;
      case 'CANCELLED':
        return <Badge bg="danger"><FontAwesomeIcon icon={faTimesCircle} /> Cancelled</Badge>;
      case 'PENDING':
        return <Badge bg="warning" text="dark"><FontAwesomeIcon icon={faClock} /> Pending</Badge>;
      case 'SCHEDULED':
        return <Badge bg="primary"><FontAwesomeIcon icon={faCalendarAlt} /> Scheduled</Badge>;
      case 'PAID':
        return <Badge bg="success"><FontAwesomeIcon icon={faCheckCircle} /> PAID</Badge>;
      case 'OFFLINE_PAYMENT':
        return <Badge bg="secondary"><FontAwesomeIcon icon={faMoneyBill} /> OFFLINE PAYMENT</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case 'PAID':
      case 'COMPLETED':
        return <Badge bg="success">COMPLETED</Badge>;
      case 'UNPAID':
        return <Badge bg="danger">Unpaid</Badge>;
      case 'PENDING':
        return <Badge bg="warning" text="dark">Pending</Badge>;
      default:
        return <Badge bg="secondary">{paymentStatus}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      console.error('Invalid date format:', dateString);
      return dateString;
    }
  };
  
  const handleViewAppointment = async (appointmentId) => {
    try {
      setLoadingDetails(true);
      setShowModal(true);
      
      // Fetch detailed appointment information
      const appointmentDetails = await appointmentService.getAppointmentById(appointmentId);
      console.log('Appointment details:', appointmentDetails);
      
      setSelectedAppointment(appointmentDetails);
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      toast.error('Failed to load appointment details');
    } finally {
      setLoadingDetails(false);
    }
  };
  
  const closeModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
  };

  return (
    <UserLayout>
      <Container className="appointment-list-container my-4">
        <Card>
          <Card.Header className="bg-primary text-white">
            <h2>
              <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
              My Appointments
            </h2>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading your appointments...</p>
              </div>
            ) : error ? (
              <div className="text-center py-5 text-danger">
                <p>{error}</p>
                <Button variant="outline-primary" onClick={fetchAppointments}>
                  Try Again
                </Button>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-5">
                <p>You don't have any appointments yet.</p>
                <Link to="/booking">
                  <Button variant="primary">Book an Appointment</Button>
                </Link>
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Child Name</th>
                      <th>Type</th>
                      <th>Appointment Date</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>{appointment.id}</td>
                        <td>{appointment.childName || 'N/A'}</td>
                        <td>{appointment.appointmentType || 'Standard'}</td>
                        <td>{formatDate(appointment.appointmentTime)}</td>
                        <td>{getStatusBadge(appointment.status)}</td>
                        <td>{getPaymentStatusBadge(appointment.paymentStatus || (appointment.isPaid ? 'PAID' : 'UNPAID'))}</td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="info" 
                            className="me-2"
                            onClick={() => handleViewAppointment(appointment.id)}
                          >
                            <FontAwesomeIcon icon={faEye} /> View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
        
        {/* Appointment Details Modal */}
        <Modal show={showModal} onHide={closeModal} centered size="lg">
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
              Appointment Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {loadingDetails ? (
              <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading appointment details...</p>
              </div>
            ) : !selectedAppointment ? (
              <div className="text-center py-4 text-danger">
                <p>Could not load appointment details.</p>
              </div>
            ) : (
              <div className="appointment-details">
                <Row className="mb-4">
                  <Col md={6}>
                    <h5 className="border-bottom pb-2">Appointment Information</h5>
                    <div className="detail-item">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                      <strong>ID:</strong> {selectedAppointment.id}
                    </div>
                    <div className="detail-item">
                      <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                      <strong>Child:</strong> {selectedAppointment.childName}
                    </div>
                    <div className="detail-item">
                      <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                      <strong>Date & Time:</strong> {formatDate(selectedAppointment.appointmentTime)}
                    </div>
                    <div className="detail-item">
                      <FontAwesomeIcon icon={faClock} className="me-2 text-primary" />
                      <strong>Time Slot:</strong> {selectedAppointment.timeSlot || 'N/A'}
                    </div>
                    <div className="detail-item">
                      <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                      <strong>Doctor:</strong> {selectedAppointment.doctorName || 'Not assigned'}
                    </div>
                    <div className="detail-item">
                      <strong>Status:</strong> {getStatusBadge(selectedAppointment.status)}
                    </div>
                    {selectedAppointment.notes && (
                      <div className="detail-item">
                        <FontAwesomeIcon icon={faNotesMedical} className="me-2 text-primary" />
                        <strong>Notes:</strong> {selectedAppointment.notes}
                      </div>
                    )}
                  </Col>
                  <Col md={6}>
                    <h5 className="border-bottom pb-2">Payment Information</h5>
                    <div className="detail-item">
                      <strong>Payment Method:</strong> {selectedAppointment.paymentMethod || 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Payment Status:</strong> {getPaymentStatusBadge(selectedAppointment.paymentStatus || (selectedAppointment.isPaid ? 'PAID' : 'UNPAID'))}
                    </div>
                    <div className="detail-item">
                      <strong>Total Amount:</strong> {selectedAppointment.totalAmount ? `${selectedAppointment.totalAmount.toLocaleString()} đ` : 'N/A'}
                    </div>
                    {selectedAppointment.transactionId && (
                      <div className="detail-item">
                        <strong>Transaction ID:</strong> {selectedAppointment.transactionId}
                      </div>
                    )}
                    {selectedAppointment.paymentDate && (
                      <div className="detail-item">
                        <strong>Payment Date:</strong> {formatDate(selectedAppointment.paymentDate)}
                      </div>
                    )}
                  </Col>
                </Row>

                <h5 className="border-bottom pb-2">Vaccines</h5>
                {selectedAppointment.appointmentVaccines && selectedAppointment.appointmentVaccines.length > 0 ? (
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Vaccine</th>
                        <th>Dose</th>
                        <th>Price</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAppointment.appointmentVaccines.map((vaccine, index) => (
                        <tr key={index}>
                          <td>
                            <FontAwesomeIcon icon={faSyringe} className="me-2 text-primary" />
                            {vaccine.vaccineName || vaccine.vaccineComboName || 'Unknown'}
                            {vaccine.fromCombo && <Badge bg="info" className="ms-2">Combo</Badge>}
                          </td>
                          <td>{vaccine.doseNumber || 1}</td>
                          <td>{vaccine.price ? `${Number(vaccine.price).toLocaleString()} đ` : 'N/A'}</td>
                          <td>{vaccine.status || 'Scheduled'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p>No vaccine information available.</p>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Close
            </Button>
            {selectedAppointment && (
              <Link to={`/payment/status?appointmentId=${selectedAppointment.id}`}>
                <Button variant="primary">
                  View Full Details
                </Button>
              </Link>
            )}
          </Modal.Footer>
        </Modal>
      </Container>
    </UserLayout>
  );
};

export default AppointmentList; 