import axios from 'axios';

const API_URL = 'http://localhost:8080/api/payments';
const PAYMENT_METHODS_URL = 'http://localhost:8080/api/payment-methods';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No authentication token found');
        return {
            'Content-Type': 'application/json'
        };
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

class PaymentService {
    // Payment Methods Management
    getPaymentMethods() {
        console.log('Fetching payment methods with headers:', getAuthHeaders());
        return axios.get(PAYMENT_METHODS_URL, {
            headers: getAuthHeaders(),
            withCredentials: true
        }).then(response => {
            console.log('Payment methods response:', response);
            if (response.data && response.data.result) {
                return response.data.result;
            }
            console.warn('Unexpected response format:', response.data);
            return [];
        }).catch(error => {
            console.error('Error fetching payment methods:', error.response?.data || error.message);
            if (error.response?.status === 0 || error.message === 'Network Error') {
                console.error('CORS or network error detected');
                return [];
            }
            throw error;
        });
    }

    getPaymentMethodById(id) {
        return axios.get(`${PAYMENT_METHODS_URL}/${id}`, {
            headers: getAuthHeaders()
        }).then(response => {
            return response.data?.result;
        }).catch(error => {
            console.error('Error fetching payment method:', error.response?.data || error.message);
            throw error;
        });
    }

    createPaymentMethod(methodData) {
        return axios.post(PAYMENT_METHODS_URL, methodData, {
            headers: getAuthHeaders()
        }).then(response => {
            return response.data?.result;
        }).catch(error => {
            console.error('Error creating payment method:', error.response?.data || error.message);
            throw error;
        });
    }

    updatePaymentMethod(id, methodData) {
        return axios.put(`${PAYMENT_METHODS_URL}/${id}`, methodData, {
            headers: getAuthHeaders()
        }).then(response => {
            return response.data?.result;
        }).catch(error => {
            console.error('Error updating payment method:', error.response?.data || error.message);
            throw error;
        });
    }

    deletePaymentMethod(id) {
        return axios.delete(`${PAYMENT_METHODS_URL}/${id}`, {
            headers: getAuthHeaders()
        }).then(response => {
            return response.data?.result;
        }).catch(error => {
            console.error('Error deleting payment method:', error.response?.data || error.message);
            throw error;
        });
    }

    // Payment Management
    getAllPayments(status = null, pageable = { page: 0, size: 10, sort: 'created_at,desc' }) {
        try {
            console.log('Fetching payments with headers:', getAuthHeaders());
            
            // Extract the sort field and direction
            let sortBy = 'created_at';
            let direction = 'desc';
            
            if (typeof pageable.sort === 'string') {
                const parts = pageable.sort.split(',');
                if (parts.length === 2) {
                    sortBy = parts[0];
                    direction = parts[1];
                }
            } else if (Array.isArray(pageable.sort) && pageable.sort.length > 0) {
                const parts = pageable.sort[0].split(',');
                if (parts.length === 2) {
                    sortBy = parts[0];
                    direction = parts[1];
                }
            }
            
            // Use individual parameters for pagination and sorting
            const params = {
                page: pageable.page,
                size: pageable.size,
                sortBy: sortBy,
                direction: direction
            };
            
            if (status) {
                params.status = status.toUpperCase();
            }
            
            console.log('Request params:', params);
            
            return axios.get(API_URL, {
                headers: getAuthHeaders(),
                params: params,
                withCredentials: true
            }).then(response => {
                console.log('Payment response:', response);
                if (response.data?.result) {
                    return response.data.result;
                }
                console.warn('Unexpected response format:', response.data);
                return { content: [] };
            }).catch(error => {
                console.error('Error fetching payments:', error.response?.data || error.message);
                if (error.response?.status === 400) {
                    console.error('Bad request details:', error.response.data);
                    return { content: [] };
                }
                if (error.response?.status === 0 || error.message === 'Network Error' || error.message.includes('CORS')) {
                    console.error('CORS or network error detected');
                    return { content: [] };
                }
                return { content: [] };
            });
        } catch (error) {
            console.error('Error in getAllPayments:', error);
            return { content: [] };
        }
    }

