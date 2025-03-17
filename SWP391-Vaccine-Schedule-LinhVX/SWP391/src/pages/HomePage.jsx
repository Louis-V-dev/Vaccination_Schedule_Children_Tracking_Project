import React, { useEffect } from 'react';
import NavBar from '../components/NavBar';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSyringe, FaCalendarAlt, FaBell, FaUserMd, FaChartLine, FaShieldAlt, FaSignOutAlt } from 'react-icons/fa';
import '../css/HomePage.css';
import authService from '../services/authService';
import ImageCarousel from '../components/ImageCarousel';
import FloatingElements from '../components/FloatingElements';
import ScrollToTop from '../components/ScrollToTop';
import VaccinationVideo from '../components/VaccinationVideo';
import EndlessLoopVideo from '../components/EndlessLoopVideo';
import AIInfinityLoop from '../components/AIInfinityLoop';
import { motion } from 'framer-motion';
import TestimonialSection from '../components/TestimonialSection';

const HomePage = () => {
	const isLoggedIn = authService.isAuthenticated();

	const handleLogout = () => {
		authService.logout();
	};

	// Add AOS initialization
	useEffect(() => {
		// If you're using AOS library, initialize it here
		// AOS.init({ duration: 1000 });
	}, []);

	return (
		<div className="home-page">
			<NavBar />

			{/* Hero Section */}
			<section className="hero-section">
				<FloatingElements />
				<Container className="position-relative" style={{ zIndex: 2 }}>
					<Row className="align-items-center">
						<Col lg={6} className="hero-content">
							<motion.h1 
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8 }}
								className="hero-title mb-4"
							>
								Your Family's Health Journey Starts Here
							</motion.h1>
							<motion.p 
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 0.2 }}
								className="hero-subtitle mb-5"
							>
								Ensure your loved ones' well-being with our comprehensive vaccination tracking and scheduling platform. Smart reminders, easy booking, and secure health records - all in one place.
							</motion.p>
							<motion.div
								initial={{ opacity: 0, y: 30 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 0.4 }}
							>
								{isLoggedIn ? (
									<Button as={Link} to="/booking" className="btn-cta">
										Schedule Your Vaccination
									</Button>
								) : (
									<Button as={Link} to="/register" className="btn-cta">
										Start Your Health Journey
									</Button>
								)}
							</motion.div>
						</Col>
					</Row>
				</Container>
			</section>

			{/* Image Carousel Section */}
			<section className="carousel-section py-5">
				<Container>
					<motion.div
						initial={{ opacity: 0 }}
						whileInView={{ opacity: 1 }}
						transition={{ duration: 1 }}
						viewport={{ once: true }}
					>
						<ImageCarousel />
					</motion.div>
				</Container>
			</section>

			{/* Video Section */}
			<section className="video-section py-5">
				<Container>
					<Row className="justify-content-center">
						<Col lg={8} md={10}>
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8 }}
								viewport={{ once: true }}
								className="text-center mb-4"
							>
								<h2 className="section-title">Learn About Vaccination</h2>
								<p className="section-subtitle">Watch our informational video about the importance of childhood vaccinations</p>
							</motion.div>
							<VaccinationVideo />
						</Col>
					</Row>
				</Container>
			</section>

			{/* Features Section with Animation */}
			<section className="features-section py-5" id="features">
				<Container>
					<motion.h2 
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
						className="text-center mb-5"
					>
						Experience Modern Healthcare Management
					</motion.h2>
					<Row>
						<Col lg={4} md={6} className="mb-4">
							<motion.div 
								className="feature-card"
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.1 }}
								viewport={{ once: true }}
							>
								<div className="feature-icon">
									<FaCalendarAlt />
								</div>
								<h3 className="feature-title">Smart Scheduling</h3>
								<p className="feature-description">
									Easily book and manage vaccination appointments with our intuitive scheduling system.
								</p>
							</motion.div>
						</Col>
						<Col lg={4} md={6} className="mb-4">
							<motion.div 
								className="feature-card"
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.2 }}
								viewport={{ once: true }}
							>
								<div className="feature-icon">
									<FaBell />
								</div>
								<h3 className="feature-title">Timely Reminders</h3>
								<p className="feature-description">
									Receive personalized notifications for upcoming vaccinations and never miss an important date.
								</p>
							</motion.div>
						</Col>
						<Col lg={4} md={6} className="mb-4">
							<motion.div 
								className="feature-card"
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.3 }}
								viewport={{ once: true }}
							>
								<div className="feature-icon">
									<FaChartLine />
								</div>
								<h3 className="feature-title">Health Tracking</h3>
								<p className="feature-description">
									Monitor your family's vaccination progress and maintain comprehensive health records.
								</p>
							</motion.div>
						</Col>
					</Row>
				</Container>
			</section>

			{/* AI Infinity Loop Section */}
			<AIInfinityLoop />

			{/* Endless Loop Video Section */}
			<EndlessLoopVideo />

			{/* Testimonial Section */}
			<TestimonialSection />

			{/* Stats Section with Animation */}
			<section className="stats-section">
				<Container>
					<Row className="justify-content-center">
						<Col md={4} sm={6} className="mb-4">
							<motion.div 
								className="stat-card"
								initial={{ opacity: 0, scale: 0.9 }}
								whileInView={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.5 }}
								viewport={{ once: true }}
							>
								<div className="stat-number">10,000+</div>
								<div className="stat-label">Happy Families</div>
							</motion.div>
						</Col>
						<Col md={4} sm={6} className="mb-4">
							<motion.div 
								className="stat-card"
								initial={{ opacity: 0, scale: 0.9 }}
								whileInView={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.5, delay: 0.2 }}
								viewport={{ once: true }}
							>
								<div className="stat-number">50+</div>
								<div className="stat-label">Medical Partners</div>
							</motion.div>
						</Col>
						<Col md={4} sm={6} className="mb-4">
							<motion.div 
								className="stat-card"
								initial={{ opacity: 0, scale: 0.9 }}
								whileInView={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.5, delay: 0.4 }}
								viewport={{ once: true }}
							>
								<div className="stat-number">98%</div>
								<div className="stat-label">Success Rate</div>
							</motion.div>
						</Col>
					</Row>
				</Container>
			</section>

			{/* CTA Section with Animation */}
			<section className="cta-section py-5">
				<Container className="text-center">
					<motion.h2 
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						viewport={{ once: true }}
						className="cta-title mb-4"
					>
						Begin Your Family's Health Protection Journey
					</motion.h2>
					<motion.p 
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						viewport={{ once: true }}
						className="cta-description mb-5"
					>
						{isLoggedIn 
							? "Take the next step in protecting your family's health. Schedule your vaccination appointment today."
							: 'Join thousands of families who trust us with their vaccination needs. Start your journey to better health management today.'}
					</motion.p>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.4 }}
						viewport={{ once: true }}
					>
						{isLoggedIn ? (
							<Button as={Link} to="/booking" className="btn-cta">
								Book Your Appointment
							</Button>
						) : (
							<Button as={Link} to="/register" className="btn-cta">
								Join Us Today
							</Button>
						)}
					</motion.div>
				</Container>
			</section>

			{/* Scroll to Top Button */}
			<ScrollToTop />
		</div>
	);
};

export default HomePage;
