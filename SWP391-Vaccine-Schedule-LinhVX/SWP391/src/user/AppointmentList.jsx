import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faEye, faCheckCircle, faTimesCircle, faClock } from '@fortawesome/free-solid-svg-icons';
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
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case 'PAID':
        return <Badge bg="success">Paid</Badge>;
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
                        <td>{formatDate(appointment.appointmentDate)}</td>
                        <td>{getStatusBadge(appointment.status)}</td>
                        <td>{getPaymentStatusBadge(appointment.paymentStatus)}</td>
                        <td>
                          <Link to={`/payment/status?appointmentId=${appointment.id}`}>
                            <Button size="sm" variant="info" className="me-2">
                              <FontAwesomeIcon icon={faEye} /> View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </UserLayout>
  );
};

export default AppointmentList; 