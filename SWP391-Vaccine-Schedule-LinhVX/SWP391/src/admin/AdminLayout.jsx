import React from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminLayout = ({ children }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('isLoggedIn');
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <Navbar.Brand as={Link} to="/">Admin Dashboard</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <Nav.Link as={Link} to="/ManageAccount">Accounts</Nav.Link>
                            <Nav.Link as={Link} to="/ManageVaccine">Vaccines</Nav.Link>
                            <Nav.Link as={Link} to="/ManageCombo">Vaccine Combos</Nav.Link>
                            <Nav.Link as={Link} to="/ManageSchedule">Manage Schedules</Nav.Link>
                            <Nav.Link as={Link} to="/WorkSchedule">Work Schedule</Nav.Link>
                            <Nav.Link as={Link} to="/ManagePayment">Payments</Nav.Link>
                        </Nav>
                        <Nav>
                            <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <Container className="mt-4">
                {children}
            </Container>
        </>
    );
};

export default AdminLayout; 