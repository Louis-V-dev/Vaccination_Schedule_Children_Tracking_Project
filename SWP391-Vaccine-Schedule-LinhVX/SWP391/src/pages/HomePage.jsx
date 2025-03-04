import React from 'react';
import NavBar from '../components/NavBar';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSyringe, FaCalendarAlt, FaBell, FaUserMd, FaChartLine, FaShieldAlt, FaSignOutAlt } from 'react-icons/fa';
import '../css/HomePage.css';
import authService from '../services/authService';

const HomePage = () => {
	const isLoggedIn = authService.isAuthenticated();

	const handleLogout = () => {
		authService.logout();
	};

	return (
		<div className="home-page">
			<NavBar />

			{/* Hero Section */}
			<section className="hero-section">
				<Container>
					<Row className="align-items-center">
						<Col lg={6} className="hero-content">
							<h1 className="hero-title">Protecting Your Family's Health Through Timely Vaccinations</h1>
							<p className="hero-subtitle">
								Schedule and track vaccinations for your loved ones with our easy-to-use platform.
								Stay up-to-date with immunization schedules and receive timely reminders.
							</p>
							{isLoggedIn ? (
								<Button as={Link} to="/appointments/new" className="btn-cta">
									Make Appointment Now
								</Button>
							) : (
								<Button as={Link} to="/register" className="btn-cta">
									Get Started Now
								</Button>
							)}
						</Col>
					</Row>
				</Container>
			</section>

			{/* Features Section */}
			<section className="features-section" id="features">
				<Container>
					<h2 className="text-center mb-5">Why Choose VaccineCare?</h2>
					<Row>
						<Col md={4} className="mb-4">
							<div className="feature-card">
								<div className="feature-icon">
									<FaCalendarAlt />
								</div>
								<h3 className="feature-title">Easy Scheduling</h3>
								<p className="feature-description">
									Book vaccination appointments with just a few clicks. Choose your preferred time and location.
								</p>
							</div>
						</Col>
						<Col md={4} className="mb-4">
							<div className="feature-card">
								<div className="feature-icon">
									<FaBell />
								</div>
								<h3 className="feature-title">Smart Reminders</h3>
								<p className="feature-description">
									Never miss a vaccination with our intelligent reminder system. Stay on track with immunization schedules.
								</p>
							</div>
						</Col>
						<Col md={4} className="mb-4">
							<div className="feature-card">
								<div className="feature-icon">
									<FaChartLine />
								</div>
								<h3 className="feature-title">Track Progress</h3>
								<p className="feature-description">
									Monitor vaccination history and upcoming schedules. Keep all records in one secure place.
								</p>
							</div>
						</Col>
					</Row>
				</Container>
			</section>

			{/* Stats Section */}
			<section className="stats-section">
				<Container>
					<Row>
						<Col md={4}>
							<div className="stat-card">
								<div className="stat-number">10,000+</div>
								<div className="stat-label">Registered Users</div>
							</div>
						</Col>
						<Col md={4}>
							<div className="stat-card">
								<div className="stat-number">50+</div>
								<div className="stat-label">Healthcare Partners</div>
							</div>
						</Col>
						<Col md={4}>
							<div className="stat-card">
								<div className="stat-number">98%</div>
								<div className="stat-label">Satisfaction Rate</div>
							</div>
						</Col>
					</Row>
				</Container>
			</section>

			{/* CTA Section */}
			<section className="cta-section">
				<Container>
					<h2 className="cta-title">Ready to Start Your Vaccination Journey?</h2>
					<p className="cta-description">
						Join thousands of families who trust VaccineCare for their vaccination needs.
						{isLoggedIn ? 'Schedule your next vaccination appointment today.' : 'Create your account today and take the first step towards better health management.'}
					</p>
					{isLoggedIn ? (
						<Button as={Link} to="/appointments/new" className="btn-cta">
							Schedule Appointment
						</Button>
					) : (
						<Button as={Link} to="/register" className="btn-cta">
							Create Free Account
						</Button>
					)}
				</Container>
			</section>
		</div>
	);
};

export default HomePage;
