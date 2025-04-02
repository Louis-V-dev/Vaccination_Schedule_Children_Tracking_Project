import React, { useState, useEffect } from "react";
import { Button, Col, Container, Form, Row, Card, Image, Modal, InputGroup, Alert } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import authService from "../services/authService";
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaGoogle, FaEnvelope } from 'react-icons/fa';
import '../css/LoginPage.css';

function LoginPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});
	const [errors, setErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [showVerificationModal, setShowVerificationModal] = useState(false);
	const [verificationEmail, setVerificationEmail] = useState("");
	const [resendLoading, setResendLoading] = useState(false);
	const [verificationCode, setVerificationCode] = useState("");
	const [verificationError, setVerificationError] = useState("");
	const [verifyLoading, setVerifyLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");

	// Forgot password states
	const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
	const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
	const [forgotPasswordCode, setForgotPasswordCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [resetStep, setResetStep] = useState(1); // 1: Enter email, 2: Verify code, 3: Set new password
	const [forgotPasswordError, setForgotPasswordError] = useState("");
	const [resetLoading, setResetLoading] = useState(false);

	// Check if user is already logged in and check for success message from registration
	useEffect(() => {
		// Check for registrationSuccess in URL parameters
		const queryParams = new URLSearchParams(location.search);
		const registrationSuccess = queryParams.get('registrationSuccess');
		
		if (registrationSuccess === 'true') {
			setSuccessMessage("Registration successful! Please login with your credentials.");
			// Clear the parameter to prevent showing the message again on refresh
			navigate('/login', { replace: true });
		}
		
		// Only redirect if we're not coming from registration
		if (authService.isAuthenticated() && !registrationSuccess) {
			navigate('/');
		}
	}, [navigate, location]);

	const handleInputChange = (e) => {
		const { id, name, value } = e.target;
		// Use name if available, otherwise extract from id
		const fieldName = name || id.replace('txt', '').toLowerCase();
		
		setFormData(prev => ({
			...prev,
			[fieldName]: value
		}));
		
		// Clear errors when user types
		if (errors[fieldName]) {
			setErrors(prev => ({
				...prev,
				[fieldName]: ''
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {};
		
		if (!formData.username) {
			newErrors.username = "Username is required";
		}
		if (!formData.password) {
			newErrors.password = "Password is required";
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
			const response = await authService.login(formData);
			
			if (response.success) {
				localStorage.setItem('isLoggedIn', 'true');
				toast.success("Login successful!");
				navigate("/", { replace: true });
			}
		} catch (error) {
			console.error('Login error:', error);
			
			// Handle verification error
			if (error.isVerificationError) {
				setVerificationEmail(error.email || "");
				setShowVerificationModal(true);
				toast.warning("Email verification required");
			} else if (error.response?.status === 403) {
				toast.error("Access denied. Please check your credentials.");
				setErrors({ password: "Invalid username or password" });
			} else if (error.response?.data?.code === 1003) {
				setErrors({ username: "Username does not exist" });
				toast.error("Username does not exist");
			} else if (error.response?.data?.code === 2003 || error.message?.includes("Invalid username or password")) {
				setErrors({ password: "Invalid username or password" });
				toast.error("Invalid username or password");
			} else if (error.response?.data?.code === 2004) {
				setErrors({ password: "Invalid username or password" });
				toast.error("Invalid username or password");
			} else {
				toast.error(error.message || "Login failed. Please try again.");
				setErrors({ password: error.message || "Login failed. Please try again." });
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendVerification = async () => {
		if (!verificationEmail) {
			toast.error("Email address is required");
			return;
		}

		try {
			setResendLoading(true);
			await authService.resendVerificationEmail(verificationEmail);
			toast.success("Verification email sent successfully. Please check your inbox.");
			// Don't close the modal, keep it open for code entry
			setVerificationCode(""); // Clear any previous code
			setVerificationError(""); // Clear any previous errors
		} catch (error) {
			toast.error(error.message || "Failed to resend verification email");
		} finally {
			setResendLoading(false);
		}
	};

	const handleVerifyEmail = async () => {
		if (!verificationEmail || !verificationCode) {
			setVerificationError("Email and verification code are required");
			return;
		}

		try {
			setVerifyLoading(true);
			setVerificationError("");
			
			const response = await authService.verifyEmail(verificationEmail, verificationCode);
			
			toast.success("Email verified successfully! You can now log in.");
			setShowVerificationModal(false);
			// Clear the verification fields
			setVerificationCode("");
			setVerificationError("");
		} catch (error) {
			setVerificationError(error.message || "Invalid verification code");
			toast.error(error.message || "Failed to verify email");
		} finally {
			setVerifyLoading(false);
		}
	};

	// Add handler for forgot password link
	const handleForgotPasswordClick = () => {
		setForgotPasswordEmail("");
		setForgotPasswordCode("");
		setNewPassword("");
		setConfirmPassword("");
		setForgotPasswordError("");
		setResetStep(1);
		setShowForgotPasswordModal(true);
	};

	// Handler to request password reset code
	const handleRequestResetCode = async () => {
		if (!forgotPasswordEmail) {
			setForgotPasswordError("Email address is required");
			return;
		}

		try {
			setResetLoading(true);
			await authService.requestPasswordReset(forgotPasswordEmail);
			toast.success("Password reset code sent to your email");
			setResetStep(2);
			setForgotPasswordError("");
		} catch (error) {
			setForgotPasswordError(error.message || "Failed to send reset code");
			toast.error(error.message || "Failed to send reset code");
		} finally {
			setResetLoading(false);
		}
	};

	// Handler to verify reset code
	const handleVerifyResetCode = async () => {
		if (!forgotPasswordCode) {
			setForgotPasswordError("Verification code is required");
			return;
		}

		try {
			setResetLoading(true);
			// We only verify the code is valid, we don't reset the password yet
			await authService.verifyResetCode(forgotPasswordEmail, forgotPasswordCode);
			setResetStep(3);
			setForgotPasswordError("");
		} catch (error) {
			setForgotPasswordError(error.message || "Invalid verification code");
			toast.error(error.message || "Invalid verification code");
		} finally {
			setResetLoading(false);
		}
	};

	// Handler to reset password
	const handleResetPassword = async () => {
		if (!newPassword) {
			setForgotPasswordError("New password is required");
			return;
		}

		if (newPassword.length < 3) {
			setForgotPasswordError("Password must be at least 3 characters");
			return;
		}

		if (newPassword !== confirmPassword) {
			setForgotPasswordError("Passwords do not match");
			return;
		}

		try {
			setResetLoading(true);
			await authService.resetPassword(forgotPasswordEmail, forgotPasswordCode, newPassword);
			toast.success("Password reset successfully! You can now log in with your new password.");
			setShowForgotPasswordModal(false);
			
			// Set success message to display on login form
			setSuccessMessage("Password reset successfully! You can now log in with your new password.");
			
			// Clear the password fields in the login form
			setFormData(prev => ({
				...prev,
				password: ""
			}));
		} catch (error) {
			setForgotPasswordError(error.message || "Failed to reset password");
			toast.error(error.message || "Failed to reset password");
		} finally {
			setResetLoading(false);
		}
	};

	return (
		<Container fluid className="login-page">
			<Row className="justify-content-center w-100">
				<Col md={8} lg={6} xl={4}>
					<Card className="login-card">
						<Card.Body className="login-card-body">
							<div className="text-center mb-4">
								<Image 
									src="/logo-medical.png" 
									alt="Logo" 
									className="login-logo"
								/>
								<h2 className="text-primary mb-3">Welcome Back!</h2>
								<p className="text-muted">
									Sign in to manage your vaccination schedule
								</p>
							</div>

							{successMessage && (
								<Alert variant="success" className="mb-4">
									{successMessage}
								</Alert>
							)}

							<Form onSubmit={handleSubmit} noValidate>
								<Form.Group className="form-group" controlId="txtUsername">
									<div className="input-group">
										<span className="input-group-text">
											<FaUser />
										</span>
										<Form.Control
											type="text"
											placeholder="Enter username"
											value={formData.username}
											onChange={handleInputChange}
											name="username"
											isInvalid={!!errors.username}
										/>
									</div>
									{errors.username && (
										<div className="error-text">
											{errors.username}
										</div>
									)}
								</Form.Group>

								<Form.Group className="form-group" controlId="txtLoginPassword">
									<div className="input-group">
										<span className="input-group-text">
											<FaLock />
										</span>
										<Form.Control
											type="password"
											placeholder="Enter password"
											value={formData.password}
											onChange={handleInputChange}
											name="password"
											isInvalid={!!errors.password}
										/>
									</div>
									{errors.password && (
										<div className="error-text">
											{errors.password}
										</div>
									)}
									<div className="text-end mt-1">
										<a href="#" onClick={(e) => { e.preventDefault(); handleForgotPasswordClick(); }} className="text-decoration-none">
											Forgot Password?
										</a>
									</div>
								</Form.Group>

								<div className="d-grid gap-2">
									<Button 
										variant="primary" 
										type="submit" 
										disabled={isLoading}
									>
										{isLoading ? "Signing in..." : "Sign In"}
									</Button>

									<Button 
										variant="outline-primary" 
										className="btn-google"
										onClick={() => {/* Google login logic */}}
									>
										<FaGoogle /> Continue with Google
									</Button>
								</div>
							</Form>

							<div className="text-center mt-4">
								<p className="text-muted mb-0">
									New to our platform?{' '}
									<Link to="/register" className="link-primary">
										Create an account
									</Link>
								</p>
							</div>
						</Card.Body>
					</Card>
				</Col>
			</Row>

			{/* Email Verification Modal */}
			<Modal show={showVerificationModal} onHide={() => setShowVerificationModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Email Verification Required</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<p>Your account requires email verification before you can log in.</p>
					<p>We've sent a verification email to your registered email address. Please check your inbox and follow the instructions to verify your account.</p>
					
					<Form>
						<Form.Group className="mb-3" controlId="verificationEmailInput">
							<Form.Label>Your registered email:</Form.Label>
							<Form.Control
								type="email"
								value={verificationEmail}
								onChange={(e) => setVerificationEmail(e.target.value)}
								placeholder="Enter your email address"
							/>
							<Form.Text className="text-muted">
								If you need a new verification email, enter your email address and click "Resend".
							</Form.Text>
						</Form.Group>

						<Form.Group className="mb-3" controlId="verificationCodeInput">
							<Form.Label>Verification Code:</Form.Label>
							<Form.Control
								type="text"
								value={verificationCode}
								onChange={(e) => setVerificationCode(e.target.value)}
								placeholder="Enter the 6-digit code"
								isInvalid={!!verificationError}
							/>
							<Form.Control.Feedback type="invalid">
								{verificationError}
							</Form.Control.Feedback>
						</Form.Group>

						<div className="d-grid gap-2">
							<Button 
								variant="primary" 
								onClick={handleVerifyEmail}
								disabled={verifyLoading}
							>
								{verifyLoading ? "Verifying..." : "Verify Email"}
							</Button>
							
							<Button 
								variant="outline-primary" 
								onClick={handleResendVerification}
								disabled={resendLoading}
							>
								{resendLoading ? "Sending..." : "Resend Verification Email"}
							</Button>
						</div>
					</Form>
				</Modal.Body>
			</Modal>

			{/* Forgot Password Modal */}
			<Modal show={showForgotPasswordModal} onHide={() => setShowForgotPasswordModal(false)}>
				<Modal.Header closeButton>
					<Modal.Title>Reset Password</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					{resetStep === 1 && (
						<>
							<p>Enter your email address to receive a password reset code.</p>
							<Form.Group className="mb-3" controlId="forgotPasswordEmailInput">
								<Form.Label>Email Address</Form.Label>
								<Form.Control
									type="email"
									value={forgotPasswordEmail}
									onChange={(e) => setForgotPasswordEmail(e.target.value)}
									placeholder="Enter your email"
									isInvalid={!!forgotPasswordError}
								/>
								{forgotPasswordError && (
									<Form.Control.Feedback type="invalid">
										{forgotPasswordError}
									</Form.Control.Feedback>
								)}
							</Form.Group>
							<div className="d-grid">
								<Button
									variant="primary"
									onClick={handleRequestResetCode}
									disabled={resetLoading}
								>
									{resetLoading ? "Sending..." : "Send Reset Code"}
								</Button>
							</div>
						</>
					)}

					{resetStep === 2 && (
						<>
							<p>Enter the verification code sent to your email.</p>
							<Form.Group className="mb-3" controlId="forgotPasswordCodeInput">
								<Form.Label>Verification Code</Form.Label>
								<Form.Control
									type="text"
									value={forgotPasswordCode}
									onChange={(e) => setForgotPasswordCode(e.target.value)}
									placeholder="Enter 6-digit code"
									isInvalid={!!forgotPasswordError}
								/>
								{forgotPasswordError && (
									<Form.Control.Feedback type="invalid">
										{forgotPasswordError}
									</Form.Control.Feedback>
								)}
							</Form.Group>
							<div className="d-grid">
								<Button
									variant="primary"
									onClick={handleVerifyResetCode}
									disabled={resetLoading}
								>
									{resetLoading ? "Verifying..." : "Verify Code"}
								</Button>
							</div>
							<div className="text-center mt-3">
								<Button
									variant="link"
									onClick={handleRequestResetCode}
									disabled={resetLoading}
								>
									Resend Code
								</Button>
							</div>
						</>
					)}

					{resetStep === 3 && (
						<>
							<p>Create a new password for your account.</p>
							<Form.Group className="mb-3" controlId="newPasswordInput">
								<Form.Label>New Password</Form.Label>
								<Form.Control
									type="password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									placeholder="Enter new password"
									isInvalid={!!forgotPasswordError}
								/>
							</Form.Group>
							<Form.Group className="mb-3" controlId="confirmPasswordInput">
								<Form.Label>Confirm Password</Form.Label>
								<Form.Control
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="Confirm new password"
									isInvalid={!!forgotPasswordError}
								/>
								{forgotPasswordError && (
									<Form.Control.Feedback type="invalid">
										{forgotPasswordError}
									</Form.Control.Feedback>
								)}
							</Form.Group>
							<div className="d-grid">
								<Button
									variant="primary"
									onClick={handleResetPassword}
									disabled={resetLoading}
								>
									{resetLoading ? "Resetting..." : "Reset Password"}
								</Button>
							</div>
						</>
					)}
				</Modal.Body>
			</Modal>
		</Container>
	);
}

export default LoginPage;
