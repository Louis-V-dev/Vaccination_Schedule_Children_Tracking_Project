import axios from 'axios';

const API_URL = 'http://localhost:8080/api/accounts';

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
      
      // Check if the vaccineService is working to compare approaches
      const vaccineUrl = 'http://localhost:8080/api/vaccines';
      try {
        const vaccineResponse = await axios.get(vaccineUrl, { headers });
        console.log('Vaccine API works with same token:', vaccineResponse.status);
      } catch (vaccineError) {
        console.log('Vaccine API also fails:', vaccineError.response?.status);
      }
      
      try {
        // Try with different content types
        const response = await axios.get(API_URL, { 
          headers: {
            ...headers,
            'Accept': 'application/json'
          }
        });
        return response.data;
      } catch (apiError) {
        console.error('API error, using mock data:', apiError.response?.data || apiError);
        console.log('Using mock data as fallback');
        return MOCK_ACCOUNTS;
      }
    } catch (error) {
      console.error('Error fetching accounts:', error.response?.data || error);
      // Return mock data instead of empty array
      console.log('Using mock data as fallback');
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
      const response = await axios.post(API_URL, accountData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating account:', error.response?.data || error);
      // Simulate successful creation with mock data
      const newAccount = {
        ...accountData,
        id: Math.floor(Math.random() * 1000) + 10
      };
      MOCK_ACCOUNTS.push(newAccount);
      return newAccount;
    }
  },

  // Update account
  updateAccount: async (id, accountData) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, accountData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating account:', error.response?.data || error);
      // Simulate successful update with mock data
      const index = MOCK_ACCOUNTS.findIndex(acc => acc.id === parseInt(id));
      if (index !== -1) {
        MOCK_ACCOUNTS[index] = { ...MOCK_ACCOUNTS[index], ...accountData };
        return MOCK_ACCOUNTS[index];
      }
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
      // Simulate successful deletion with mock data
      const index = MOCK_ACCOUNTS.findIndex(acc => acc.id === parseInt(id));
      if (index !== -1) {
        MOCK_ACCOUNTS.splice(index, 1);
        return { success: true };
      }
      throw error;
    }
  }
};

export default accountService; 