import axios from 'axios';

const API_URL = 'http://localhost:8080/api/vaccines';

const vaccineListService = {
    // Get all vaccines with pagination for public view
    getAllVaccines: async (page = 0, size = 10) => {
        try {
            const response = await axios.get(`${API_URL}`, {
                params: {
                    page,
                    size
                }
            });
            
            // Log the response to see its structure
            console.log('API Response:', response.data);

            // If response.data is an array, it's the list of vaccines
            if (Array.isArray(response.data)) {
                return {
                    vaccines: response.data,
                    totalItems: response.data.length,
                    totalPages: Math.ceil(response.data.length / size)
                };
            }

            // If response.data has a result property
            if (response.data && response.data.result) {
                return {
                    vaccines: response.data.result,
                    totalItems: response.data.totalItems || response.data.result.length,
                    totalPages: response.data.totalPages || Math.ceil(response.data.result.length / size)
                };
            }

            throw new Error('Invalid response format from server');
        } catch (error) {
            console.error('Error fetching vaccines:', error.response?.data || error);
            throw error;
        }
    },

    // Get vaccine details by ID
    getVaccineById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching vaccine details:', error.response?.data || error);
            throw error;
        }
    },

    // Search vaccines
    searchVaccines: async (query, page = 0, size = 10) => {
        try {
            const response = await axios.get(`${API_URL}/search`, {
                params: {
                    query,
                    page,
                    size
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching vaccines:', error);
            throw error;
        }
    }
};

export default vaccineListService; 