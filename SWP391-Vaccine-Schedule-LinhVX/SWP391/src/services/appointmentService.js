import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

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

class AppointmentService {
  // Get child vaccine data
  async getChildVaccineData(childId, appointmentType) {
    try {
      let response;
      switch(appointmentType) {
        case 'NEW_VACCINE':
        case 'NEXT_DOSE':
          response = await axios.get(`${API_URL}/appointments/child/${childId}/vaccines`, {
            headers: getAuthHeaders()
          });
          // For NEW_VACCINE, return available vaccines
          // For NEXT_DOSE, return upcoming doses
          return {
            availableVaccines: appointmentType === 'NEW_VACCINE' ? response.data.availableVaccines || [] : [],
            existingVaccines: response.data.existingVaccines || [],
            upcomingDoses: appointmentType === 'NEXT_DOSE' ? response.data.upcomingDoses || [] : [],
            vaccineCombos: []
          };
        case 'VACCINE_COMBO':
          response = await axios.get(`${API_URL}/vaccine-combos`, {
            headers: getAuthHeaders()
          });
          return {
            availableVaccines: [],
            existingVaccines: [],
            upcomingDoses: [],
            vaccineCombos: response.data?.result || []
          };
        default:
          throw new Error('Invalid appointment type');
      }
    } catch (error) {
      console.error('Error fetching child vaccine data:', error);
      throw error;
    }
  }

