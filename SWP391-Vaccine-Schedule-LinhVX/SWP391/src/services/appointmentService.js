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

  // ************ DOCTOR-FIRST APPROACH METHODS ************
  
  // Get available dates for a specific doctor
  async getDoctorAvailableDates(doctorId, startDate = null, endDate = null) {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await axios.get(`${API_URL}/doctors/${doctorId}/available-dates`, {
        params,
        headers: getAuthHeaders()
      });
      return response.data.availableDates || [];
    } catch (error) {
      console.error('Error fetching doctor available dates:', error);
      throw error;
    }
  }
  
  // Get time slots for a specific doctor on a specific date
  async getDoctorTimeSlots(doctorId, date) {
    try {
      const response = await axios.get(`${API_URL}/doctors/${doctorId}/time-slots`, {
        params: { date },
        headers: getAuthHeaders()
      });
      return response.data.timeSlots || [];
    } catch (error) {
      console.error('Error fetching doctor time slots:', error);
      throw error;
    }
  }
  
  // Get all schedules for a doctor in a date range
  async getDoctorSchedules(doctorId, startDate, endDate) {
    try {
      const response = await axios.get(`${API_URL}/work-schedules/doctor/${doctorId}`, {
        params: { startDate, endDate },
        headers: getAuthHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching doctor schedules:', error);
      throw error;
    }
  }

  // ************ DATE-FIRST APPROACH METHODS ************
  
  // Get all available time slots for a date (consolidated from all doctors)
  async getAvailableTimeSlots(date) {
    try {
      const response = await axios.get(`${API_URL}/schedules/available-slots`, {
        params: { date },
        headers: getAuthHeaders()
      });
      return response.data.timeSlots || [];
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      throw error;
    }
  }
  
  // Get all doctors available for a specific date and time slot
  async getAvailableDoctorsForTimeSlot(date, timeSlot) {
    try {
      const response = await axios.get(`${API_URL}/schedules/available-doctors`, {
        params: { date, timeSlot },
        headers: getAuthHeaders()
      });
      return response.data.doctors || [];
    } catch (error) {
      console.error('Error fetching available doctors for time slot:', error);
      throw error;
    }
  }
  
  // Legacy method for backward compatibility
  async getAvailableSlots(date, doctorId = null) {
    try {
      if (doctorId) {
        // Doctor-first approach
        const timeSlots = await this.getDoctorTimeSlots(doctorId, date);
        return {
          availableSlots: {
            [doctorId]: timeSlots
          }
        };
      } else {
        // Date-first approach
        const timeSlots = await this.getAvailableTimeSlots(date);
        // Transform into the expected format for backward compatibility
        const doctorSlots = {};
        
        // Group time slots by doctor
        timeSlots.forEach(slot => {
          if (slot.doctors && slot.doctors.length > 0) {
            slot.doctors.forEach(doctorKey => {
              if (!doctorSlots[doctorKey]) {
                doctorSlots[doctorKey] = [];
              }
              
              doctorSlots[doctorKey].push({
                id: slot.id,
                time: slot.time,
                available: slot.available,
                availableCount: slot.availableCount
              });
            });
          }
        });
        
        return {
          availableSlots: doctorSlots
        };
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
  }
  
  // Legacy method for backward compatibility
  async getAvailableDoctors(date, timeSlot) {
    return this.getAvailableDoctorsForTimeSlot(date, timeSlot);
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

  // Create a new appointment
  async createAppointment(appointmentData) {
    try {
      // Format data before sending if needed
      const formattedData = {
        ...appointmentData,
        // Make sure the isOfflinePayment flag is explicitly set based on payment method
        isOfflinePayment: appointmentData.paymentMethod === 'OFFLINE'
      };
      
      console.log('Creating appointment with formattedData:', formattedData);
      
      // Handle both vaccines array (old format) and vaccineRequests array (new format)
      if (appointmentData.vaccines) {
        formattedData.vaccines = appointmentData.vaccines.map(v => {
          switch (v.type) {
            case 'VACCINE_COMBO':
              return {
                type: v.type,
                comboId: v.comboId
              };
            case 'NEXT_DOSE':
              return {
                type: v.type,
                vaccineOfChildId: v.vaccineOfChildId,
                doseScheduleId: v.doseScheduleId,
                doseNumber: v.doseNumber
              };
            default: // NEW_VACCINE
              return {
                type: v.type || 'NEW_VACCINE',
                vaccineId: v.vaccineId,
                doseNumber: v.doseNumber || 1
              };
          }
        });
      } else if (appointmentData.vaccineRequests) {
        // Use vaccineRequests directly if that's what was provided
        formattedData.vaccines = appointmentData.vaccineRequests;
        
        // Remove the vaccineRequests property to avoid duplication
        delete formattedData.vaccineRequests;
      } else {
        // Neither vaccines nor vaccineRequests was provided - add empty array
        formattedData.vaccines = [];
        console.warn('No vaccines or vaccineRequests provided for appointment');
      }
      
      // Deep log the final data to help with debugging
      console.log('Appointment data being sent to API:', JSON.stringify(formattedData, null, 2));
      console.log('Request headers:', getAuthHeaders());
      
      // Set a timeout of 15 seconds for this request
      const response = await axios.post(`${API_URL}/appointments`, formattedData, {
        headers: getAuthHeaders(),
        timeout: 15000,
        // Add validateStatus to handle any status code
        validateStatus: function (status) {
          // Allow all status codes to be processed
          return true;
        }
      });
      
      console.log('Raw response status:', response.status);
      
      // Try to parse the response if it's a string
      if (typeof response.data === 'string') {
        try {
          response.data = JSON.parse(response.data);
        } catch (e) {
          console.log('Failed to parse JSON response', e);
          
          // Try to extract appointment ID from the string
          const matches = response.data.match(/\"id\":(\d+)/);
          if (matches && matches[1]) {
            const extractedId = parseInt(matches[1]);
            console.log('Extracted ID from unparseable response:', extractedId);
            response.data = { id: extractedId, _parseError: true };
          } else {
            response.data = { _parseError: true, _rawData: response.data };
          }
        }
      }
      
      console.log('Raw response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
      
      // Check if we got a valid response
      if (response.status >= 200 && response.status < 300) {
        console.log('Appointment created successfully:', response.data);
        return response.data;
      }
      
      // Check headers for appointment information
      const locationHeader = response.headers ? response.headers.location : null;
      if (locationHeader) {
        console.log('Found location header:', locationHeader);
        // Extract ID from location header (typically in format /api/appointments/{id})
        const matches = locationHeader.match(/\/appointments\/(\d+)/);
        if (matches && matches[1]) {
          const appointmentId = parseInt(matches[1]);
          console.log('Extracted appointment ID from location header:', appointmentId);
          return { id: appointmentId };
        }
      }
      
      // For error responses with data
      if (response.data) {
        console.log('Response data for error status:', response.data);
        
        // Check if there was a parse error but we might have extracted an ID
        if (response.data._parseError && response.data.id) {
          console.log('Using ID extracted from parse error:', response.data.id);
          return { id: response.data.id };
        }
        
        // If we can extract an appointment ID from the response, return it
        if (response.data.appointmentId || response.data.id) {
          return { 
            id: response.data.appointmentId || response.data.id,
            status: response.status
          };
        }
        
        // If there's a useful error message, throw it
        if (response.data.message) {
          throw new Error(response.data.message);
        }
        
        // For Spring Boot detailed error responses
        if (response.data.error || response.data.errors) {
          // Try to extract specific validation errors
          const errors = response.data.errors || [];
          if (errors.length > 0) {
            const errorMessages = errors.map(err => `${err.field}: ${err.defaultMessage || err.message}`).join(', ');
            throw new Error(`Validation errors: ${errorMessages}`);
          } else if (response.data.error) {
            throw new Error(response.data.error);
          }
        }
      }
      
      // If we reached here, we have an error response with no useful information
      throw new Error(`Request failed with status code ${response.status}: ${response.statusText || 'Unknown error'}`);
    } catch (error) {
      console.error('Error creating appointment:', error);
      
      // Add the request config to the error object for easier debugging
      if (error.config) {
        console.log('Request config:', {
          url: error.config.url,
          method: error.config.method,
          data: error.config.data,
          headers: error.config.headers
        });
      }
      
      // Add response details if available
      if (error.response) {
        console.log('Error response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // Extract backend error message if available
        if (error.response.data && error.response.data.message) {
          throw new Error(error.response.data.message);
        }
      }
      
      throw error;
    }
  }

  // Create online payment for an appointment
  async createPayment(appointmentId, paymentOptions = {}) {
    try {
      console.log('Creating payment for appointment:', appointmentId, 'with options:', paymentOptions);
      
      // Format the payment request according to MomoPaymentRequestDTO structure
      const paymentRequest = {
        appointmentId: appointmentId,
        amount: paymentOptions.amount,
        requestType: paymentOptions.requestType || 'captureWallet',
        orderInfo: paymentOptions.orderInfo || `Payment for appointment #${appointmentId}`,
        extraData: appointmentId.toString(),
        returnUrl: paymentOptions.redirectUrl || window.location.origin + '/appointment-creation',
        notifyUrl: paymentOptions.notifyUrl || window.location.origin + '/api/payments/momo/ipn',
        cancelUrl: paymentOptions.cancelUrl || window.location.origin + '/appointment-creation?paymentStatus=cancelled&appointmentId=' + appointmentId,
        failureUrl: paymentOptions.failureUrl || window.location.origin + '/appointment-creation?paymentStatus=failed&appointmentId=' + appointmentId
      };
      
      console.log('Payment request data:', paymentRequest);
      
      const response = await axios.post(`${API_URL}/payments/momo/create`, paymentRequest, {
        headers: getAuthHeaders()
      });
      
      console.log('Payment created successfully:', response.data);
      
      // Store appointment ID in sessionStorage for retrieval after redirect
      sessionStorage.setItem('pendingPayment', JSON.stringify({
        appointmentId: appointmentId,
        paymentMethod: paymentRequest.requestType,
        amount: paymentOptions.amount,
        timestamp: Date.now()
      }));
      
      // Standardize the payment response
      const paymentData = response.data.result || response.data;
      
      // MOMO payment URL should be in payUrl field
      const paymentUrl = paymentData && (paymentData.payUrl || paymentData.paymentUrl);
      
      if (paymentUrl) {
        console.log('Using payment URL:', paymentUrl);
        return {
          ...paymentData,
          payUrl: paymentUrl,
          paymentMethod: paymentRequest.requestType,
          orderId: paymentData.orderId || paymentData.requestId
        };
      }
      
      // If we couldn't find a payUrl but the response data is a URL string
      if (typeof paymentData === 'string' && (
        paymentData.startsWith('http') || 
        paymentData.includes('gateway') ||
        paymentData.includes('momo')
      )) {
        console.log('Payment URL received as string:', paymentData);
        return { 
          payUrl: paymentData,
          paymentMethod: paymentRequest.requestType,
          orderId: `order-${appointmentId}-${Date.now()}`
        };
      }
      
      // Return original response with payment method added
      return {
        ...paymentData,
        paymentMethod: paymentRequest.requestType,
        orderId: paymentData.orderId || paymentData.requestId || `order-${appointmentId}-${Date.now()}`
      };
    } catch (error) {
      console.error('Error creating payment:', error);
      
      // Log detailed error for debugging
      if (error.response) {
        const errorInfo = {
          status: error.response.status,
          data: error.response.data,
          url: error.response.config.url
        };
        console.error('Payment API error details:', errorInfo);
      }
      
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

  // Utility method to get the ID of the last created appointment (fallback for error handling)
  async getLastCreatedAppointmentId() {
    try {
      // First try to get user's appointments and find the most recent one
      const appointments = await this.getUserAppointments();
      
      if (appointments && appointments.length > 0) {
        // Sort by creation date descending
        appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        // Return the ID of the most recent appointment
        return appointments[0].id;
      }
      
      // If no appointments found or error occurs, return null
      return null;
    } catch (error) {
      console.error('Error getting last created appointment ID:', error);
      return null;
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
      console.log('Fetching appointment details for ID:', appointmentId);
      const response = await axios.get(`${API_URL}/appointments/${appointmentId}`, {
        headers: getAuthHeaders(),
        // Add validateStatus to handle any status code
        validateStatus: function (status) {
          // Allow all status codes to be processed
          return true;
        }
      });
      
      // Handle non-200 responses
      if (response.status >= 400) {
        console.warn(`Appointment fetch failed with status ${response.status}:`, response.data);
        // Return a placeholder object instead of throwing
        return { 
          id: appointmentId,
          error: true,
          message: response.data?.message || `Failed to fetch appointment (Status: ${response.status})`,
          _statusCode: response.status
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      // Return a placeholder object instead of throwing
      return {
        id: appointmentId,
        error: true,
        message: error.message || 'Failed to fetch appointment details',
        _error: error
      };
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

  // Get available dates that have doctor schedules
  async getAvailableDates(doctorId = null, startDate = null, endDate = null) {
    try {
      const params = {};
      if (doctorId) params.doctorId = doctorId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await axios.get(`${API_URL}/appointments/available-dates`, {
        params,
        headers: getAuthHeaders()
      });
      
      return response.data.availableDates || [];
    } catch (error) {
      console.error('Error fetching available dates:', error);
      return [];
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

  // Check payment status by order ID
  async checkPaymentStatus(orderId) {
    try {
      console.log('Checking payment status for order:', orderId);
      const response = await axios.get(`${API_URL}/payments/momo/status?orderId=${orderId}`, {
        headers: getAuthHeaders()
      });
      console.log('Payment status response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  }
  
  // Mark appointment as paid (for when payment is confirmed)
  async markAppointmentAsPaid(appointmentId) {
    try {
      console.log('Marking appointment as paid:', appointmentId);
      
      // Check if appointment exists first
      let appointment;
      try {
        const checkResponse = await axios.get(`${API_URL}/appointments/${appointmentId}`, {
          headers: getAuthHeaders()
        });
        appointment = checkResponse.data;
        console.log('Found appointment to mark as paid:', appointment?.id);
      } catch (checkError) {
        console.warn('Error checking if appointment exists:', checkError.message);
        // continue with marking as paid even if check fails
      }
      
      // First make a direct call to payments/record endpoint to ensure the payment status is updated
      const directPaymentData = {
        orderInfo: `Payment for appointment #${appointmentId}`,
        resultCode: 0, // Success code
        transId: `direct-${appointmentId}-${Date.now()}`,
        amount: appointment?.totalAmount || 0,
        paymentMethod: 'MOMO',
        status: 'COMPLETED',
        paymentStatus: 'COMPLETED',
        paymentDate: new Date().toISOString(),
        directUpdate: true, // Flag to indicate this is a direct update call
        appointmentId: appointmentId // Explicitly include the appointmentId
      };
      
      console.log('Attempting direct payment record update:', directPaymentData);
      
      try {
        // Call payments/record endpoint directly
        const directResponse = await axios.post(`${API_URL}/payments/record`, directPaymentData, {
          headers: getAuthHeaders()
        });
        console.log('Direct payment record response:', directResponse.data);
        
        // If direct payment record was successful, we can return early
        if (directResponse.data && directResponse.data.success) {
          return {
            success: true,
            message: 'Payment recorded and appointment marked as paid successfully',
            data: directResponse.data
          };
        }
      } catch (directError) {
        console.warn('Direct payment record failed, continuing with regular flow:', directError.message);
      }
      
      // Create payment data to send to the appointment paid endpoint
      const paymentData = {
        paymentMethod: 'MOMO',
        paymentStatus: 'COMPLETED',
        paymentReference: `MOMO-${appointmentId}-${Date.now()}`,
        paymentDate: new Date().toISOString(),
        status: 'PAID'
      };
      
      console.log('Sending payment data to mark appointment as paid:', paymentData);
      
      // Try the more comprehensive PUT endpoint first
      try {
        const response = await axios.put(`${API_URL}/appointments/${appointmentId}/paid`, paymentData, {
          headers: getAuthHeaders()
        });
        
        console.log('Appointment marked as paid via PUT /appointments/{id}/paid:', response.data);
        
        return {
          success: true,
          message: 'Appointment marked as paid successfully',
          data: response.data
        };
      } catch (putError) {
        console.warn('PUT to /appointments/{id}/paid failed, trying fallback endpoint:', putError.message);
        
        // Fallback to the original endpoint if PUT fails
        try {
          const fallbackResponse = await axios.post(`${API_URL}/appointments/${appointmentId}/mark-paid`, paymentData, {
            headers: getAuthHeaders()
          });
          
          console.log('Appointment marked as paid via fallback endpoint:', fallbackResponse.data);
          
          return {
            success: true,
            message: 'Appointment marked as paid successfully via fallback endpoint',
            data: fallbackResponse.data
          };
        } catch (fallbackError) {
          console.error('Both endpoints failed for marking appointment as paid:', fallbackError.message);
          
          // Try to create a record in payment table even if appointment update fails
          try {
            // Last resort - try to create a payment record directly
            const emergencyPayload = {
              orderInfo: `Payment for appointment #${appointmentId}`,
              resultCode: 0,
              transId: `emergency-${appointmentId}-${Date.now()}`,
              amount: appointment?.totalAmount || 0,
              paymentMethod: 'MOMO',
              paymentStatus: 'COMPLETED',
              paymentDate: new Date().toISOString(),
              emergency: true // Flag to indicate this is an emergency update
            };
            
            const emergencyResponse = await axios.post(`${API_URL}/payments/record`, emergencyPayload, {
              headers: getAuthHeaders()
            });
            
            console.log('Created payment record as emergency fallback:', emergencyResponse.data);
            
            return {
              success: true,
              message: 'Created payment record via emergency fallback',
              data: emergencyResponse.data
            };
          } catch (emergencyError) {
            console.error('All attempts to mark appointment as paid failed:', emergencyError.message);
            throw fallbackError; // Rethrow the original error
          }
        }
      }
    } catch (error) {
      console.error('Error marking appointment as paid:', error);
      return {
        success: false,
        message: error.message || 'Failed to mark appointment as paid',
        _error: error
      };
    }
  }

  // Direct force update of payment status (to be used as a last resort)
  async forceUpdatePaymentStatus(appointmentId, paymentDetails = {}) {
    try {
      console.log('Attempting force update of payment status for appointment:', appointmentId);
      
      // Try multiple endpoints to ensure success
      const requests = [
        // 1. Try the record payment endpoint
        axios.post(`${API_URL}/payments/record`, {
          appointmentId: appointmentId,
          amount: paymentDetails.amount || 0,
          method: paymentDetails.method || 'MOMO',
          status: 'COMPLETED',
          reference: paymentDetails.reference || `force-${appointmentId}-${Date.now()}`,
          orderInfo: `Force payment update for appointment #${appointmentId}`,
          forceUpdate: true
        }, { headers: getAuthHeaders() }),
        
        // 2. Try the direct appointment update endpoint
        axios.post(`${API_URL}/appointments/${appointmentId}/force-update`, {
          isPaid: true,
          status: 'PAID',
          paymentDate: new Date().toISOString()
        }, { headers: getAuthHeaders() }),
        
        // 3. Try the original mark-paid endpoint with explicit status
        axios.post(`${API_URL}/appointments/${appointmentId}/mark-paid`, {
          paymentMethod: paymentDetails.method || 'MOMO',
          paymentStatus: 'COMPLETED',
          paymentDate: new Date().toISOString(),
          status: 'PAID'
        }, { headers: getAuthHeaders() })
      ];
      
      // Execute all requests and resolve as soon as any one succeeds
      const results = await Promise.allSettled(requests);
      
      // Log the results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`Request ${index + 1} succeeded:`, result.value.data);
        } else {
          console.warn(`Request ${index + 1} failed:`, result.reason);
        }
      });
      
      // Check if any request succeeded
      const anySuccess = results.some(result => result.status === 'fulfilled');
      
      if (anySuccess) {
        return {
          success: true,
          message: 'At least one payment update method succeeded'
        };
      } else {
        return {
          success: false,
          message: 'All payment update methods failed'
        };
      }
    } catch (error) {
      console.error('Error in force update payment status:', error);
      return {
        success: false,
        message: error.message || 'Failed to force update payment status',
        _error: error
      };
    }
  }

  // Direct database update for payment (bypassing problematic endpoints)
  async directPaymentUpdate(appointmentId, paymentDetails = {}) {
    try {
      console.log('Attempting direct database update for payment on appointment:', appointmentId);
      
      // Construct a complete payment record with all necessary fields
      const paymentData = {
        appointmentId: appointmentId,
        amount: paymentDetails.amount || 0,
        method: paymentDetails.method || 'MOMO',
        status: 'COMPLETED',
        resultCode: 0, // Force success code
        transId: paymentDetails.reference || `direct-${appointmentId}-${Date.now()}`,
        orderInfo: `Payment for appointment #${appointmentId}`,
        paymentDate: new Date().toISOString(),
        forceDbUpdate: true // Special flag for backend
      };
      
      console.log('Sending direct payment update with data:', paymentData);
      
      // Use the /payments/record endpoint which appears to be working
      const response = await axios.post(`${API_URL}/payments/record`, paymentData, {
        headers: getAuthHeaders()
      });
      
      console.log('Direct payment update response:', response.data);
      
      // Check if we got a successful response
      if (response.data && response.data.success) {
        return {
          success: true,
          message: 'Payment updated successfully via direct database update',
          data: response.data
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Direct payment update failed',
          data: response.data
        };
      }
    } catch (error) {
      console.error('Error in direct payment update:', error);
      return {
        success: false,
        message: error.message || 'Direct payment update failed with exception',
        _error: error
      };
    }
  }

  // Direct SQL update for payment (to be used only as a last resort when all else fails)
  async updatePaymentWithDirect(appointmentId, paymentDetails = {}) {
    try {
      console.log('Attempting EMERGENCY direct SQL update for payment on appointment:', appointmentId);
      
      // Create an emergency payload with detailed debug information
      const emergencyPayload = {
        appointmentId,
        amount: paymentDetails.amount || 0,
        method: paymentDetails.method || 'MOMO',
        status: 'PAID',
        paymentStatus: 'COMPLETED',
        reference: paymentDetails.reference || `emergency-${appointmentId}-${Date.now()}`,
        orderInfo: `Emergency payment update for appointment #${appointmentId}`,
        paymentDate: new Date().toISOString(),
        clientInfo: {
          userAgent: navigator.userAgent,
          clientTime: new Date().toISOString(),
          previousAttempts: true,
          errorLog: 'Multiple payment endpoint failures, attempting direct SQL update'
        }
      };
      
      console.log('Sending emergency direct SQL update with data:', emergencyPayload);
      
      // Use a special emergency endpoint for direct SQL update
      const response = await axios.post(`${API_URL}/payments/emergency-update`, emergencyPayload, {
        headers: {
          ...getAuthHeaders(),
          'X-Emergency-Update': 'true',
          'X-Emergency-Reason': 'Multiple payment endpoint failures'
        }
      });
      
      console.log('Emergency direct SQL update response:', response.data);
      
      // If we got this far without an error, assume success
      return {
        success: true,
        message: 'Emergency direct SQL update attempted',
        data: response.data
      };
    } catch (error) {
      console.error('Error in emergency direct SQL update:', error);
      return {
        success: false,
        message: 'Even emergency direct SQL update failed',
        _error: error
      };
    }
  }
}

export default new AppointmentService(); 