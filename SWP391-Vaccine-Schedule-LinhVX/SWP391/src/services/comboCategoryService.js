import axios from 'axios';

const API_URL = 'http://localhost:8080/api/combo-categories';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const comboCategoryService = {
    getAllCategories: async () => {
        try {
            const response = await axios.get(API_URL, {
                headers: {
                    ...getAuthHeaders(),
                    'Accept': 'application/json'
                }
            });

            if (response.data && response.data.result) {
                return response.data.result;
            }
            throw new Error('Invalid response format from server');
        } catch (error) {
            console.error('Error fetching combo categories:', error.response?.data || error);
            throw error;
        }
    },

    getCategoryById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/${id}`, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            console.error('Error fetching combo category:', error.response?.data || error);
            throw error;
        }
    },

    createCategory: async (categoryData) => {
        try {
            const response = await axios.post(API_URL, categoryData, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });
            return response.data.result;
        } catch (error) {
            console.error('Error creating combo category:', error.response?.data || error);
            throw error;
        }
    },

    updateCategory: async (id, categoryData) => {
        try {
            const response = await axios.put(`${API_URL}/${id}`, categoryData, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });
            return response.data.result;
        } catch (error) {
            console.error('Error updating combo category:', error.response?.data || error);
            throw error;
        }
    },

    deleteCategory: async (id) => {
        try {
            const response = await axios.delete(`${API_URL}/${id}`, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting combo category:', error.response?.data || error);
            throw error;
        }
    }
};

export default comboCategoryService; 