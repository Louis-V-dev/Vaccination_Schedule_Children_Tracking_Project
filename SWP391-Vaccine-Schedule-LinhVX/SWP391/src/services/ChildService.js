import axios from 'axios';

const API_URL = 'http://localhost:8080/api/children';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No authentication token found');
        return {};
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// Add axios interceptor for better error handling
axios.interceptors.response.use(
    response => response,
    error => {
        const errorMessage = error.response?.data?.message || error.message;
        console.error('API Error:', {
            status: error.response?.status,
            message: errorMessage,
            data: error.response?.data,
            config: error.config
        });
        return Promise.reject(error);
    }
);

class ChildService {
    // Basic CRUD operations
    getAllChildren() {
        console.log('Fetching all children with headers:', getAuthHeaders());
        return axios.get(API_URL, {
            headers: getAuthHeaders()
        }).then(response => {
            console.log('Response from getAllChildren:', response);
            if (response.data && Array.isArray(response.data)) {
                return { data: response.data };
            } else if (response.data && Array.isArray(response.data.result)) {
                return { data: response.data.result };
            }
            console.warn('Unexpected response format:', response.data);
            return { data: [] };
        });
    }

    getChildById(id) {
        return axios.get(`${API_URL}/${id}`, {
            headers: getAuthHeaders()
        });
    }

    createChild(childData) {
        return axios.post(`${API_URL}/create`, childData, {
            headers: getAuthHeaders()
        });
    }

    updateChild(id, childData) {
        return axios.patch(`${API_URL}/${id}`, childData, {
            headers: getAuthHeaders()
        });
    }

    deleteChild(id) {
        return axios.delete(`${API_URL}/${id}`, {
            headers: getAuthHeaders()
        });
    }

    reactivateChild(id) {
        return axios.post(`${API_URL}/${id}/reactivate`, null, {
            headers: getAuthHeaders()
        });
    }

    // Child records
    getChildHealthRecords(id) {
        return axios.get(`${API_URL}/${id}/health-records`, {
            headers: getAuthHeaders()
        });
    }

    getChildVaccineRecords(id) {
        return axios.get(`${API_URL}/${id}/vaccine-records`, {
            headers: getAuthHeaders()
        });
    }

    getChildAppointments(id) {
        return axios.get(`${API_URL}/${id}/appointments`, {
            headers: getAuthHeaders()
        });
    }

    // Guardian specific
    getChildrenForGuardian() {
        return axios.get(`${API_URL}/guardian`, {
            headers: getAuthHeaders()
        }).then(response => {
            if (response.data && Array.isArray(response.data)) {
                return { data: response.data };
            } else if (response.data && Array.isArray(response.data.result)) {
                return { data: response.data.result };
            }
            console.warn('Unexpected response format:', response.data);
            return { data: [] };
        });
    }

    getChildrenForGuardianPaged(page = 0, size = 10, sortBy = 'child_name', direction = 'asc') {
        return axios.get(`${API_URL}/guardian/paged`, {
            headers: getAuthHeaders(),
            params: { page, size, sortBy, direction }
        });
    }

    // Search operations
    searchChildren(params) {
        return axios.get(`${API_URL}/search`, {
            headers: getAuthHeaders(),
            params
        });
    }

    searchByName(name) {
        return axios.get(`${API_URL}/search/name`, {
            headers: getAuthHeaders(),
            params: { name }
        });
    }

    searchByBloodType(bloodType) {
        return axios.get(`${API_URL}/search/blood-type`, {
            headers: getAuthHeaders(),
            params: { bloodType }
        });
    }

    searchByAllergies(allergies) {
        return axios.get(`${API_URL}/search/allergies`, {
            headers: getAuthHeaders(),
            params: { allergies }
        });
    }

    searchByMedicalCondition(condition) {
        return axios.get(`${API_URL}/search/medical-condition`, {
            headers: getAuthHeaders(),
            params: { condition }
        });
    }

    searchByAgeRange(fromDate, toDate) {
        return axios.get(`${API_URL}/search/age-range`, {
            headers: getAuthHeaders(),
            params: {
                fromDate: fromDate ? fromDate.toISOString().split('T')[0] : null,
                toDate: toDate ? toDate.toISOString().split('T')[0] : null
            }
        });
    }
}

export default new ChildService(); 