import axios from 'axios';

const API_URL = 'http://localhost:8080/api/combos';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    return { Authorization: `Bearer ${token}` };
};

const comboService = {
    async getAllCombos() {
        console.log('Fetching combos with headers:', getAuthHeader());
        const response = await axios.get(API_URL, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    async addCombo(comboData) {
        const response = await axios.post(API_URL, comboData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    },

    async updateCombo(id, comboData) {
        const response = await axios.put(`${API_URL}/${id}`, comboData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    },

    async deleteCombo(id) {
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    async searchCombos(searchTerm) {
        const response = await axios.get(`${API_URL}/search?name=${searchTerm}`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};

export default comboService; 