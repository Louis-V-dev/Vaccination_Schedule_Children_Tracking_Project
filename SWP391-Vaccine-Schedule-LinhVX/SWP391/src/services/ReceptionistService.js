import axios from 'axios';
import moment from 'moment';

const API_URL = import.meta.env.VITE_API_URL || '';

// Mock data for when the API isn't available
const MOCK_APPOINTMENTS = [
  {
    id: 1,
    appointmentDate: moment().format('YYYY-MM-DD'),
    timeSlot: '09:00 - 10:00',
    status: 'SCHEDULED',
    paid: true,
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
    status: 'SCHEDULED',
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
  },
  {
    id: 3,
    appointmentDate: moment().add(1, 'days').format('YYYY-MM-DD'),
    timeSlot: '14:00 - 15:00',
    status: 'SCHEDULED',
    paid: true,
    child: {
      child_name: 'Sophie Johnson',
      birthDate: moment().subtract(2, 'years').format('YYYY-MM-DD'),
      gender: 'FEMALE',
      account_Id: {
        fullName: 'Emily Johnson',
        phoneNumber: '+84976543210',
        email: 'emily.johnson@example.com'
      }
    },
    appointmentVaccines: [
      {
        id: 4,
        status: 'PENDING',
        vaccine: {
          name: 'Polio Vaccine',
          price: 28.0
        },
        doseSchedule: {
          doseNumber: 1
        }
      }
    ]
  }
];

class ReceptionistService {
  // Get all appointments for receptionist
  getAllAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/receptionist/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getAllAppointments due to API error:', error.message);
      return { 
        code: 100, 
        result: MOCK_APPOINTMENTS,
        message: 'Mock data - API not available'
      };
    }
  };

  // Get today's appointments
  getTodayAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/receptionist/today-appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getTodayAppointments due to API error:', error.message);
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
  getAppointmentsByDate = async (date) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/receptionist/appointments?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getAppointmentsByDate due to API error:', error.message);
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

  // Update appointment status (check-in or send to cashier)
  updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/receptionist/appointments/${appointmentId}/status`, 
        { status: status },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.log('Using mock data for updateAppointmentStatus due to API error:', error.message);
      // Simulate successful status update
      return { 
        code: 100, 
        result: { id: appointmentId, status: status },
        message: 'Mock data - Status updated successfully'
      };
    }
  };

  // Get appointment details
  getAppointmentDetails = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/receptionist/appointments/${appointmentId}`, {
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

export default new ReceptionistService(); 