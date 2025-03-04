import axios from 'axios';

const API_URL = 'http://localhost:8080/api/vaccine-combos';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const vaccineComboService = {
    getAllCombos: async () => {
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
            console.error('Error fetching vaccine combos:', error.response?.data || error);
            throw error;
        }
    },

    getComboById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/${id}`, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            console.error('Error fetching vaccine combo:', error.response?.data || error);
            throw error;
        }
    },

    createCombo: async (comboData) => {
        try {
            const response = await axios.post(API_URL, comboData, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            console.error('Error creating vaccine combo:', error.response?.data || error);
            throw error;
        }
    },

    updateCombo: async (id, comboData) => {
        try {
            const response = await axios.put(`${API_URL}/${id}`, comboData, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            console.error('Error updating vaccine combo:', error.response?.data || error);
            throw error;
        }
    },

    deleteCombo: async (id) => {
        try {
            await axios.delete(`${API_URL}/${id}`, {
                headers: getAuthHeaders()
            });
        } catch (error) {
            console.error('Error deleting vaccine combo:', error.response?.data || error);
            throw error;
        }
    }
};

export default vaccineComboService; 