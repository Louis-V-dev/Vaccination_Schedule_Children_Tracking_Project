import React, { useEffect } from 'react';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faChild, faSignOutAlt, faCog } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import '../css/NavBar.css';

const NavBar = () => {
	const navigate = useNavigate();
	const token = localStorage.getItem('token');
	const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

	useEffect(() => {
		if (token) {
			try {
				const decodedToken = jwtDecode(token);
				const currentTime = Date.now() / 1000;
				
				if (decodedToken.exp < currentTime) {
					handleLogout();
					toast.error('Session expired. Please login again.');
					navigate('/login');
				}
			} catch (error) {
				handleLogout();
				toast.error('Invalid session. Please login again.');
				navigate('/login');
			}
		}
	}, [token, navigate]);

	const handleLogout = () => {
		localStorage.clear(); // Clear all localStorage items
		toast.success('Logged out successfully');
		navigate('/login');
	};

	const renderProfileDropdown = () => (
		<div className="profile-container">
			<NavDropdown 
				title={
					<div className="profile-icon">
						<FontAwesomeIcon icon={faUser} />
					</div>
				} 
				id="profile-dropdown"
				className="profile-dropdown"
				align="end"
			>
				<NavDropdown.Item as={Link} to="/profile">
					<FontAwesomeIcon icon={faUser} className="me-2" />
					My Profile
				</NavDropdown.Item>
				<NavDropdown.Item as={Link} to="/children">
					<FontAwesomeIcon icon={faChild} className="me-2" />
					My Children
				</NavDropdown.Item>
				<NavDropdown.Item as={Link} to="/settings">
					<FontAwesomeIcon icon={faCog} className="me-2" />
					Settings
				</NavDropdown.Item>
				<NavDropdown.Divider />
				<NavDropdown.Item onClick={handleLogout} className="text-danger">
					<FontAwesomeIcon icon={faSignOutAlt} className="me-2" />
					Logout
				</NavDropdown.Item>
			</NavDropdown>
		</div>
	);

	return (
		<Navbar bg="light" expand={false} className="shadow-sm">
			<Container>
				<Navbar.Brand as={Link} to="/" className="fw-bold text-primary">
					Vaccination Schedule
				</Navbar.Brand>
				<Nav className="me-auto">
					<Nav.Link as={Link} to="/" className="px-3">Home</Nav.Link>
					<Nav.Link as={Link} to="/AboutUs" className="px-3">About Us</Nav.Link>
					<Nav.Link as={Link} to="/PriceList" className="px-3">Price List</Nav.Link>
				</Nav>
				{!isLoggedIn && (
					<div className="d-flex align-items-center">
						<Link to="/Login" className="btn btn-outline-primary me-2">
							Login
						</Link>
						<Link to="/Register" className="btn btn-primary">
							Register
						</Link>
					</div>
				)}
			</Container>
			{isLoggedIn && renderProfileDropdown()}
		</Navbar>
	);
};

export default NavBar;
