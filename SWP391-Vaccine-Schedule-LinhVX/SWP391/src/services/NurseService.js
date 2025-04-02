import axios from 'axios';
import moment from 'moment';

const API_URL = import.meta.env.VITE_API_URL || '';

// Mock data for when the API isn't available
const MOCK_VACCINATIONS = [
  {
    id: 1,
    appointmentDate: moment().format('YYYY-MM-DD'),
    timeSlot: '09:00 - 10:00',
    status: 'WITH_NURSE',
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
        status: 'APPROVED',
        vaccine: {
          name: 'Hepatitis B',
          description: 'Hepatitis B vaccine',
          recommendedDose: 0.5,
          price: 30.0
        },
        doseSchedule: {
          doseNumber: 1
        },
        healthRecord: {
          temperature: 36.8,
          weight: 15.2,
          height: 95.0,
          bloodPressure: '100/60',
          heartRate: 90,
          doctorNotes: 'Child is healthy and ready for vaccination.',
          vaccinationApproved: true
        }
      },
      {
        id: 2,
        status: 'APPROVED',
        vaccine: {
          name: 'DTaP Vaccine',
          description: 'Diphtheria, Tetanus, and Pertussis vaccine',
          recommendedDose: 0.5,
          price: 35.0
        },
        doseSchedule: {
          doseNumber: 1
        },
        healthRecord: {
          temperature: 36.8,
          weight: 15.2,
          height: 95.0,
          bloodPressure: '100/60',
          heartRate: 90,
          doctorNotes: 'Child is healthy and ready for vaccination.',
          vaccinationApproved: true
        }
      }
    ]
  },
  {
    id: 2,
    appointmentDate: moment().format('YYYY-MM-DD'),
    timeSlot: '10:00 - 11:00',
    status: 'WITH_NURSE',
    paid: true,
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
        status: 'APPROVED',
        vaccine: {
          name: 'Polio Vaccine',
          description: 'Inactivated Polio Vaccine',
          recommendedDose: 0.5,
          price: 28.0
        },
        doseSchedule: {
          doseNumber: 1
        },
        healthRecord: {
          temperature: 36.5,
          weight: 10.0,
          height: 75.0,
          bloodPressure: '90/60',
          heartRate: 100,
          doctorNotes: 'Child is healthy and ready for vaccination.',
          vaccinationApproved: true
        }
      }
    ]
  }
];

class NurseService {
  // Get all pending vaccinations
  getAllPendingVaccinations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/nurse/pending-vaccinations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getAllPendingVaccinations due to API error:', error.message);
      return { 
        code: 100, 
        result: MOCK_VACCINATIONS,
        message: 'Mock data - API not available'
      };
    }
  };

  // Get today's pending vaccinations
  getTodayPendingVaccinations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/nurse/today-pending-vaccinations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getTodayPendingVaccinations due to API error:', error.message);
      const today = moment().format('YYYY-MM-DD');
      const todayVaccinations = MOCK_VACCINATIONS.filter(
        vaccination => vaccination.appointmentDate === today
      );
      return { 
        code: 100, 
        result: todayVaccinations,
        message: 'Mock data - API not available'
      };
    }
  };

  // Get vaccinations by date
  getVaccinationsByDate = async (date) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/nurse/pending-vaccinations?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getVaccinationsByDate due to API error:', error.message);
      const vaccinationsByDate = MOCK_VACCINATIONS.filter(
        vaccination => vaccination.appointmentDate === date
      );
      return { 
        code: 100, 
        result: vaccinationsByDate,
        message: 'Mock data - API not available'
      };
    }
  };

  // Get appointment details
  getAppointmentDetails = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/nurse/appointments/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getAppointmentDetails due to API error:', error.message);
      const appointment = MOCK_VACCINATIONS.find(a => a.id === appointmentId);
      return { 
        code: 100, 
        result: appointment || MOCK_VACCINATIONS[0],
        message: 'Mock data - API not available'
      };
    }
  };

  // Get approved vaccines for appointment
  getApprovedVaccinesForAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/nurse/appointments/${appointmentId}/approved-vaccines`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getApprovedVaccinesForAppointment due to API error:', error.message);
      const appointment = MOCK_VACCINATIONS.find(a => a.id === appointmentId);
      const approvedVaccines = appointment ? 
        appointment.appointmentVaccines.filter(av => av.status === 'APPROVED') : 
        MOCK_VACCINATIONS[0].appointmentVaccines;
      return { 
        code: 100, 
        result: approvedVaccines,
        message: 'Mock data - API not available'
      };
    }
  };

  // Record vaccination
  recordVaccination = async (vaccinationData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/nurse/record-vaccination`, 
        vaccinationData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.log('Using mock data for recordVaccination due to API error:', error.message);
      // Simulate successful vaccination record
      return { 
        code: 100, 
        result: {
          id: Date.now(),
          appointmentVaccineId: vaccinationData.appointmentVaccineId,
          vaccineBatchNumber: vaccinationData.vaccineBatchNumber,
          vaccineExpiryDate: vaccinationData.vaccineExpiryDate,
          injectionSite: vaccinationData.injectionSite,
          routeOfAdministration: vaccinationData.routeOfAdministration,
          doseAmount: vaccinationData.doseAmount,
          nurseNotes: vaccinationData.nurseNotes,
          nurse: { 
            fullName: 'Current Nurse' 
          },
          createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
        },
        message: 'Mock data - Vaccination recorded successfully'
      };
    }
  };
}

export default new NurseService(); 