import React, { useState } from "react";
import { Button, Col, Container, Form, Row, Card, Image, Modal, Alert, InputGroup } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaMapMarkerAlt, FaUserCircle, FaCalendarAlt } from 'react-icons/fa';
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
		urlImage: "",
		dateOfBirth: ""
	});
	const [errors, setErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [showVerifyModal, setShowVerifyModal] = useState(false);
	const [verificationCode, setVerificationCode] = useState("");
	const [verificationError, setVerificationError] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [serverErrors, setServerErrors] = useState({});

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
						 id === 'txtAddress' ? 'address' :
						 id === 'txtDateOfBirth' ? 'dateOfBirth' : id;
		
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
		
		// First Name validation
		if (!formData.firstName.trim()) {
			newErrors.firstName = "First name is required";
		} else if (formData.firstName.length > 100) {
			newErrors.firstName = "First name cannot exceed 100 characters";
		}

		// Last Name validation
		if (!formData.lastName.trim()) {
			newErrors.lastName = "Last name is required";
		} else if (formData.lastName.length > 100) {
			newErrors.lastName = "Last name cannot exceed 100 characters";
		}

		// Username validation
		if (!formData.username) {
			newErrors.username = "Username is required";
		} else if (formData.username.length < 3 || formData.username.length > 30) {
			newErrors.username = "Username must be between 3 and 30 characters";
		}

		// Password validation
		if (!formData.password) {
			newErrors.password = "Password is required";
		} else if (formData.password.length < 3 || formData.password.length > 16) {
			newErrors.password = "Password must be between 3 and 16 characters";
		}

		// Confirm Password validation
		if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		// Email validation
		if (!formData.email) {
			newErrors.email = "Email is required";
		} else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(formData.email)) {
			newErrors.email = "Please enter a valid email address";
		} else if (formData.email.length > 50) {
			newErrors.email = "Email cannot exceed 50 characters";
		}

		// Phone validation
		if (!formData.phoneNumber) {
			newErrors.phoneNumber = "Phone number is required";
		} else if (!/^0[0-9]{9}$/.test(formData.phoneNumber)) {
			newErrors.phoneNumber = "Phone number must start with 0 and have 10 digits";
		}

		// Address validation
		if (!formData.address.trim()) {
			newErrors.address = "Address is required";
		} else if (formData.address.length > 100) {
			newErrors.address = "Address cannot exceed 100 characters";
		}

		// Date of Birth validation
		if (!formData.dateOfBirth) {
			newErrors.dateOfBirth = "Date of birth is required";
		} else {
			const dob = new Date(formData.dateOfBirth);
			const today = new Date();
			const age = today.getFullYear() - dob.getFullYear();
			
			if (dob > today) {
				newErrors.dateOfBirth = "Date of birth cannot be in the future";
			} else if (age > 120) {
				newErrors.dateOfBirth = "Please enter a valid date of birth";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setSuccess('');
		setServerErrors({});

		if (!validateForm()) {
			return;
		}

		try {
			setIsLoading(true);
			const response = await authService.register(formData);
			
			if (response.success) {
				setSuccess('Registration successful! Please check your email for verification.');
				setShowVerifyModal(true);
				toast.success("Account created! Email verification is required before you can log in. Please check your email for the verification code.");
			}
		} catch (err) {
			console.error('Registration error:', err);
			console.log('Error details:', {
				message: err.message,
				field: err.field,
				code: err.code,
				stack: err.stack
			});
			
			// Clear any previous errors
			setServerErrors({});
			
			if (err.field) {
				// Set field-specific error
				setServerErrors({
					[err.field]: err.message
				});
				
				// Show error message in toast
				toast.error(`${err.field}: ${err.message}`);
			} else {
				// Set general error message
				const errorMessage = err.message || 'Registration failed. Please try again later.';
				setError(errorMessage);
				toast.error(errorMessage);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifySubmit = async (e) => {
		e.preventDefault();
		if (!verificationCode.trim()) {
			setVerificationError("Please enter verification code");
			return;
		}

		try {
			setIsLoading(true);
			// Call verify endpoint
			const response = await authService.verifyEmail(formData.email, verificationCode);
			
			if (response.code === 100) {
				toast.success("Email verified successfully!");
				setShowVerifyModal(false);
				navigate("/login");
			} else {
				setVerificationError("Invalid verification code");
				toast.error("Invalid verification code");
			}
		} catch (error) {
			console.error('Verification error:', error);
			setVerificationError("Verification failed");
			toast.error("Verification failed");
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

							{error && (
								<Alert variant="danger" className="mb-4">
									{error}
								</Alert>
							)}

							{success && (
								<Alert variant="success" className="mb-4">
									{success}
								</Alert>
							)}

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
													isInvalid={!!errors.firstName || !!serverErrors.firstName}
												/>
											</div>
											<Form.Control.Feedback type="invalid">
												{errors.firstName || serverErrors.firstName}
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
													isInvalid={!!errors.lastName || !!serverErrors.lastName}
												/>
											</div>
											<Form.Control.Feedback type="invalid">
												{errors.lastName || serverErrors.lastName}
											</Form.Control.Feedback>
										</Form.Group>
									</Col>
								</Row>

								<Row className="mb-4">
									<Col md={6}>
										<Form.Group controlId="txtDateOfBirth">
											<div className="input-group">
												<span className="input-group-text">
													<FaCalendarAlt />
												</span>
												<Form.Control 
													type="date" 
													value={formData.dateOfBirth}
													onChange={handleInputChange}
													isInvalid={!!errors.dateOfBirth || !!serverErrors.dateOfBirth}
													max={new Date().toISOString().split('T')[0]}
													placeholder="Select your date of birth"
												/>
											</div>
											<Form.Text className="text-muted">
												Please enter your date of birth
											</Form.Text>
											<Form.Control.Feedback type="invalid">
												{errors.dateOfBirth || serverErrors.dateOfBirth}
											</Form.Control.Feedback>
										</Form.Group>
									</Col>
									<Col md={6}>
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
									</Col>
								</Row>

								<Form.Group controlId="txtUsername">
									<div className="input-group">
										<span className="input-group-text">
											<FaUser />
										</span>
										<Form.Control 
											type="text" 
											placeholder="Username (min 3 characters)" 
											value={formData.username}
											onChange={handleInputChange}
											isInvalid={!!errors.username || !!serverErrors.username}
										/>
									</div>
									{(errors.username || serverErrors.username) && (
										<div className="error-text">
											{errors.username || serverErrors.username}
										</div>
									)}
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
													isInvalid={!!errors.password || !!serverErrors.password}
												/>
											</div>
											{(errors.password || serverErrors.password) && (
												<div className="error-text">
													{errors.password || serverErrors.password}
												</div>
											)}
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
													isInvalid={!!errors.confirmPassword || !!serverErrors.confirmPassword}
												/>
											</div>
											{(errors.confirmPassword || serverErrors.confirmPassword) && (
												<div className="error-text">
													{errors.confirmPassword || serverErrors.confirmPassword}
												</div>
											)}
										</Form.Group>
									</Col>
								</Row>

								<Form.Group className="mb-4" controlId="txtEmail">
									<div className="input-group">
										<span className="input-group-text">
											<FaEnvelope />
										</span>
										<Form.Control
											type="email"
											placeholder="Email Address" 
											value={formData.email}
											onChange={handleInputChange}
											name="email"
											isInvalid={!!errors.email || !!serverErrors.email}
										/>
									</div>
									{(errors.email || serverErrors.email) && (
										<div className="error-text">
											{errors.email || serverErrors.email}
										</div>
									)}
								</Form.Group>

								<Form.Group className="mb-4" controlId="txtPhoneNumber">
									<div className="input-group">
										<span className="input-group-text">
											<FaPhone />
										</span>
										<Form.Control 
											type="tel" 
											placeholder="Phone Number (start with 0)" 
											value={formData.phoneNumber}
											onChange={handleInputChange}
											isInvalid={!!errors.phoneNumber || !!serverErrors.phoneNumber}
										/>
									</div>
									{(errors.phoneNumber || serverErrors.phoneNumber) && (
										<div className="error-text">
											{errors.phoneNumber || serverErrors.phoneNumber}
										</div>
									)}
								</Form.Group>

								<Form.Group className="mb-4" controlId="txtAddress">
									<div className="input-group">
										<span className="input-group-text">
											<FaMapMarkerAlt />
										</span>
										<Form.Control 
											type="text" 
											placeholder="Address" 
											value={formData.address}
											onChange={handleInputChange}
											isInvalid={!!errors.address || !!serverErrors.address}
										/>
									</div>
									{(errors.address || serverErrors.address) && (
										<div className="error-text">
											{errors.address || serverErrors.address}
										</div>
									)}
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

			{/* Verification Modal */}
			<Modal show={showVerifyModal} onHide={() => setShowVerifyModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Email Verification Required</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<div className="alert alert-info">
						<strong>Important:</strong> Your account will only be activated after email verification.
					</div>
					<p>We've sent a verification code to your email address. Please enter the code below to verify your account.</p>
					<p>You <strong>must verify your email</strong> before you can log in to your account.</p>
					<Form onSubmit={handleVerifySubmit}>
						<Form.Group className="mb-3">
							<Form.Control
								type="text"
								placeholder="Enter 6-digit verification code"
								value={verificationCode}
								onChange={(e) => setVerificationCode(e.target.value)}
								isInvalid={!!verificationError}
							/>
							<Form.Control.Feedback type="invalid">
								{verificationError}
							</Form.Control.Feedback>
						</Form.Group>
						<div className="d-grid">
							<Button variant="primary" type="submit" disabled={isLoading}>
								{isLoading ? "Verifying..." : "Verify Email"}
							</Button>
						</div>
					</Form>
				</Modal.Body>
			</Modal>
		</Container>
	);
}

export default RegisterPage;
