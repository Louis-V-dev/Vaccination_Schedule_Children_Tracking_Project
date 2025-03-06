import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    return { Authorization: `Bearer ${token}` };
};

// Add a refresh token function to handle expired tokens
const refreshTokenIfNeeded = async (error) => {
    // If unauthorized or forbidden, token might be expired
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('Token might be expired, trying to refresh...');
        try {
            // Using the auth endpoint to refresh token - adjust this to match your backend
            const refreshResponse = await axios.post('http://localhost:8080/auth/refresh', {
                token: localStorage.getItem('token')
            });
            
            // If we got a new token
            if (refreshResponse.data?.result?.token) {
                console.log('Token refreshed successfully');
                localStorage.setItem('token', refreshResponse.data.result.token);
                return true;
            }
        } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
            // If refresh fails, clear token and let user login again
            localStorage.removeItem('token');
            return false;
        }
    }
    return false;
};

const vaccineService = {
    // Get all vaccines
    getAllVaccines: async () => {
        try {
            const response = await axios.get(`${API_URL}/vaccines`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching vaccines:', error);
            throw error;
        }
    },

    // Search vaccines
    searchVaccines: async (query) => {
        try {
            const response = await axios.get(`${API_URL}/vaccines/search?query=${query}`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error searching vaccines:', error);
            throw error;
        }
    },

    // Add a new vaccine
    addVaccine: async (formData) => {
        try {
            const response = await axios.post(
                `${API_URL}/vaccines`,
                formData,
                {
                    headers: {
                        ...getAuthHeader(),
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );
            return response;
        } catch (error) {
            console.error('Error adding vaccine:', error);
            console.log('Server response:', error.response?.data);
            throw error;
        }
    },

    // Update a vaccine
    updateVaccine: async (id, formData) => {
        try {
            const response = await axios.put(`${API_URL}/vaccines/${id}`, formData, {
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating vaccine:', error);
            console.log('Server response:', error.response?.data);
            throw error;
        }
    },

    // Delete a vaccine
    deleteVaccine: async (id) => {
        try {
            const response = await axios.delete(`${API_URL}/vaccines/${id}`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting vaccine:', error);
            throw error;
        }
    },

    // Get vaccine categories
    getVaccineCategories: async () => {
        try {
            const response = await axios.get(`${API_URL}/vaccines/categories`, {
                headers: getAuthHeader()
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching vaccine categories:', error);
            throw error;
        }
    },

    // Add a new vaccine category
    addVaccineCategory: async (categoryName) => {
        try {
            const response = await axios.post(`${API_URL}/vaccines/categories`, { name: categoryName }, {
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error adding vaccine category:', error);
            throw error;
        }
    }
};

export default vaccineService; 