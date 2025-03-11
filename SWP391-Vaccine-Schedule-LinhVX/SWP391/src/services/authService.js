import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080'; // adjust this to match your backend URL

// Create axios instance with default config
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized error (e.g., logout user)
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const authService = {
    register: async (userData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/register`, {
                username: userData.username,
                password: userData.password,
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phoneNumber: userData.phoneNumber,
                address: userData.address,
                dateOfBirth: userData.dateOfBirth,
                gender: userData.gender,
                urlImage: userData.urlImage || ""
            });
            
            console.log('Registration response:', response.data);

            // If the response itself is an error (code !== 100)
            if (response.data.code !== 100) {
                const customError = new Error(response.data.message);
                customError.code = response.data.code;
                
                // Handle specific error codes
                if (response.data.code === 409) {
                    // Check for both username and email in the error message
                    if (response.data.message.toLowerCase().includes('username')) {
                        customError.field = 'username';
                    } else if (response.data.message.toLowerCase().includes('email')) {
                        customError.field = 'email';
                    }
                }
                
                throw customError;
            }

            return {
                success: true,
                data: response.data.result,
                message: response.data.message
            };
        } catch (error) {
            console.log('Registration error details:', {
                response: error.response?.data,
                status: error.response?.status,
                message: error.message
            });

            // If the error has code and message (from our throw above)
            if (error.code && error.message) {
                throw error;
            }

            // If we have a response from the server but it wasn't caught above
            if (error.response?.data) {
                const errorData = error.response.data;
                let customError;
                
                // Handle specific error codes
                if (errorData.code === 409) {
                    customError = new Error(errorData.message || 'Registration failed');
                    customError.code = errorData.code;
                    
                    // Check for both username and email in the error message
                    if (errorData.message?.toLowerCase().includes('username')) {
                        customError.field = 'username';
                    } else if (errorData.message?.toLowerCase().includes('email')) {
                        customError.field = 'email';
                    }
                } 
                // Handle validation errors (400 Bad Request)
                else if (error.response.status === 400) {
                    customError = new Error(errorData.message || 'Validation error');
                    customError.code = 400;
                    
                    // Try to determine which field caused the validation error
                    if (errorData.message?.toLowerCase().includes('email')) {
                        customError.field = 'email';
                    } else if (errorData.message?.toLowerCase().includes('username')) {
                        customError.field = 'username';
                    } else if (errorData.message?.toLowerCase().includes('password')) {
                        customError.field = 'password';
                    } else if (errorData.message?.toLowerCase().includes('phone')) {
                        customError.field = 'phoneNumber';
                    } else if (errorData.message?.toLowerCase().includes('date')) {
                        customError.field = 'dateOfBirth';
                    }
                }
                else {
                    customError = new Error(errorData.message || 'Registration failed');
                    customError.code = errorData.code || error.response.status;
                }
                
                throw customError;
            }

            // For network errors or other issues
            throw new Error('Registration failed. Please try again later.');
        }
    },

    verifyEmail: async (email, code) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/verify-email`, {
                email,
                verificationCode: code
            });
            
            if (response.data && response.data.code === 100) {
                return {
                    success: true,
                    message: response.data.message || "Email verified successfully"
                };
            } else {
                throw new Error(response.data?.message || "Verification failed");
            }
        } catch (error) {
            console.error('Email verification error:', error.response?.data || error);
            
            // Handle specific error cases
            if (error.response?.data?.code === 2007) {
                throw new Error("Invalid verification code. Please try again.");
            } else if (error.response?.data?.code === 2006) {
                throw new Error("Verification code has expired. Please request a new one.");
            } else if (error.response?.data?.code === 2005) {
                throw new Error("Email has already been verified. You can now log in.");
            } else if (error.response?.data?.code === 1001) {
                throw new Error("No account found with this email address.");
            }
            
            throw new Error(error.response?.data?.message || "Failed to verify email. Please try again.");
        }
    },

    login: async (credentials) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                username: credentials.username,
                password: credentials.password
            });
            
            // If the backend returns a 2008 code for unverified email
            if (response.data && response.data.code === 2008) {
                // Get the email from the result if available
                const email = response.data.result?.email || '';
                
                throw {
                    isVerificationError: true,
                    message: response.data.message || "Email verification required. Please check your email and verify your account before logging in.",
                    email: email
                };
            }
            
            if (response.data && response.data.code === 100) {
                const token = response.data.result.token;
                
                // Store the token in localStorage
                localStorage.setItem('token', token);
                
                // Extract roles from JWT token
                try {
                    const tokenParts = token.split('.');
                    if (tokenParts.length === 3) {
                        const payload = JSON.parse(atob(tokenParts[1]));
                        if (payload.roles) {
                            localStorage.setItem('roles', JSON.stringify(payload.roles));
                        }
                    }
                } catch (e) {
                    console.error('Error extracting roles from token:', e);
                }
                
                // Return successful login response
                return {
                    success: true,
                    token: token,
                    message: "Login successful"
                };
            } else {
                throw new Error(response.data.message || "Login failed");
            }
        } catch (error) {
            // Check if it's our custom verification error
            if (error.isVerificationError) {
                throw error;
            }
            
            // Check if error response contains the EMAIL_NOT_VERIFIED code (2008)
            if (error.response?.data?.code === 2008) {
                const email = error.response.data.result?.email || '';
                throw {
                    isVerificationError: true,
                    message: error.response.data.message || "Email verification required",
                    email: email
                };
            }

            // Specific error for invalid credentials (code 2003 or 2004)
            if (error.response?.data?.code === 2003 || error.response?.data?.code === 2004) {
                throw new Error("Invalid username or password");
            }
            
            console.error('Login error:', error.response?.data || error);
            
            // If we have a response from the server
            if (error.response?.data) {
                const errorMessage = error.response.data.message || "Invalid username or password";
                throw new Error(errorMessage);
            }
            
            throw new Error("Login failed. Please try again later.");
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    getToken: () => {
        return localStorage.getItem('token');
    },

    // Add a function to resend verification email
    resendVerificationEmail: async (email) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/resend-verification`, { email });
            
            if (response.data && response.data.code === 100) {
                return {
                    success: true,
                    message: response.data.message || "Verification email resent successfully. Please check your inbox."
                };
            } else {
                throw new Error(response.data?.message || "Failed to resend verification email");
            }
        } catch (error) {
            console.error('Error resending verification:', error.response?.data || error);
            
            // Handle specific error cases
            if (error.response?.data?.code === 2005) {
                throw new Error("This email is already verified. You can log in now.");
            } else if (error.response?.data?.code === 1001) {
                throw new Error("No account found with this email address.");
            } else if (error.response?.data?.code === 400) {
                throw new Error("Invalid email address format.");
            }
            
            throw new Error(error.response?.data?.message || "Failed to resend verification email. Please try again.");
        }
    },

    // Request a password reset code
    requestPasswordReset: async (email) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/request-reset`, { email });
            
            if (response.data && response.data.code === 100) {
                return {
                    success: true,
                    message: response.data.message || "Reset code sent successfully. Please check your email."
                };
            } else {
                throw new Error(response.data?.message || "Failed to send reset code");
            }
        } catch (error) {
            console.error('Password reset request error:', error.response?.data || error);
            
            // Handle specific error cases
            if (error.response?.data?.code === 1001) {
                throw new Error("No account found with this email address.");
            }
            
            throw new Error(error.response?.data?.message || "Failed to send reset code. Please try again.");
        }
    },
    
    // Verify the reset code without changing the password
    verifyResetCode: async (email, code) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/verify-reset-code`, {
                email,
                resetCode: code
            });
            
            if (response.data && response.data.code === 100) {
                return {
                    success: true,
                    message: response.data.message || "Code verified successfully"
                };
            } else {
                throw new Error(response.data?.message || "Verification failed");
            }
        } catch (error) {
            console.error('Reset code verification error:', error.response?.data || error);
            
            // Handle specific error cases
            if (error.response?.data?.code === 2007) {
                throw new Error("Invalid verification code. Please try again.");
            } else if (error.response?.data?.code === 2006) {
                throw new Error("Verification code has expired. Please request a new one.");
            } else if (error.response?.data?.code === 1001) {
                throw new Error("No account found with this email address.");
            }
            
            throw new Error(error.response?.data?.message || "Failed to verify code. Please try again.");
        }
    },
    
    // Reset password with code
    resetPassword: async (email, code, newPassword) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/users/reset-password`, {
                email,
                resetCode: code,
                newPassword
            });
            
            if (response.data && response.data.code === 100) {
                return {
                    success: true,
                    message: response.data.message || "Password reset successfully"
                };
            } else {
                throw new Error(response.data?.message || "Password reset failed");
            }
        } catch (error) {
            console.error('Password reset error:', error.response?.data || error);
            
            // Handle specific error cases
            if (error.response?.data?.code === 2007) {
                throw new Error("Invalid verification code. Please try again.");
            } else if (error.response?.data?.code === 2006) {
                throw new Error("Verification code has expired. Please request a new one.");
            } else if (error.response?.data?.code === 1001) {
                throw new Error("No account found with this email address.");
            } else if (error.response?.data?.code === 2003) {
                throw new Error("Password must be between 3 and 16 characters.");
            }
            
            throw new Error(error.response?.data?.message || "Failed to reset password. Please try again.");
        }
    }
};

export default authService; 