  // Get available work schedules for a specific date
  async getAvailableSchedules(date) {
    try {
      const response = await axios.get(`${API_URL}/work-schedules/available?date=${date}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available schedules:', error);
      throw error;
    }
  }

  // Get doctor's schedule
  async getDoctorSchedules(doctorId, startDate, endDate) {
    try {
      const response = await axios.get(`${API_URL}/work-schedules/doctor/${doctorId}`, {
        params: {
          startDate,
          endDate
        },
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor schedules:', error);
      throw error;
    }
  }

  // Get available time slots for a date
  async getAvailableTimeSlots(date, doctorId = null) {
    try {
      const url = doctorId 
        ? `${API_URL}/schedules/doctor/${doctorId}/slots`
        : `${API_URL}/schedules/available-slots`;
      
      const response = await axios.get(url, {
        params: { date },
        headers: getAuthHeaders()
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      throw error;
    }
  }

  // Get available doctors (without date/time parameters for doctor-first mode)
  async getAvailableDoctors() {
    try {
      const response = await axios.get(`${API_URL}/doctors/all`, {
        headers: getAuthHeaders()
      });
      
      if (!response.data || response.data.length === 0) {
        console.warn('No doctors found, using fallback data');
        return this.generateFallbackDoctors();
      }
      
      return response.data.map(doctor => ({
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization || 'Pediatrician',
        imageUrl: doctor.imageUrl
      }));
    } catch (error) {
      console.error('Error fetching available doctors:', error);
      // Return fallback data in case of error
      return this.generateFallbackDoctors();
    }
  }

  // Get available doctors for a specific time slot (date-first mode)
  async getAvailableDoctorsForTimeSlot(date, timeSlot) {
    try {
      const response = await axios.get(`${API_URL}/schedules/available-doctors`, {
        params: {
          date,
          timeSlot
        },
        headers: getAuthHeaders()
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching doctors for time slot:', error);
      throw error;
    }
  }

  // Create a new appointment
  async createAppointment(appointmentData) {
    try {
      const response = await axios.post(`${API_URL}/appointments/create`, appointmentData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  // Create online payment for an appointment
  async createPayment(appointmentId) {
    try {
      const response = await axios.post(`${API_URL}/payments/create/${appointmentId}`, {}, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  // Get user's appointments
  async getUserAppointments() {
    try {
      const response = await axios.get(`${API_URL}/appointments/user`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      throw error;
    }
  }

  // Get child's appointments
  async getChildAppointments(childId) {
    try {
      const response = await axios.get(`${API_URL}/appointments/child/${childId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching child appointments:', error);
      throw error;
    }
  }

  // Get appointment details by ID
  async getAppointmentById(appointmentId) {
    try {
      const response = await axios.get(`${API_URL}/appointments/${appointmentId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      throw error;
    }
  }

  // Cancel an appointment
  async cancelAppointment(appointmentId, reason) {
    try {
      const response = await axios.put(`${API_URL}/appointments/${appointmentId}/cancel`, 
        { cancellationReason: reason },
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error canceling appointment:', error);
      throw error;
    }
  }

  // Get user's upcoming appointments
  async getUpcomingAppointments() {
    try {
      const response = await axios.get(`${API_URL}/appointments/upcoming`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }
  }

  // Get user's appointment history
  async getAppointmentHistory() {
    try {
      const response = await axios.get(`${API_URL}/appointments/history`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment history:', error);
      throw error;
    }
  }

  // Check if a doctor is available for a specific date and time slot
  async checkDoctorAvailability(doctorId, date, timeSlot) {
    try {
      const response = await axios.get(
        `${API_URL}/work-schedules/check-availability?doctorId=${doctorId}&date=${date}&timeSlot=${timeSlot}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error checking doctor availability:', error);
      return false;
    }
  }

  // Helper method to generate fallback time slots for testing
  generateFallbackTimeSlots(doctorId = null) {
    const timeSlots = [
      {
        id: 1,
        startTime: '08:00',
        endTime: '09:00',
        availableDoctorCount: doctorId ? 1 : 2,
        availableAppointments: 5,
        isFallback: true
      },
      {
        id: 2,
        startTime: '09:00',
        endTime: '10:00',
        availableDoctorCount: doctorId ? 1 : 3,
        availableAppointments: 5,
        isFallback: true
      },
      {
        id: 3,
        startTime: '10:00',
        endTime: '11:00',
        availableDoctorCount: doctorId ? 1 : 1,
        availableAppointments: 5,
        isFallback: true
      },
      {
        id: 4,
        startTime: '13:00',
        endTime: '14:00',
        availableDoctorCount: doctorId ? 1 : 2,
        availableAppointments: 5,
        isFallback: true
      },
      {
        id: 5,
        startTime: '14:00',
        endTime: '15:00',
        availableDoctorCount: doctorId ? 1 : 2,
        availableAppointments: 5,
        isFallback: true
      }
    ];
    
    // If no doctorId is provided, return all time slots
    if (!doctorId) {
      return timeSlots;
    }
    
    // If a doctorId is provided, return a subset of time slots
    // to simulate that the doctor is only available at certain times
    return timeSlots.filter((_, index) => {
      // Use the last character of the doctorId to determine which time slots to return
      const lastChar = doctorId.charAt(doctorId.length - 1);
      const lastDigit = parseInt(lastChar, 10) || 0;
      
      // Return different time slots based on the last digit
      if (lastDigit % 3 === 0) {
        return index !== 1 && index !== 3; // exclude 9:00 and 13:00
      } else if (lastDigit % 3 === 1) {
        return index !== 0 && index !== 4; // exclude 8:00 and 14:00
      } else {
        return index !== 2; // exclude 10:00
      }
    });
  }

  // Helper method to generate fallback doctors for testing
  generateFallbackDoctors(timeSlotId) {
    const doctors = [
      { 
        id: 'DR001', 
        firstName: 'John', 
        lastName: 'Smith', 
        specialization: 'Pediatrician',
        isFallback: true 
      },
      { 
        id: 'DR002', 
        firstName: 'Sarah', 
        lastName: 'Johnson', 
        specialization: 'Pediatrician',
        isFallback: true 
      },
      { 
        id: 'DR003', 
        firstName: 'Michael', 
        lastName: 'Williams', 
        specialization: 'Pediatrician',
        isFallback: true 
      }
    ];
    
    // Return different doctors based on the time slot ID
    const timeSlotNum = parseInt(timeSlotId, 10) || 0;
    
    if (timeSlotNum === 1) {
      return [doctors[0], doctors[1]]; // 8:00-9:00: 2 doctors
    } else if (timeSlotNum === 2) {
      return [doctors[0], doctors[1], doctors[2]]; // 9:00-10:00: 3 doctors
    } else if (timeSlotNum === 3) {
      return [doctors[2]]; // 10:00-11:00: 1 doctor
    } else if (timeSlotNum === 4) {
      return [doctors[0], doctors[1]]; // 13:00-14:00: 2 doctors
    } else if (timeSlotNum === 5) {
      return [doctors[1], doctors[2]]; // 14:00-15:00: 2 doctors
    } else {
      // Default: return 1 doctor
      return [doctors[0]];
    }
  }

  // New helper method to generate fallback dates
  generateFallbackDates() {
    const fallbackDates = [];
    const startDate = new Date();
    
    // Add 5 dates starting from today
    for (let i = 1; i <= 10; i++) {
      if (i % 2 === 0) { // Add every other day
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        fallbackDates.push({
          date: date.toISOString().split('T')[0],
          doctorCount: Math.floor(Math.random() * 3) + 1, // Random 1-3 doctors
          isFallback: true
        });
      }
    }
    
    return fallbackDates;
  }
}

export default new AppointmentService(); 