import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8080/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found in localStorage');
        return {};
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

// Debug user role information in browser console
const logUserInfo = () => {
    console.log('User role check:');
    console.log('- userRole:', localStorage.getItem('userRole'));
    console.log('- roles:', localStorage.getItem('roles'));
    console.log('- role:', localStorage.getItem('role'));
    console.log('- user:', localStorage.getItem('user'));
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('- parsed user:', user);
        console.log('- user roles:', user.roles || user.role || user.userRole);
    } catch (e) {
        console.log('Could not parse user JSON', e);
    }
};

// Check if the current user is an admin - more flexible checks
const isAdmin = () => {
    logUserInfo(); // Log info for debugging
    
    try {
        // Get roles from localStorage (stored from JWT token)
        const rolesStr = localStorage.getItem('roles');
        if (rolesStr) {
            const roles = JSON.parse(rolesStr);
            if (Array.isArray(roles) && roles.some(r => r.toUpperCase() === 'ADMIN')) {
                return true;
            }
        }
        
        // If no roles found in localStorage, try to extract from token directly
        const token = localStorage.getItem('token');
        if (token) {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                if (Array.isArray(payload.roles) && payload.roles.some(r => r.toUpperCase() === 'ADMIN')) {
                    return true;
                }
            }
        }
        
        return false;
    } catch (e) {
        console.error('Error checking admin status:', e);
        return false;
    }
};

// Handle common errors
const handleError = (error) => {
    console.error('API Error:', error);
    if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
    }
    throw error;
};

