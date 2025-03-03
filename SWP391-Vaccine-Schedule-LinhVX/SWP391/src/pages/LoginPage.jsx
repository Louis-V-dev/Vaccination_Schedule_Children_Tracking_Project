import React, { useState, useEffect } from "react";
import { Button, Col, Container, Form, Row, Card, Image } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaGoogle } from 'react-icons/fa';
import '../css/LoginPage.css';

function LoginPage() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});
	const [errors, setErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);

	// Check if user is already logged in
	useEffect(() => {
		if (authService.isAuthenticated()) {
			navigate('/');
		}
	}, [navigate]);

	const handleInputChange = (e) => {
		const { id, value } = e.target;
		setFormData(prev => ({
			...prev,
			[id.replace('txt', '').toLowerCase()]: value
		}));
		// Clear errors when user types
		setErrors(prev => ({
			...prev,
			[id.replace('txt', '').toLowerCase()]: ''
		}));
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
			
			if (response.code === 100 && response.result?.authenticated) {
				localStorage.setItem('token', response.result.token);
				localStorage.setItem('isLoggedIn', 'true');
				toast.success("Login successful!");
				navigate("/", { replace: true });
			} else {
				// Handle specific error codes
				if (response.code === 1003) {
					setErrors({ username: "Username does not exist" });
					toast.error("Username does not exist");
				} else if (response.code === 2003) {
					setErrors({ password: "Invalid username or password" });
					toast.error("Invalid username or password");
				} else {
					toast.error(response.message || "Login failed");
				}
			}
		} catch (error) {
			console.error('Login error:', error);
			if (error.response?.status === 403) {
				toast.error("Access denied. Please check your credentials.");
			} else if (error.response?.data?.code === 1003) {
				setErrors({ username: "Username does not exist" });
				toast.error("Username does not exist");
			} else if (error.response?.data?.code === 2003) {
				setErrors({ password: "Invalid username or password" });
				toast.error("Invalid username or password");
			} else {
				toast.error(error.response?.data?.message || "Login failed. Please try again.");
			}
		} finally {
			setIsLoading(false);
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
											isInvalid={!!errors.username}
										/>
										<Form.Control.Feedback type="invalid">
											{errors.username}
										</Form.Control.Feedback>
									</div>
								</Form.Group>

								<Form.Group className="form-group" controlId="txtPassword">
									<div className="input-group">
										<span className="input-group-text">
											<FaLock />
										</span>
										<Form.Control 
											type="password" 
											placeholder="Password" 
											value={formData.password}
											onChange={handleInputChange}
											isInvalid={!!errors.password}
										/>
										<Form.Control.Feedback type="invalid">
											{errors.password}
										</Form.Control.Feedback>
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
		</Container>
	);
}

export default LoginPage;
