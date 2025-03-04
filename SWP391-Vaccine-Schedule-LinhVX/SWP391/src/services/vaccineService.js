import axios from 'axios';

const API_URL = 'http://localhost:8080/api/vaccines';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    return { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
    };
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
    async addVaccine(formData) {
        const headers = {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data'
        };
        console.log('Headers for add request:', headers);
        
        const response = await axios.post(`${API_URL}/add`, formData, { 
            headers
        });
        return response.data;
    },

    async updateVaccine(id, formData) {
        try {
            const headers = {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            };
            console.log('Headers for update request:', headers);
            
            const response = await axios.put(`${API_URL}/${id}`, formData, { 
                headers,
                transformRequest: (data) => data // Prevent axios from trying to transform FormData
            });
            return response.data;
        } catch (error) {
            console.error('Update error:', error.response?.data || error);
            throw error;
        }
    },

    async getAllVaccines() {
        try {
            const headers = getAuthHeader();
            console.log('Fetching vaccines with headers:', headers);

            // There is only one valid endpoint in the backend: /api/vaccines
            try {
                console.log('Requesting vaccines from:', API_URL);
                const response = await axios.get(API_URL, {
                    headers
                });
                console.log('Vaccines fetched successfully');
                return response.data;
            } catch (error) {
                console.error('Error details:', error.response?.status, error.response?.data);
                
                // Check if it's an auth error
                if (error.response?.status === 401 || error.response?.status === 403) {
                    throw new Error('Authentication error: Please log in again');
                } else {
                    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch vaccines');
                }
            }
        } catch (error) {
            console.error('Error fetching vaccines:', error.message);
            throw error;
        }
    },

    async deleteVaccine(id) {
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    async searchVaccines(searchTerm) {
        const response = await axios.get(`${API_URL}/search?name=${searchTerm}`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default vaccineService; 