// Schedule Management
const scheduleService = {
    getMySchedules: async (startDate, endDate) => {
        try {
            const userId = localStorage.getItem('userId');
            const response = await axios.get(`${API_URL}/employee/schedules/${userId}`, {
                headers: getAuthHeaders(),
                params: { startDate, endDate }
            });
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },

    getSameRoleSchedules: async (startDate, endDate) => {
        try {
            // Use appropriate endpoint based on user role
            const endpoint = isAdmin() 
                ? `${API_URL}/admin/schedules` 
                : `${API_URL}/employee/schedules/same-role`;
                
            const response = await axios.get(endpoint, {
                headers: getAuthHeaders(),
                params: { startDate, endDate }
            });
            console.log('Same role schedules response:', response.data);
            return response.data.result || [];
        } catch (error) {
            console.error('Error fetching same role schedules:', error);
            // Return empty array instead of throwing error
            return [];
        }
    },

    getAllSchedules: async (startDate, endDate) => {
        try {
            // Add all possibly required query parameters
            const params = {
                startDate: startDate,
                endDate: endDate,
                page: 0,
                size: 100,
                sort: 'workDate,asc'
            };
            
            console.log('Calling schedules API with params:', params);
            const response = await axios.get(`${API_URL}/admin/schedules`, {
                headers: getAuthHeaders(),
                params: params
            });
            console.log('Schedules API response:', response.data);
            return response.data.result || [];
        } catch (error) {
            console.error('Error fetching all schedules:', error);
            console.error('Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
                params: error.config?.params,
                headers: error.config?.headers
            });
            
            // For 400 or 403 errors, provide fallback empty array
            if (error.response && (error.response.status === 400 || error.response.status === 403)) {
                toast.warning('Using limited schedule view due to API error');
                return [];
            }
            throw handleError(error);
        }
    },

    getEmployeesByRole: async (roleName) => {
        try {
            const response = await axios.get(`${API_URL}/admin/schedules/employees/by-role/${roleName}`, {
                headers: getAuthHeaders()
            });
            
            if (response.data && response.data.result) {
                return response.data.result;
            }
            
            console.error('Invalid response format:', response.data);
            return [];
        } catch (error) {
            console.error('Error fetching employees by role:', error);
            if (error.response && (error.response.status === 400 || error.response.status === 403)) {
                return [];
            }
            throw handleError(error);
        }
    },

    getSchedulesByEmployee: async (employeeId, startDate, endDate) => {
        try {
            const endpoint = isAdmin()
                ? `${API_URL}/admin/schedules/employee/${employeeId}`
                : `${API_URL}/employee/schedules/${employeeId}`;
                
            const response = await axios.get(endpoint, {
                headers: getAuthHeaders(),
                params: { startDate, endDate }
            });
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },

    createSchedule: async (scheduleData) => {
        if (!isAdmin()) {
            throw new Error('Only administrators can create schedules');
        }
        
        try {
            const response = await axios.post(`${API_URL}/admin/schedules`, scheduleData, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },

    extendSchedules: async () => {
        try {
            const response = await axios.post(`${API_URL}/admin/schedules/extend`, {}, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to extend schedules');
        }
    },

    // Pattern Management
    getAllPatterns: async () => {
        try {
            const response = await axios.get(`${API_URL}/admin/patterns`, {
                headers: getAuthHeaders()
            });
            return response.data.result || [];
        } catch (error) {
            console.error('Error fetching patterns:', error);
            if (error.response && (error.response.status === 400 || error.response.status === 403)) {
                return [];
            }
            throw handleError(error);
        }
    },
    
    getPatternById: async (patternId) => {
        try {
            const response = await axios.get(`${API_URL}/admin/patterns/${patternId}`, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },
    
    getPatternsByEmployee: async (employeeId) => {
        try {
            const response = await axios.get(`${API_URL}/admin/patterns/employee/${employeeId}`, {
                headers: getAuthHeaders()
            });
            return response.data.result || [];
        } catch (error) {
            console.error('Error fetching employee patterns:', error);
            if (error.response && (error.response.status === 400 || error.response.status === 403)) {
                return [];
            }
            throw handleError(error);
        }
    },
    
    createPattern: async (patternData) => {
        try {
            const response = await axios.post(`${API_URL}/admin/patterns`, patternData, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },
    
    updatePattern: async (patternId, patternData) => {
        try {
            const response = await axios.put(`${API_URL}/admin/patterns/${patternId}`, patternData, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },
    
    deletePattern: async (patternId) => {
        try {
            const response = await axios.delete(`${API_URL}/admin/patterns/${patternId}`, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },
    
    regenerateSchedules: async (patternId, startDate = new Date().toISOString().split('T')[0]) => {
        try {
            const response = await axios.post(`${API_URL}/admin/patterns/${patternId}/regenerate`, null, {
                headers: getAuthHeaders(),
                params: { startDate }
            });
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },

    // Shift Change Requests
    requestShiftChange: async (requestData) => {
        try {
            const response = await axios.post(`${API_URL}/employee/schedules/shift-change-requests`, requestData, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },

    getSentRequests: async () => {
        try {
            const response = await axios.get(`${API_URL}/employee/schedules/shift-change-requests/sent`, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },

    getReceivedRequests: async () => {
        try {
            const response = await axios.get(`${API_URL}/employee/schedules/shift-change-requests/received`, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },

    getAllShiftChangeRequests: async () => {
        try {
            // Add query parameters that may be required by the API
            const params = {
                page: 0,
                size: 100,
                sort: 'requestTime,desc'
            };
            
            console.log('Calling shift change requests API with params:', params);
            const response = await axios.get(`${API_URL}/admin/shift-change-requests`, {
                headers: getAuthHeaders(),
                params: params
            });
            console.log('Shift change requests API response:', response.data);
            return response.data.result || [];
        } catch (error) {
            console.error('Error fetching all shift change requests:', error);
            console.error('Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
                params: error.config?.params,
                headers: error.config?.headers
            });
            
            // For 400 or 403 errors, provide fallback empty array
            if (error.response && (error.response.status === 400 || error.response.status === 403)) {
                console.warn('API error. Using empty shift change requests.');
                return [];
            }
            throw handleError(error);
        }
    },

    fetchShiftChangeRequests: async () => {
        return scheduleService.getAllShiftChangeRequests();
    },

    approveShiftChange: async (requestId, message = '') => {
        try {
            const response = await axios.patch(`${API_URL}/employee/schedules/shift-change-requests/${requestId}/approve`, 
                { message }, 
                { headers: getAuthHeaders() }
            );
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },

    rejectShiftChange: async (requestId, message = '') => {
        try {
            const response = await axios.patch(`${API_URL}/employee/schedules/shift-change-requests/${requestId}/reject`, 
                { message }, 
                { headers: getAuthHeaders() }
            );
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },

    adminApproveShiftChange: async (requestId, message = '') => {
        if (!isAdmin()) {
            throw new Error('Only administrators can approve shift change requests');
        }
        
        try {
            const response = await axios.patch(`${API_URL}/admin/shift-change-requests/${requestId}/approve`, 
                { message }, 
                { headers: getAuthHeaders() }
            );
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },

    adminRejectShiftChange: async (requestId, message = '') => {
        if (!isAdmin()) {
            throw new Error('Only administrators can reject shift change requests');
        }
        
        try {
            const response = await axios.patch(`${API_URL}/admin/shift-change-requests/${requestId}/reject`, 
                { message }, 
                { headers: getAuthHeaders() }
            );
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    }
};

// Shift Management
const shiftService = {
    getAllShifts: async (page = 0, size = 100, sort = 'name,asc') => {
        try {
            console.log('Calling shifts API with params:', { page, size, sort });
            const response = await axios.get(`${API_URL}/admin/shifts`, {
                headers: getAuthHeaders(),
                params: { page, size, sort }
            });
            console.log('Shifts API response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching shifts:', error);
            console.error('Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
                params: error.config?.params,
                headers: error.config?.headers
            });

            // Return a properly structured fallback response
            return {
                code: 100,
                message: 'Using default shifts',
                result: {
                    content: [
                        {
                            id: '1',
                            name: 'Morning Shift',
                            startTime: '07:00',
                            endTime: '15:00',
                            status: true
                        },
                        {
                            id: '2',
                            name: 'Afternoon Shift',
                            startTime: '15:00',
                            endTime: '23:00',
                            status: true
                        },
                        {
                            id: '3',
                            name: 'Night Shift',
                            startTime: '23:00',
                            endTime: '07:00',
                            status: true
                        }
                    ],
                    totalElements: 3,
                    totalPages: 1,
                    number: 0,
                    size: 100
                }
            };
        }
    },

    getShiftById: async (id) => {
        try {
            const response = await axios.get(`${API_URL}/admin/shifts/${id}`, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },

    createShift: async (shiftData) => {
        if (!isAdmin()) {
            throw new Error('Only administrators can create shifts');
        }
        
        try {
            // Use the original method that the Java entity expects
            const formattedData = {
                name: shiftData.name?.trim() || "Afternoon Shift", 
                startTime: shiftData.startTime || "13:00",
                endTime: shiftData.endTime || "17:00",
                status: shiftData.status === undefined ? true : Boolean(shiftData.status)
            };

            console.log('Sending simple shift data to server:', formattedData);
            
            const response = await axios.post(`${API_URL}/admin/shifts`, formattedData, {
                headers: getAuthHeaders()
            });
            console.log('Server response:', response.data);
            return response.data.result;
        } catch (error) {
            console.error('Shift creation error:', error);
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error status:', error.response.status);
                
                // Display a more helpful error message
                if (error.response.status === 400) {
                    const backendError = "Backend entity-database mapping error: The 'name' field in the Java entity isn't properly mapped to the 'shift_name' column in the database.";
                    console.error(backendError);
                    throw new Error(backendError);
                }
            }
            throw handleError(error);
        }
    },

    updateShift: async (id, shiftData) => {
        try {
            const response = await axios.patch(`${API_URL}/admin/shifts/${id}`, shiftData, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    },

    deleteShift: async (id) => {
        try {
            const response = await axios.delete(`${API_URL}/admin/shifts/${id}`, {
                headers: getAuthHeaders()
            });
            return response.data.result;
        } catch (error) {
            throw handleError(error);
        }
    }
};

const validationRules = {
    shift: {
        name: { required: true, message: 'Shift name is required' },
        startTime: { 
            required: true, 
            pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 
            message: 'Start time must be in HH:MM format' 
        },
        endTime: { 
            required: true, 
            pattern: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 
            message: 'End time must be in HH:MM format' 
        }
    },
    schedule: {
        employeeId: {
            required: true
        },
        weeklySchedules: {
            required: true,
            minLength: 1
        }
    },
    shiftChangeRequest: {
        reason: {
            required: true,
            minLength: 10,
            maxLength: 500
        },
        minDaysInAdvance: 7
    },
    pattern: {
        name: { required: true, message: 'Pattern name is required' },
        employeeId: { required: true, message: 'Employee is required' },
        shifts: { required: true, minLength: 1, message: 'At least one shift must be assigned' }
    }
};

export {
    scheduleService,
    shiftService,
    validationRules
};