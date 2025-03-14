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
            // Create a clean copy of the data
            const formattedData = { ...comboData };
            
            // Ensure categories and vaccineIds are arrays of numbers
            if (Array.isArray(formattedData.categories)) {
                formattedData.categories = formattedData.categories.map(id => 
                    typeof id === 'object' ? Number(id.categoryId || id.id || 0) : Number(id)
                );
            } else {
                formattedData.categories = [];
            }
            
            if (Array.isArray(formattedData.vaccineIds)) {
                formattedData.vaccineIds = formattedData.vaccineIds.map(id => 
                    typeof id === 'object' ? Number(id.vaccineId || id.id || 0) : Number(id)
                );
            } else {
                formattedData.vaccineIds = [];
            }
            
            // Make sure vaccineDoses is properly formatted
            if (formattedData.vaccineDoses && typeof formattedData.vaccineDoses === 'object') {
                // Convert any string keys to numbers if needed
                const cleanDoses = {};
                Object.keys(formattedData.vaccineDoses).forEach(key => {
                    const numericKey = Number(key);
                    if (!isNaN(numericKey)) {
                        // Ensure doses are numbers and at least 1
                        cleanDoses[numericKey] = Math.max(1, Number(formattedData.vaccineDoses[key]) || 1);
                    }
                });
                formattedData.vaccineDoses = cleanDoses;
            } else {
                formattedData.vaccineDoses = {};
            }
            
            // Remove any backup fields that might confuse the backend
            delete formattedData.categoryIds;
            delete formattedData.vaccineIdString;
            
            console.log('Creating combo with formatted data:', JSON.stringify(formattedData, null, 2));
            
            const response = await axios.post(API_URL, formattedData, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });
            console.log('Create combo response:', response.data);
            return response.data.result;
        } catch (error) {
            console.error('Error creating vaccine combo:');
            console.error('Status:', error.response?.status);
            console.error('Response data:', error.response?.data);
            console.error('Request data:', JSON.stringify(comboData, null, 2));
            throw error;
        }
    },

    updateCombo: async (id, comboData) => {
        try {
            // Create a clean copy of the data
            const formattedData = { ...comboData };
            
            // Ensure categories and vaccineIds are arrays of numbers
            if (Array.isArray(formattedData.categories)) {
                formattedData.categories = formattedData.categories.map(id => 
                    typeof id === 'object' ? Number(id.categoryId || id.id || 0) : Number(id)
                );
            } else {
                formattedData.categories = [];
            }
            
            if (Array.isArray(formattedData.vaccineIds)) {
                formattedData.vaccineIds = formattedData.vaccineIds.map(id => 
                    typeof id === 'object' ? Number(id.vaccineId || id.id || 0) : Number(id)
                );
            } else {
                formattedData.vaccineIds = [];
            }
            
            // Make sure vaccineDoses is properly formatted
            if (formattedData.vaccineDoses && typeof formattedData.vaccineDoses === 'object') {
                // Convert any string keys to numbers if needed
                const cleanDoses = {};
                Object.keys(formattedData.vaccineDoses).forEach(key => {
                    const numericKey = Number(key);
                    if (!isNaN(numericKey)) {
                        // Ensure doses are numbers and at least 1
                        cleanDoses[numericKey] = Math.max(1, Number(formattedData.vaccineDoses[key]) || 1);
                    }
                });
                formattedData.vaccineDoses = cleanDoses;
            } else {
                formattedData.vaccineDoses = {};
            }
            
            // Remove any backup fields that might confuse the backend
            delete formattedData.categoryIds;
            delete formattedData.vaccineIdString;
            
            console.log('Updating combo with formatted data:', JSON.stringify(formattedData, null, 2));
            
            const response = await axios.put(`${API_URL}/${id}`, formattedData, {
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json'
                }
            });
            console.log('Update combo response:', response.data);
            return response.data.result;
        } catch (error) {
            console.error('Error updating vaccine combo:');
            console.error('Status:', error.response?.status);
            console.error('Response data:', error.response?.data);
            console.error('Request data:', JSON.stringify(comboData, null, 2));
            throw error;
        }
    },

    deleteCombo: async (id) => {
        try {
            const response = await axios.delete(`${API_URL}/${id}`, {
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting vaccine combo:', error.response?.data || error);
            throw error;
        }
    }
};

export default vaccineComboService; 