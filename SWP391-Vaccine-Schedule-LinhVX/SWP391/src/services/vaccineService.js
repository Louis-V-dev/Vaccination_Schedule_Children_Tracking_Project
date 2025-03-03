import axios from 'axios';

const API_URL = 'http://localhost:8080/api/vaccines';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    return { Authorization: `Bearer ${token}` };
};

const vaccineService = {
    async addVaccine(vaccineData) {
        const formData = new FormData();
        
        // Add all text fields
        Object.keys(vaccineData).forEach(key => {
            if (key !== 'imagineUrl') {
                // Handle dates specially
                if (key === 'expirationDate' || key === 'productionDate') {
                    if (vaccineData[key]) {
                        formData.append(key, vaccineData[key]);
                    }
                } else {
                    formData.append(key, vaccineData[key]);
                }
            }
        });

        // Add image file if it exists
        if (vaccineData.imagineUrl instanceof File) {
            formData.append('imagineUrl', vaccineData.imagineUrl);
            console.log('Appending image file:', vaccineData.imagineUrl.name);
        }

        // Log the FormData contents for debugging
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
        }

        const headers = getAuthHeader();
        console.log('Headers for request:', headers);
        
        const response = await axios.post(API_URL, formData, { 
            headers,
            transformRequest: [(data) => data]
        });
        return response.data;
    },

    async updateVaccine(id, vaccineData) {
        const formData = new FormData();
        
        // Add all text fields
        Object.keys(vaccineData).forEach(key => {
            if (key !== 'imagineUrl') {
                // Handle dates specially
                if (key === 'expirationDate' || key === 'productionDate') {
                    if (vaccineData[key]) {
                        formData.append(key, vaccineData[key]);
                    }
                } else {
                    formData.append(key, vaccineData[key]);
                }
            }
        });

        // Add image file if it exists
        if (vaccineData.imagineUrl instanceof File) {
            formData.append('imagineUrl', vaccineData.imagineUrl);
            console.log('Appending image file for update:', vaccineData.imagineUrl.name);
        }

        // Log the FormData contents for debugging
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
        }

        const headers = getAuthHeader();
        console.log('Headers for update request:', headers);
        
        const response = await axios.put(`${API_URL}/${id}`, formData, { 
            headers,
            transformRequest: [(data) => data]
        });
        return response.data;
    },

    async getAllVaccines() {
        console.log('Fetching vaccines with headers:', getAuthHeader());
        const response = await axios.get(API_URL, {
            headers: getAuthHeader()
        });
        return response.data;
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