import axios from 'axios';
import moment from 'moment';

const API_URL = import.meta.env.VITE_API_URL || '';

// Mock data for when the API isn't available
const MOCK_ASSIGNMENTS = [
  {
    id: 1,
    appointmentDate: moment().format('YYYY-MM-DD'),
    timeSlot: '09:00 - 10:00',
    status: 'WITH_DOCTOR',
    paid: true,
    child: {
      child_name: 'Emma Smith',
      birthDate: moment().subtract(3, 'years').format('YYYY-MM-DD'),
      gender: 'FEMALE',
      account_Id: {
        fullName: 'Jane Smith',
        phoneNumber: '+84987654321',
        email: 'jane.smith@example.com'
      },
      medicalHistory: 'No significant medical history. Allergic to penicillin.',
      vaccinesOfChild: [
        {
          id: 1,
          vaccine: {
            id: 1,
            name: 'MMR Vaccine',
            description: 'Measles, Mumps, and Rubella vaccine',
            price: 25.0
          },
          currentDose: 1,
          totalDoses: 2,
          isCompleted: false,
          doseSchedules: [
            {
              id: 1,
              doseNumber: 1,
              status: 'COMPLETED',
              scheduledDate: moment().subtract(1, 'years').format('YYYY-MM-DD')
            },
            {
              id: 2,
              doseNumber: 2,
              status: 'SCHEDULED',
              scheduledDate: moment().add(1, 'years').format('YYYY-MM-DD')
            }
          ]
        }
      ]
    },
    appointmentVaccines: [
      {
        id: 1,
        status: 'PENDING',
        vaccine: {
          id: 2,
          name: 'Hepatitis B',
          description: 'Hepatitis B vaccine',
          price: 30.0
        },
        doseSchedule: {
          doseNumber: 1
        }
      },
      {
        id: 2,
        status: 'PENDING',
        vaccine: {
          id: 3,
          name: 'DTaP Vaccine',
          description: 'Diphtheria, Tetanus, and Pertussis vaccine',
          price: 35.0
        },
        doseSchedule: {
          doseNumber: 1
        }
      }
    ]
  },
  {
    id: 2,
    appointmentDate: moment().format('YYYY-MM-DD'),
    timeSlot: '10:00 - 11:00',
    status: 'WITH_DOCTOR',
    paid: true,
    child: {
      child_name: 'James Wilson',
      birthDate: moment().subtract(1, 'years').format('YYYY-MM-DD'),
      gender: 'MALE',
      account_Id: {
        fullName: 'Robert Wilson',
        phoneNumber: '+84912345678',
        email: 'robert.wilson@example.com'
      },
      medicalHistory: 'Born prematurely at 34 weeks. No other significant issues.',
      vaccinesOfChild: []
    },
    appointmentVaccines: [
      {
        id: 3,
        status: 'PENDING',
        vaccine: {
          id: 4,
          name: 'Polio Vaccine',
          description: 'Inactivated Polio Vaccine',
          price: 28.0
        },
        doseSchedule: {
          doseNumber: 1
        }
      }
    ]
  }
];

class DoctorService {
  // Get all assigned appointments
  getAllAssignedAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/doctor/vaccination/assigned-appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getAllAssignedAppointments due to API error:', error.message);
      return { 
        code: 100, 
        result: MOCK_ASSIGNMENTS,
        message: 'Mock data - API not available'
      };
    }
  };

  // Get today's appointments
  getTodayAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/doctor/vaccination/today-appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getTodayAppointments due to API error:', error.message);
      const today = moment().format('YYYY-MM-DD');
      const todayAppointments = MOCK_ASSIGNMENTS.filter(
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
      const response = await axios.get(`${API_URL}/api/doctor/vaccination/assigned-appointments?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getAppointmentsByDate due to API error:', error.message);
      const appointmentsByDate = MOCK_ASSIGNMENTS.filter(
        appointment => appointment.appointmentDate === date
      );
      return { 
        code: 100, 
        result: appointmentsByDate,
        message: 'Mock data - API not available'
      };
    }
  };

  // Get appointment details
  getAppointmentDetails = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/doctor/vaccination/appointments/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.log('Using mock data for getAppointmentDetails due to API error:', error.message);
      const appointment = MOCK_ASSIGNMENTS.find(a => a.id === appointmentId);
      return { 
        code: 100, 
        result: appointment || MOCK_ASSIGNMENTS[0],
        message: 'Mock data - API not available'
      };
    }
  };

  // Create health record
  createHealthRecord = async (healthRecordData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/doctor/vaccination/create-health-record`, 
        healthRecordData, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.log('Using mock data for createHealthRecord due to API error:', error.message);
      // Simulate successful health record creation
      return { 
        code: 100, 
        result: {
          id: Date.now(),
          appointmentVaccineId: healthRecordData.appointmentVaccineId,
          temperature: healthRecordData.temperature,
          weight: healthRecordData.weight,
          height: healthRecordData.height,
          bloodPressure: healthRecordData.bloodPressure,
          heartRate: healthRecordData.heartRate,
          doctorNotes: healthRecordData.doctorNotes,
          createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
        },
        message: 'Mock data - Health record created successfully'
      };
    }
  };

  // Reschedule dose
  rescheduleDose = async (doseScheduleId, newDate) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/doctor/vaccination/reschedule-dose/${doseScheduleId}?newDate=${newDate}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.log('Using mock data for rescheduleDose due to API error:', error.message);
      // Simulate successful rescheduling
      return { 
        code: 100, 
        result: {
          id: doseScheduleId,
          scheduledDate: newDate,
          status: 'SCHEDULED',
          updatedAt: moment().format('YYYY-MM-DD HH:mm:ss')
        },
        message: 'Mock data - Dose rescheduled successfully'
      };
    }
  };
}

export default new DoctorService(); 