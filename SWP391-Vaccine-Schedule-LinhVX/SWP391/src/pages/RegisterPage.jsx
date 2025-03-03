import React, { useState } from "react";
import { Button, Col, Container, Form, Row, Card, Image } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaMapMarkerAlt, FaUserCircle } from 'react-icons/fa';
import '../css/RegisterPage.css';

function RegisterPage() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		firstName: "",
		lastName: "",
		gender: "MALE",
		username: "",
		password: "",
		confirmPassword: "",
		email: "",
		phoneNumber: "",
		address: "",
		urlImage: ""
	});
	const [errors, setErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);

	const handleInputChange = (e) => {
		const { id, value } = e.target;
		// Remove 'txt' prefix and map to the correct field name
		const fieldName = id === 'txtFirstName' ? 'firstName' :
						 id === 'txtLastName' ? 'lastName' :
						 id === 'txtUsername' ? 'username' :
						 id === 'txtPassword' ? 'password' :
						 id === 'txtConfirmPassword' ? 'confirmPassword' :
						 id === 'txtEmail' ? 'email' :
						 id === 'txtPhoneNumber' ? 'phoneNumber' :
						 id === 'txtAddress' ? 'address' : id;
		
		setFormData(prev => ({
			...prev,
			[fieldName]: value
		}));
	};

	const handleGenderChange = (e) => {
		setFormData(prev => ({
			...prev,
			gender: e.target.id.toUpperCase()
		}));
	};

	const validateForm = () => {
		const newErrors = {};
		
		if (!formData.firstName.trim()) {
			newErrors.firstName = "First name is required";
		}
		if (!formData.lastName.trim()) {
			newErrors.lastName = "Last name is required";
		}
		if (!formData.username || formData.username.length < 3) {
			newErrors.username = "Username must be at least 3 characters";
		}
		if (!formData.password || formData.password.length < 3) {
			newErrors.password = "Password must be at least 3 characters";
		}
		if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}
		if (!formData.email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(formData.email)) {
			newErrors.email = "Please enter a valid email";
		}
		if (!formData.phoneNumber || !/^0[0-9]{9}$/.test(formData.phoneNumber)) {
			newErrors.phoneNumber = "Phone number must start with 0 and have 10 digits";
		}
		if (!formData.address.trim()) {
			newErrors.address = "Address is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		if (!validateForm()) {
			return;
		}

		try {
			setIsLoading(true);
			const { confirmPassword, ...registrationData } = formData;
			console.log('Sending registration data:', registrationData);
			const response = await authService.register(registrationData);
			
			if (response.code === 100) {
				toast.success("Registration successful!");
				navigate("/login");
			} else {
				toast.error(response.message || "Registration failed");
			}
		} catch (error) {
			console.error('Registration error:', error);
			toast.error(error.response?.data?.message || "Registration failed");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Container fluid className="register-page">
			<Row className="justify-content-center">
				<Col md={10} lg={8} xl={6}>
					<Card className="register-card">
						<Card.Body className="register-card-body">
							<div className="text-center mb-4">
								<Image 
									src="/logo-medical.png" 
									alt="Logo" 
									className="register-logo"
								/>
								<h2 className="text-primary mb-3">Create Your Account</h2>
								<p className="text-muted">
									Join us to manage your family's vaccination schedule
								</p>
							</div>

							<Form onSubmit={handleSubmit}>
								<Row className="mb-4">
									<Col md={6}>
										<Form.Group controlId="txtFirstName">
											<div className="input-group">
												<span className="input-group-text">
													<FaUserCircle />
												</span>
												<Form.Control 
													type="text" 
													placeholder="First Name" 
													value={formData.firstName}
													onChange={handleInputChange}
													isInvalid={!!errors.firstName}
												/>
											</div>
											<Form.Control.Feedback type="invalid">
												{errors.firstName}
											</Form.Control.Feedback>
										</Form.Group>
									</Col>
									<Col md={6}>
										<Form.Group controlId="txtLastName">
											<div className="input-group">
												<span className="input-group-text">
													<FaUserCircle />
												</span>
												<Form.Control 
													type="text" 
													placeholder="Last Name" 
													value={formData.lastName}
													onChange={handleInputChange}
													isInvalid={!!errors.lastName}
												/>
											</div>
											<Form.Control.Feedback type="invalid">
												{errors.lastName}
											</Form.Control.Feedback>
										</Form.Group>
									</Col>
								</Row>

								<Form.Group className="form-group">
									<Form.Label className="text-muted">Gender</Form.Label>
									<div className="gender-group">
										<Form.Check 
											type="radio"
											label="Male"
											name="gender"
											id="male"
											checked={formData.gender === "MALE"}
											onChange={handleGenderChange}
										/>
										<Form.Check 
											type="radio"
											label="Female"
											name="gender"
											id="female"
											checked={formData.gender === "FEMALE"}
											onChange={handleGenderChange}
										/>
									</div>
								</Form.Group>

								<Form.Group className="form-group" controlId="txtUsername">
									<div className="input-group">
										<span className="input-group-text">
											<FaUser />
										</span>
										<Form.Control 
											type="text" 
											placeholder="Username (min 3 characters)" 
											value={formData.username}
											onChange={handleInputChange}
											isInvalid={!!errors.username}
										/>
									</div>
									<Form.Control.Feedback type="invalid">
										{errors.username}
									</Form.Control.Feedback>
								</Form.Group>

								<Row className="mb-4">
									<Col md={6}>
										<Form.Group controlId="txtPassword">
											<div className="input-group">
												<span className="input-group-text">
													<FaLock />
												</span>
												<Form.Control 
													type="password" 
													placeholder="Password (min 3 characters)" 
													value={formData.password}
													onChange={handleInputChange}
													isInvalid={!!errors.password}
												/>
											</div>
											<Form.Control.Feedback type="invalid">
												{errors.password}
											</Form.Control.Feedback>
										</Form.Group>
									</Col>
									<Col md={6}>
										<Form.Group controlId="txtConfirmPassword">
											<div className="input-group">
												<span className="input-group-text">
													<FaLock />
												</span>
												<Form.Control 
													type="password" 
													placeholder="Confirm Password" 
													value={formData.confirmPassword}
													onChange={handleInputChange}
													isInvalid={!!errors.confirmPassword}
												/>
											</div>
											<Form.Control.Feedback type="invalid">
												{errors.confirmPassword}
											</Form.Control.Feedback>
										</Form.Group>
									</Col>
								</Row>

								<Form.Group className="form-group" controlId="txtEmail">
									<div className="input-group">
										<span className="input-group-text">
											<FaEnvelope />
										</span>
										<Form.Control 
											type="email" 
											placeholder="Email Address" 
											value={formData.email}
											onChange={handleInputChange}
											isInvalid={!!errors.email}
										/>
									</div>
									<Form.Control.Feedback type="invalid">
										{errors.email}
									</Form.Control.Feedback>
								</Form.Group>

								<Form.Group className="form-group" controlId="txtPhoneNumber">
									<div className="input-group">
										<span className="input-group-text">
											<FaPhone />
										</span>
										<Form.Control 
											type="tel" 
											placeholder="Phone Number (start with 0)" 
											value={formData.phoneNumber}
											onChange={handleInputChange}
											isInvalid={!!errors.phoneNumber}
										/>
									</div>
									<Form.Control.Feedback type="invalid">
										{errors.phoneNumber}
									</Form.Control.Feedback>
								</Form.Group>

								<Form.Group className="form-group" controlId="txtAddress">
									<div className="input-group">
										<span className="input-group-text">
											<FaMapMarkerAlt />
										</span>
										<Form.Control 
											type="text" 
											placeholder="Address" 
											value={formData.address}
											onChange={handleInputChange}
											isInvalid={!!errors.address}
										/>
									</div>
									<Form.Control.Feedback type="invalid">
										{errors.address}
									</Form.Control.Feedback>
								</Form.Group>

								<div className="d-grid gap-2">
									<Button 
										variant="primary" 
										type="submit" 
										disabled={isLoading}
									>
										{isLoading ? "Creating Account..." : "Create Account"}
									</Button>
								</div>
							</Form>

							<div className="text-center mt-4">
								<p className="text-muted mb-0">
									Already have an account?{' '}
									<Link to="/login" className="link-primary">
										Sign in
									</Link>
								</p>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>
		</Container>
	);
}

export default RegisterPage;
