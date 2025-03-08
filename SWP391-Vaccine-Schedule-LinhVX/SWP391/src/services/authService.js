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
            const response = await axiosInstance.post('/api/users/register', userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    verifyEmail: async (email, code) => {
        try {
            const response = await axiosInstance.post('/api/users/verify-email', {
                email,
                verificationCode: code
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    login: async (credentials) => {
        try {
            console.log('Attempting login with:', credentials);
            
            // Validate credentials before sending
            if (!credentials.username || credentials.username.length < 3) {
                return {
                    code: 400,
                    message: "Username must be at least 3 characters long"
                };
            }
            if (!credentials.password || credentials.password.length < 3) {
                return {
                    code: 400,
                    message: "Password must be at least 3 characters long"
                };
            }

            const response = await axiosInstance.post('/auth/login', credentials);
            console.log('Login response:', response.data);
            
            if (response.data.result?.token) {
                localStorage.setItem('token', response.data.result.token);
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error.response?.data || error);
            
            // If we have a structured error response, return it
            if (error.response?.data) {
                return error.response.data;
            }
            
            // Otherwise, create a generic error response
            return {
                code: error.response?.status || 500,
                message: error.response?.data?.message || "Login failed. Please try again."
            };
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
    }
};

export default authService; 