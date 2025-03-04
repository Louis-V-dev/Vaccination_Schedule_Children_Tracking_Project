import axios from 'axios';

const API_URL = 'http://localhost:8080/api/users';

// Mock data for development
const MOCK_ACCOUNTS = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    fullName: 'Admin User',
    role: 'ADMIN',
    status: 'ACTIVE'
  },
  {
    id: 2,
    username: 'doctor1',
    email: 'doctor@example.com',
    fullName: 'Doctor User',
    role: 'DOCTOR',
    status: 'ACTIVE'
  },
  {
    id: 3,
    username: 'user1',
    email: 'user@example.com',
    fullName: 'Regular User',
    role: 'USER',
    status: 'ACTIVE'
  },
  {
    id: 4,
    username: 'inactive',
    email: 'inactive@example.com',
    fullName: 'Inactive User',
    role: 'USER',
    status: 'INACTIVE'
  }
];

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found in localStorage');
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`
  };
};

const accountService = {
  // Get all accounts
  getAllAccounts: async () => {
    try {
      const headers = getAuthHeaders();
      console.log('Fetching accounts with headers:', headers);
      
      const response = await axios.get(API_URL, { 
        headers: {
          ...headers,
          'Accept': 'application/json'
        }
      });

      // Check if we have a valid response with data
      if (response.data && response.data.result) {
        return response.data.result.map(account => ({
          id: account.accountId,
          username: account.username,
          email: account.email,
          fullName: `${account.firstName || ''} ${account.lastName || ''}`.trim(),
          role: Array.isArray(account.roles) && account.roles.length > 0 ? account.roles[0] : 'USER',
          status: account.status ? 'ACTIVE' : 'INACTIVE'
        }));
      }
      
      // If we get here, we have a response but no data
      console.error('Invalid response format:', response.data);
      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('Error fetching accounts:', error.response?.data || error);
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to view accounts');
      } else if (error.response?.status === 401) {
        throw new Error('Please log in to view accounts');
      }
      
      // For other errors, return mock data
      console.warn('Using mock data as fallback');
      return MOCK_ACCOUNTS;
    }
  },

  // Get account by ID
  getAccountById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching account:', error.response?.data || error);
      // Return mock account if available
      const mockAccount = MOCK_ACCOUNTS.find(acc => acc.id === parseInt(id));
      return mockAccount || null;
    }
  },

  // Create new account
  createAccount: async (accountData) => {
    try {
      // Transform frontend data to backend format
      const backendData = {
        username: accountData.username,
        password: accountData.password,
        firstName: accountData.fullName.split(' ').slice(0, -1).join(' '),
        lastName: accountData.fullName.split(' ').slice(-1)[0],
        email: accountData.email,
        status: accountData.status === 'ACTIVE'
      };

      const response = await axios.post(API_URL, backendData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating account:', error.response?.data || error);
      throw error;
    }
  },

  // Update account
  updateAccount: async (id, accountData) => {
    try {
      // Transform frontend data to backend format
      const backendData = {
        firstName: accountData.fullName.split(' ').slice(0, -1).join(' '),
        lastName: accountData.fullName.split(' ').slice(-1)[0],
        email: accountData.email,
        status: accountData.status === 'ACTIVE'
      };

      if (accountData.password) {
        backendData.password = accountData.password;
      }

      const response = await axios.patch(`${API_URL}/${id}`, backendData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating account:', error.response?.data || error);
      throw error;
    }
  },

  // Delete account
  deleteAccount: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting account:', error.response?.data || error);
      throw error;
    }
  }
};

export default accountService; 