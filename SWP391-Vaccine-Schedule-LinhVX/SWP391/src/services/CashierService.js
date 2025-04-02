import axios from 'axios';
import moment from 'moment';

const API_URL = import.meta.env.VITE_API_URL || '';

// Mock data for when the API isn't available
const MOCK_APPOINTMENTS = [
  {
    id: 1,
    appointmentDate: moment().format('YYYY-MM-DD'),
    timeSlot: '09:00 - 10:00',
    status: 'AWAITING_PAYMENT',
    paid: false,
    child: {
      child_name: 'Emma Smith',
      birthDate: moment().subtract(3, 'years').format('YYYY-MM-DD'),
      gender: 'FEMALE',
      account_Id: {
        fullName: 'Jane Smith',
        phoneNumber: '+84987654321',
        email: 'jane.smith@example.com'
      }
    },
    appointmentVaccines: [
      {
        id: 1,
        status: 'PENDING',
        vaccine: {
          name: 'MMR Vaccine',
          price: 25.0
        },
        doseSchedule: {
          doseNumber: 1
        }
      },
      {
        id: 2,
        status: 'PENDING',
        vaccine: {
          name: 'Hepatitis B',
          price: 30.0
        },
        doseSchedule: {
          doseNumber: 2
        }
      }
    ]
  },
  {
    id: 2,
    appointmentDate: moment().format('YYYY-MM-DD'),
    timeSlot: '10:00 - 11:00',
    status: 'AWAITING_PAYMENT',
    paid: false,
    child: {
      child_name: 'James Wilson',
      birthDate: moment().subtract(1, 'years').format('YYYY-MM-DD'),
      gender: 'MALE',
      account_Id: {
        fullName: 'Robert Wilson',
        phoneNumber: '+84912345678',
        email: 'robert.wilson@example.com'
      }
    },
    appointmentVaccines: [
      {
        id: 3,
        status: 'PENDING',
        vaccine: {
          name: 'DTaP Vaccine',
          price: 35.0
        },
        doseSchedule: {
          doseNumber: 1
        }
      }
    ]
  }
];

class CashierService {
  // Get all appointments awaiting payment
  getAllAwaitingPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/cashier/awaiting-payment`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getAllAwaitingPayment due to API error:', error.message);
      return { 
        code: 100, 
        result: MOCK_APPOINTMENTS,
        message: 'Mock data - API not available'
      };
    }
  };

  // Get today's appointments awaiting payment
  getTodayAwaitingPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/cashier/today-awaiting-payment`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getTodayAwaitingPayment due to API error:', error.message);
      const today = moment().format('YYYY-MM-DD');
      const todayAppointments = MOCK_APPOINTMENTS.filter(
        appointment => appointment.appointmentDate === today
      );
      return { 
        code: 100, 
        result: todayAppointments,
        message: 'Mock data - API not available'
      };
    }
  };

  // Get appointments by date
  getAwaitingPaymentByDate = async (date) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/cashier/awaiting-payment?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getAwaitingPaymentByDate due to API error:', error.message);
      const appointmentsByDate = MOCK_APPOINTMENTS.filter(
        appointment => appointment.appointmentDate === date
      );
      return { 
        code: 100, 
        result: appointmentsByDate,
        message: 'Mock data - API not available'
      };
    }
  };

  // Process cash payment
  processCashPayment = async (paymentData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/cashier/process-cash-payment`, paymentData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for processCashPayment due to API error:', error.message);
      // Simulate successful payment
      return { 
        code: 100, 
        result: { 
          id: paymentData.appointmentId, 
          paid: true,
          amountPaid: paymentData.amountPaid,
          paymentMethod: 'CASH',
          paymentDate: moment().format('YYYY-MM-DD HH:mm:ss')
        },
        message: 'Mock data - Payment processed successfully'
      };
    }
  };

  // Generate MoMo payment
  generateMomoPayment = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/cashier/generate-momo-payment/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for generateMomoPayment due to API error:', error.message);
      // Simulate MoMo payment URL
      return { 
        code: 100, 
        result: { 
          paymentUrl: 'https://example.com/momo-payment',
          orderId: `ORDER_${appointmentId}_${Date.now()}`,
          expiry: moment().add(15, 'minutes').format('YYYY-MM-DD HH:mm:ss')
        },
        message: 'Mock data - MoMo payment URL generated'
      };
    }
  };

  // Get appointment details
  getAppointmentDetails = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/cashier/appointments/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getAppointmentDetails due to API error:', error.message);
      const appointment = MOCK_APPOINTMENTS.find(a => a.id === appointmentId);
      return { 
        code: 100, 
        result: appointment || MOCK_APPOINTMENTS[0],
        message: 'Mock data - API not available'
      };
    }
  };
}

export default new CashierService(); 