    getPaymentById(id) {
        return axios.get(`${API_URL}/${id}`, {
            headers: getAuthHeaders()
        }).then(response => {
            return response.data?.result;
        }).catch(error => {
            console.error('Error fetching payment:', error.response?.data || error.message);
            throw error;
        });
    }

    updatePaymentStatus(id, status) {
        return axios.put(`${API_URL}/${id}/status`, null, {
            headers: getAuthHeaders(),
            params: { status: status.toUpperCase() }
        }).then(response => {
            return response.data?.result;
        }).catch(error => {
            console.error('Error updating payment status:', error.response?.data || error.message);
            throw error;
        });
    }

    getUserPayments(userId, pageable = { page: 0, size: 10, sort: 'created_at,desc' }) {
        try {
            // Extract the sort field and direction
            let sortBy = 'created_at';
            let direction = 'desc';
            
            if (typeof pageable.sort === 'string') {
                const parts = pageable.sort.split(',');
                if (parts.length === 2) {
                    sortBy = parts[0];
                    direction = parts[1];
                }
            } else if (Array.isArray(pageable.sort) && pageable.sort.length > 0) {
                const parts = pageable.sort[0].split(',');
                if (parts.length === 2) {
                    sortBy = parts[0];
                    direction = parts[1];
                }
            }
            
            const params = {
                page: pageable.page,
                size: pageable.size,
                sortBy: sortBy,
                direction: direction
            };
            
            return axios.get(`${API_URL}/user/${userId}`, {
                headers: getAuthHeaders(),
                params: params,
                withCredentials: true
            }).then(response => {
                if (response.data?.result) {
                    return response.data.result;
                }
                console.warn('Unexpected response format:', response.data);
                return { content: [] };
            }).catch(error => {
                console.error('Error fetching user payments:', error.response?.data || error.message);
                if (error.response?.status === 0 || error.message === 'Network Error' || error.message.includes('CORS')) {
                    console.error('CORS or network error detected');
                }
                return { content: [] };
            });
        } catch (error) {
            console.error('Error in getUserPayments:', error);
            return { content: [] };
        }
    }

    getPaymentStatistics(startDate, endDate) {
        if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
            throw new Error('startDate and endDate must be Date objects');
        }

        return axios.get(`${API_URL}/statistics`, {
            headers: getAuthHeaders(),
            params: { 
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            }
        }).then(response => {
            return response.data?.result;
        }).catch(error => {
            console.error('Error fetching payment statistics:', error.response?.data || error.message);
            throw error;
        });
    }

    getExpiredPayments(pageable = { page: 0, size: 10, sort: 'created_at,desc' }) {
        try {
            // Extract the sort field and direction
            let sortBy = 'created_at';
            let direction = 'desc';
            
            if (typeof pageable.sort === 'string') {
                const parts = pageable.sort.split(',');
                if (parts.length === 2) {
                    sortBy = parts[0];
                    direction = parts[1];
                }
            } else if (Array.isArray(pageable.sort) && pageable.sort.length > 0) {
                const parts = pageable.sort[0].split(',');
                if (parts.length === 2) {
                    sortBy = parts[0];
                    direction = parts[1];
                }
            }
            
            const params = {
                page: pageable.page,
                size: pageable.size,
                sortBy: sortBy,
                direction: direction
            };
            
            return axios.get(`${API_URL}/expired`, {
                headers: getAuthHeaders(),
                params: params,
                withCredentials: true
            }).then(response => {
                if (response.data?.result) {
                    return response.data.result;
                }
                console.warn('Unexpected response format:', response.data);
                return { content: [] };
            }).catch(error => {
                console.error('Error fetching expired payments:', error.response?.data || error.message);
                if (error.response?.status === 0 || error.message === 'Network Error' || error.message.includes('CORS')) {
                    console.error('CORS or network error detected');
                }
                return { content: [] };
            });
        } catch (error) {
            console.error('Error in getExpiredPayments:', error);
            return { content: [] };
        }
    }
}

export default new PaymentService(); 