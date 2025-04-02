import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

class StaffService {
  // Get all patients in observation
  getAllInObservation = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/staff/in-observation`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Get today's patients in observation
  getTodayInObservation = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/staff/today-in-observation`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Get observations by date
  getObservationsByDate = async (date) => {
    try {
      const response = await axios.get(`${API_URL}/api/staff/in-observation?date=${date}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Get appointment details
  getAppointmentDetails = async (appointmentId) => {
    try {
      const response = await axios.get(`${API_URL}/api/staff/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Record post-vaccination care
  recordPostVaccinationCare = async (careData) => {
    try {
      const response = await axios.post(`${API_URL}/api/staff/record-post-vaccination-care`, careData);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Complete appointment
  completeAppointment = async (appointmentId) => {
    try {
      const response = await axios.put(`${API_URL}/api/staff/complete-appointment/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };
}

export default new StaffService(); 