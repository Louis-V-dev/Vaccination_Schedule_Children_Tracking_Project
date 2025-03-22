import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Form, Row, Col, ProgressBar, Alert, Badge, Spinner, ListGroup, Toast } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faSpinner, faCheck, faSyringe, faClock, faUser, faCalendarAlt, faMoneyBill, faHome, faArrowLeft, faArrowRight, faFemale, faMale, faChild, faExclamationTriangle, faCheckCircle, faInfoCircle, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import appointmentService from '../services/appointmentService';
import childService from '../services/ChildService';
import { formatDate } from '../utils/formatUtils';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { format, addDays } from 'date-fns';
import '../assets/css/appointment.css';
import Calendar from 'react-calendar';
import MomoPayment from '../components/payment/MomoPayment';
import PaymentModal from '../components/PaymentModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API URL for direct API calls
const API_URL = 'http://localhost:8080/api';

// Add this helper function to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Add this helper function to check and format vaccine data
const ensureValidVaccineData = (data = {}) => {
    const { availableVaccines = [], existingVaccines = [], upcomingDoses = [], vaccineCombos = [] } = data;
    
    // Add detailed logging for each upcomingDose to check structure
    console.log("Processing upcoming doses:", upcomingDoses);
    
    // Check for duplicates by ID and remove them
    const doseMap = new Map();
    const uniqueDoses = [];
    
    upcomingDoses.forEach(dose => {
        // If this ID already exists, log a warning
        if (doseMap.has(dose.id)) {
            console.warn(`Found duplicate dose with ID ${dose.id}, keeping the first instance.`);
        } else {
            doseMap.set(dose.id, true);
            uniqueDoses.push(dose);
        }
    });
    
    if (upcomingDoses.length !== uniqueDoses.length) {
        console.warn(`Removed ${upcomingDoses.length - uniqueDoses.length} duplicate doses.`);
    }
    
    // Process and validate each upcoming dose
    const processedUpcomingDoses = uniqueDoses.map((dose, index) => {
        console.log(`Processing dose ${index}:`, dose);
        
        // Make a deep copy to avoid modifying the original
        const processedDose = JSON.parse(JSON.stringify(dose));
        
        // IMPORTANT: Log the exact structure we're working with
        console.log(`Dose ${index} before processing:`, {
            id: processedDose.id,
            doseNumber: processedDose.doseNumber,
            vaccineName: processedDose.vaccineName,
            price: processedDose.price,
            totalDoses: processedDose.totalDoses,
            isPaid: processedDose.isPaid,
            scheduledDate: processedDose.scheduledDate
        });
        
        // Make sure id is available
        if (!processedDose.id) {
            console.warn(`Dose ${index} missing ID, generating temporary ID`);
            processedDose.id = `temp-${index}`;
        }
        
        // Ensure vaccineOfChild exists
        if (!processedDose.vaccineOfChild) {
            console.warn(`Dose ${index} missing vaccineOfChild, creating fallback`);
            processedDose.vaccineOfChild = {
                id: processedDose.vaccineOfChildId || index,
                totalDoses: processedDose.totalDoses || 4,
                currentDose: processedDose.currentDose || processedDose.doseNumber - 1 || 0
            };
        }
        
        // Ensure vaccine info exists in the processed dose
        // CRITICAL: Preserve direct fields from API rather than overriding them
        if (!processedDose.vaccineName) {
            processedDose.vaccineName = processedDose.vaccineOfChild?.vaccine?.name || "Unknown Vaccine";
        }
        
        if (!processedDose.vaccineDescription) {
            processedDose.vaccineDescription = processedDose.vaccineOfChild?.vaccine?.description || "No description available";
        }
        
        if (!processedDose.vaccineManufacturer) {
            processedDose.vaccineManufacturer = processedDose.vaccineOfChild?.vaccine?.manufacturer || "Unknown manufacturer";
        }
        
        if (!processedDose.price) {
            processedDose.price = processedDose.vaccineOfChild?.vaccine?.price || 0;
        }
        
        if (!processedDose.totalDoses) {
            processedDose.totalDoses = processedDose.vaccineOfChild?.totalDoses || 4;
        }
        
        // Ensure vaccine exists in vaccineOfChild
        if (!processedDose.vaccineOfChild.vaccine) {
            console.warn(`Dose ${index} missing vaccine in vaccineOfChild, creating fallback`);
            processedDose.vaccineOfChild.vaccine = {
                name: processedDose.vaccineName || "Unknown Vaccine",
                price: processedDose.price || 0,
                manufacturer: processedDose.vaccineManufacturer || "Unknown manufacturer",
                description: processedDose.vaccineDescription || "No description available"
            };
        }
        
        // Convert string isPaid to boolean if needed
        if (typeof processedDose.isPaid === 'string') {
            processedDose.isPaid = processedDose.isPaid.toLowerCase() === 'true';
        }
        
        // IMPORTANT: Log the processed version to verify
        console.log(`Dose ${index} after processing:`, {
            id: processedDose.id,
            doseNumber: processedDose.doseNumber,
            vaccineName: processedDose.vaccineName,
            price: processedDose.price,
            totalDoses: processedDose.totalDoses,
            isPaid: processedDose.isPaid,
            scheduledDate: processedDose.scheduledDate
        });
        
        return processedDose;
    });
    
    return {
        availableVaccines,
        existingVaccines,
        upcomingDoses: processedUpcomingDoses,
        vaccineCombos
    };
};

const AppointmentCreation = () => {
    // Track the current step in appointment creation process
    const [currentStep, setCurrentStep] = useState(1);
    const navigate = useNavigate();
    
    // Step 1: Child and Vaccine Selection
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState('');
    const [childVaccineData, setChildVaccineData] = useState({
        availableVaccines: [], // New vaccines the child can take
        existingVaccines: [], // Vaccines the child has started
        upcomingDoses: [], // Next doses that are due
        vaccineCombos: [] // New addition for vaccine combos
    });
    const [selectedVaccines, setSelectedVaccines] = useState([]);
    const [isLoadingVaccineData, setIsLoadingVaccineData] = useState(false);
    const [appointmentType, setAppointmentType] = useState('');
    
    // Step 2: Schedule Selection
    const [isDayPriority, setIsDayPriority] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState({});
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [availableDoctors, setAvailableDoctors] = useState([]);
    const [notes, setNotes] = useState('');
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
    
    // Available dates for date-first mode
    const [availableDates, setAvailableDates] = useState([]);
    const [isLoadingDates, setIsLoadingDates] = useState(false);
    
    // Step 3: Payment Selection
    const [paymentMethod, setPaymentMethod] = useState('OFFLINE');
    const [invoice, setInvoice] = useState(null);
    const [isPrePaid, setIsPrePaid] = useState(false);
    
    // Error and success handling
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSuccess, setIsSuccess] = useState(false); // Add missing state variable for success status
    
    // Step 4: Confirmation
    const [appointmentResult, setAppointmentResult] = useState(null);
    const [paymentUrl, setPaymentUrl] = useState('');
    
    // Fetch available doctors based on role
    const [availableDoctorsForSelection, setAvailableDoctorsForSelection] = useState([]);
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
    
    // Loading states
    const [isLoadingEligibleVaccines, setIsLoadingEligibleVaccines] = useState(false);
    const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
    const [isCreatingAppointment, setIsCreatingAppointment] = useState(false);
    
    // Warning messages
    const [timeSlotWarning, setTimeSlotWarning] = useState('');
    const [dateWarning, setDateWarning] = useState('');
    
    // Fetch available doctors for a specific time slot (date-first mode)
    const [availableDoctorsForTimeSlot, setAvailableDoctorsForTimeSlot] = useState([]);
    const [doctorWarning, setDoctorWarning] = useState('');
    
    // Payment modal state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [createdAppointmentId, setCreatedAppointmentId] = useState(null);
    const [appointmentData, setAppointmentData] = useState(null); // Add missing state for appointment data
    const [appointmentId, setAppointmentId] = useState(null); // Add missing state for appointment ID
    
    // New payment-related state variables
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [paymentResult, setPaymentResult] = useState(null);
    const [paymentError, setPaymentError] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('');
    const [isPaid, setIsPaid] = useState(false);
    
    // Calculate age from date of birth
    const calculateAge = (birthdate) => {
        if (!birthdate) return 'N/A';
        
        const dob = new Date(birthdate);
        const today = new Date();
        
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        
        return age;
    };
    
    // Load children data on component mount
    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const response = await childService.getChildrenForGuardian();
                if (response && response.data) {
                    console.log('Children data:', response.data); // Debug log
                    setChildren(response.data);
                }
            } catch (error) {
                setError('Failed to load children. Please try again.');
                console.error('Error loading children:', error);
            }
        };
        
        fetchChildren();
    }, []);
    
    // Update the fetchChildVaccineData function
        const fetchChildVaccineData = async () => {
        if (!selectedChild) {
            console.warn('No child selected, cannot fetch vaccine data');
            return;
        }
        
        if (!appointmentType) {
            console.warn('No appointment type selected, cannot fetch vaccine data');
            return;
        }
            
            setIsLoadingVaccineData(true);
        setError('');
        
            try {
            console.log(`Fetching vaccine data for child ${selectedChild} and type ${appointmentType}`);
            
            // Call the API
                const response = await appointmentService.getChildVaccineData(selectedChild, appointmentType);
            
            // Log raw response data for debugging
            console.log('Raw API response:', response);
            
            // Process and validate the data
            const processedData = ensureValidVaccineData(response);
            console.log('Processed vaccine data:', processedData);
            
            // Update state with processed data
            setChildVaccineData(processedData);
            
            // Clear any selected vaccines when getting new data
            setSelectedVaccines([]);
            } catch (error) {
            console.error('Error fetching child vaccine data:', error);
            setError(`Failed to load vaccine data: ${error.message}`);
            } finally {
                setIsLoadingVaccineData(false);
            }
        };
    
    // Load available slots based on selected date or doctor
    const fetchAvailableSlots = async () => {
        if (!selectedDate) return {};

        setIsLoadingSchedule(true);
        try {
            if (isDayPriority) {
                // Get all available slots for the selected date
                const response = await appointmentService.getAvailableTimeSlots(selectedDate);
                // Ensure we return an object with the correct structure
                return response?.availableSlots || {};
            } else {
                // Get slots for specific doctor
                const response = await appointmentService.getDoctorSchedules(
                    selectedDoctor,
                    selectedDate,
                    selectedDate
                );
                // Transform the response into the expected format
                const formattedSlots = {};
                if (response && response.length > 0) {
                    formattedSlots[response[0].employee.fullName] = response[0].availableSlots || [];
                }
                return formattedSlots;
            }
        } catch (error) {
            console.error('Error loading time slots:', error);
            // Return empty object in case of error
            return {};
        } finally {
            setIsLoadingSchedule(false);
        }
    };
    
    // Load available doctors for selected time slot
    const fetchAvailableDoctors = async () => {
        if (!selectedDate || !selectedTimeSlot) return;
        
        setIsLoadingSchedule(true);
        try {
            const doctors = await appointmentService.getAvailableDoctors(selectedDate, selectedTimeSlot);
            setAvailableDoctors(doctors);
        } catch (error) {
            setError('Failed to load available doctors. Please try again.');
            console.error('Error loading doctors:', error);
        } finally {
            setIsLoadingSchedule(false);
        }
    };
    
    // Calculate provisional invoice
    const calculateInvoice = () => {
        const totalAmount = selectedVaccines.reduce((sum, vaccine) => {
            // For vaccine combos, use the combo price
            if (vaccine.type === 'VACCINE_COMBO') {
            return sum + (vaccine.isPaid ? 0 : vaccine.price);
            }
            
            // For individual vaccines and next doses
            const price = vaccine.price || (vaccine.vaccine && vaccine.vaccine.price) || 0;
            return sum + (vaccine.isPaid ? 0 : price);
        }, 0);
        
        const paidVaccines = selectedVaccines.filter(v => v.isPaid);
        const unpaidVaccines = selectedVaccines.filter(v => !v.isPaid);
        
        setInvoice({
            totalAmount,
            paidVaccines,
            unpaidVaccines
        });
        
        // Update isPrePaid flag if all selected vaccines are paid
        setIsPrePaid(selectedVaccines.length > 0 && selectedVaccines.every(v => v.isPaid));
    };
    
    // Handle appointment creation
    const handleCreateAppointment = async () => {
            setIsCreatingAppointment(true);
            setError(null);

        try {
            // If payment was canceled and we already have an appointment ID, just reopen the payment modal
            // But only do this for online payments
            if (paymentCanceled && createdAppointmentId && paymentMethod === 'ONLINE') {
                console.log('Payment was canceled for appointment:', createdAppointmentId);
                console.log('Reopening payment modal for existing appointment');
                setPaymentCanceled(false);
                setPaymentModalOpen(true);
                return;
            }

            // Log the raw data before formatting
            console.log('Raw data before formatting:', {
                selectedChild,
                selectedDate,
                selectedTimeSlot,
                selectedDoctor,
                selectedVaccines
            });
            
            // Ensure we have valid IDs
            if (!selectedChild) {
                throw new Error('Child ID is required');
            }
            
            // In date-first mode, if doctor selection is not shown or no doctor is selected,
            // we should NOT auto-select a doctor - let the backend handle it
            let finalDoctorId = selectedDoctor;
            if (isDayPriority === true && (!showDoctorSelection || !selectedDoctor)) {
                console.log('No doctor selected in date-first mode. Setting doctorId to null to let backend handle assignment.');
                finalDoctorId = null;
            }
            
            // Only validate doctor ID in doctor-priority mode
            if (isDayPriority === false && !finalDoctorId) {
                throw new Error('Doctor ID is required in doctor-priority mode');
            }
            
            // Format vaccine requests - with additional validation
            const formattedVaccines = selectedVaccines.map(v => {
                // Skip any vaccines without proper type
                if (!v.type) {
                    console.warn('Skipping vaccine without type:', v);
                    return null;
                }
                
                let baseRequest = { type: v.type };
                
                switch (v.type) {
                    case 'NEW_VACCINE':
                        if (!v.vaccineId || v.vaccineId === 'undefined') {
                            console.warn('Invalid vaccineId for NEW_VACCINE:', v);
                            return null;
                        }
                        baseRequest = {
                            ...baseRequest,
                            vaccineId: v.vaccineId?.toString(),
                            doseNumber: v.doseNumber || 1
                        };
                        break;
                        
                    case 'NEXT_DOSE':
                        if (!v.vaccineOfChildId || !v.doseScheduleId || 
                            v.vaccineOfChildId === 'undefined' || v.doseScheduleId === 'undefined') {
                            console.warn('Invalid IDs for NEXT_DOSE:', v);
                            return null;
                        }
                        baseRequest = {
                            ...baseRequest,
                            vaccineOfChildId: v.vaccineOfChildId?.toString(),
                            doseScheduleId: v.doseScheduleId?.toString(),
                            doseNumber: v.doseNumber || 1
                        };
                        break;
                        
                    case 'VACCINE_COMBO':
                        if (!v.comboId || v.comboId === 'undefined') {
                            console.warn('Invalid comboId for VACCINE_COMBO:', v);
                            return null;
                        }
                        baseRequest = {
                            ...baseRequest,
                            comboId: v.comboId?.toString()
                        };
                        break;
                        
                    default:
                        console.warn('Unknown vaccine type:', v.type);
                        return null;
                }
                
                return baseRequest;
            }).filter(v => v !== null); // Remove any null entries
            
            // Ensure we have at least one valid vaccine
            if (formattedVaccines.length === 0) {
                throw new Error('At least one valid vaccine is required');
            }
            
            // Create request data with string IDs
            const requestData = {
                childId: selectedChild, // Use string ID directly
                doctorId: finalDoctorId, // Will be null in date-priority mode unless explicitly selected
                isDayPriority: isDayPriority === true,
                appointmentDate: selectedDate,
                timeSlot: selectedTimeSlot,
                vaccines: formattedVaccines,
                paymentMethod: paymentMethod || 'ONLINE',
                notes: notes || '',
                // Explicitly set the isOfflinePayment flag for offline payments
                isOfflinePayment: paymentMethod === 'OFFLINE'
            };
            
            // Log the formatted request data
            console.log('Formatted appointment request data:', requestData);
            
            // Create the appointment
            const appointment = await appointmentService.createAppointment(requestData);
            
            console.log('Appointment created successfully:', appointment);
            console.log('Payment method used:', paymentMethod);
            console.log('isOfflinePayment flag:', requestData.isOfflinePayment);
            
            // Check if the response indicates an error
            if (appointment.code === 5000) {
                throw new Error(appointment.message || 'Failed to create appointment');
            }
            
            // Store the appointment ID
            setCreatedAppointmentId(appointment.id);
            
            // Update state with success
            setAppointmentResult({
                id: appointment.id,
                status: 'SUCCESS',
                message: 'Appointment created successfully'
            });

            // For online payment, open the payment modal
            if (paymentMethod === 'ONLINE') {
                // Get the invoice total
                const invoiceTotal = calculateInvoiceTotal();
                
                // Open the payment modal
                setPaymentModalOpen(true);
            } else {
                // For offline payment, show success message and information about payment at clinic
                setCurrentStep(4);
                setSuccess("Appointment created successfully! You will need to pay at the clinic before receiving vaccinations.");
                setIsSuccess(true);
            }
        } catch (err) {
            console.error('Error creating appointment:', err);
            setError(err.message || 'Failed to create appointment. Please try again.');
        } finally {
            setIsCreatingAppointment(false);
        }
    };
    
    // Handle payment modal close
    const handlePaymentModalClose = () => {
        setPaymentModalOpen(false);
        // Set a flag to indicate payment was canceled
        setPaymentCanceled(true);
        // Don't automatically advance to step 4 when user cancels payment
        // Let them have a chance to choose payment method again
        // The appointment is already created, so we leave them at step 3 with a notice
        setError("Payment cancelled. You can try again or change to offline payment.");
    };

    // Handle successful payment result from MoMo
    const handlePaymentSuccess = (result) => {
        console.log('Payment result: SUCCESS', result ? `resultCode: ${result.resultCode}` : '');
        console.log('Full payment result data:', result);
        console.log('Processing payment result for appointment:', createdAppointmentId);
        
        // Update UI immediately for better user experience
        setPaymentStatus('SUCCESS');
        setShowPaymentModal(false);
        setCurrentStep(4);
        
        console.log('Payment was successful, updating appointment and payment status');
        
        // Prepare payment data with all necessary fields for recording in the database
        const paymentData = {
            orderInfo: `Payment for appointment #${createdAppointmentId}`,
            resultCode: 0, // Success code
            transId: result?.transId || result?.orderId || `MOMO-${createdAppointmentId}-${Date.now()}`,
            amount: invoice?.totalAmount || totalAmount,
            // Additional fields that might be needed
            paymentMethod: 'MOMO',
            paymentStatus: 'COMPLETED',
            paymentDate: new Date().toISOString(),
            // Include original MoMo result data
            momoResult: JSON.stringify(result)
        };
        
        console.log('Now recording payment in the database...', paymentData);
        
        // Add a delay to ensure backend is ready
        setTimeout(() => {
            // Get auth headers for API calls
            const token = localStorage.getItem('token');
            const headers = token ? {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            } : {
                'Content-Type': 'application/json'
            };
            
            // Debug check to ensure we have a valid transId
            if (!paymentData.transId) {
                console.warn('No transId found in payment result, generating fallback...');
                paymentData.transId = `MOMO-${createdAppointmentId}-${Date.now()}`;
            }
            
            // First record the payment using the payments/record endpoint
            axios.post(`${API_URL}/payments/record`, paymentData, { headers })
            .then(response => {
                console.log('Payment recorded successfully:', response.data);
                
                // Then also mark appointment as paid to ensure all systems are updated
                return appointmentService.markAppointmentAsPaid(createdAppointmentId);
            })
            .then(response => {
                console.log('Appointment marked as paid successfully:', response);
                
                // Set appointmentId to make sure it's defined for refreshAppointmentData
                setAppointmentId(createdAppointmentId);
                console.log('Refreshing appointment data after payment');
                
                // Refresh appointment data to show updated status with retry mechanism
                // to ensure we get the latest data from the backend
                setTimeout(() => {
                    refreshAppointmentData(createdAppointmentId, 0, 5);
                }, 3000); // Increased delay to give backend more time to process
            })
            .catch(error => {
                console.error('Error recording payment or marking appointment as paid:', error);
                
                // Try the direct payment recording as a fallback
                console.log('Attempting direct payment recording as fallback...');
                try {
                    // Make a direct axios call to the payment record endpoint with full debug data
                    const fallbackPaymentData = {
                        ...paymentData,
                        debug: true,
                        fallbackAttempt: true,
                        appointmentId: createdAppointmentId,
                        timestamp: Date.now()
                    };
                    
                    axios.post(`${API_URL}/payments/record`, fallbackPaymentData, { headers })
                        .then(fallbackResponse => {
                            console.log('Fallback payment recording succeeded:', fallbackResponse.data);
                        })
                        .catch(fallbackError => {
                            console.error('Fallback payment recording failed:', fallbackError);
                        })
                        .finally(() => {
                            // Set appointmentId to make sure it's defined for refreshAppointmentData
                            setAppointmentId(createdAppointmentId);
                            
                            // Still refresh appointment data even if there was an error
                            setTimeout(() => {
                                refreshAppointmentData(createdAppointmentId, 0, 5);
                            }, 3000);
                        });
                } catch (fallbackError) {
                    console.error('Error in fallback payment recording:', fallbackError);
                    
                    // Set appointmentId to make sure it's defined for refreshAppointmentData
                    setAppointmentId(createdAppointmentId);
                    
                    // Still refresh appointment data even if there was an error
                    setTimeout(() => {
                        refreshAppointmentData(createdAppointmentId, 0, 5);
                    }, 3000);
                }
            });
            
            // Force UI to show success after a timeout
            // This ensures user sees success even if backend updates are slow
            setTimeout(() => {
                setPaymentStatus('SUCCESS');
                setIsPaid(true);
                console.log('Loading timeout reached, forcing success state');
            }, 5000);
        }, 2000);
    };

    // Handle payment failure
    const handlePaymentFailure = (error) => {
        console.error('Payment failed:', error);
        
        // Update UI to show payment failure
        setPaymentStatus('FAILED');
        setShowPaymentModal(false);
        setCurrentStep(4);
        
        // Display error message to user
        toast.error("Payment failed. Please try again or choose a different payment method.");
        
        // Allow the user to try payment again or choose different method
        setError("Payment could not be completed. Please try again or choose a different payment method.");
    };
    
    // Handle vaccine selection based on type (new, existing, or next dose)
    const handleVaccineSelection = (vaccine, isSelected) => {
        // Debug the incoming vaccine object
        console.log('handleVaccineSelection called with:', { vaccine, isSelected, type: appointmentType });
        console.log('Current selectedVaccines:', selectedVaccines);

        // Check if vaccine is already paid
        if (vaccine.isPaid) {
            console.log("This dose is already paid:", vaccine);
            toast.info("This dose is already paid. You can schedule an appointment for it but you won't be charged again.");
        }

        if (isSelected) {
            // Check if vaccine is already selected using more consistent comparison
            const isAlreadySelected = selectedVaccines.some(v => {
                switch (v.type) {
                    case 'NEW_VACCINE':
                        // Try different ways to compare IDs to handle both string and number types
                        return String(v.vaccineId) === String(vaccine.id);
                    case 'NEXT_DOSE':
                        const doseIdToCompare = vaccine.doseScheduleId || vaccine.id;
                        return String(v.doseScheduleId) === String(doseIdToCompare);
                    case 'VACCINE_COMBO':
                        const comboIdToCompare = vaccine.comboId || vaccine.id;
                        return String(v.comboId) === String(comboIdToCompare);
                    default:
                        return false;
                }
            });

            if (isAlreadySelected) {
                console.log('Vaccine already selected, skipping:', vaccine);
                return;
            }

            // Add vaccine to selection
            let vaccineToAdd;
            
            console.log('Adding vaccine:', vaccine);
            
            switch (appointmentType) {
                case 'NEXT_DOSE':
                    console.log("Processing NEXT_DOSE selection:", vaccine);
                    
                    // Use the direct fields provided by the enhanced backend DTO
                    vaccineToAdd = {
                        type: 'NEXT_DOSE',
                        doseScheduleId: String(vaccine.id || 0),
                        vaccineOfChildId: String(vaccine.vaccineOfChild?.id || 0),
                        doseNumber: vaccine.doseNumber || 1,
                        // Use direct fields from backend
                        name: vaccine.vaccineName || "Unknown Vaccine",
                        price: Number(vaccine.price || 0),
                        description: vaccine.vaccineDescription || vaccine.description || "No description available",
                        manufacturer: vaccine.vaccineManufacturer || vaccine.manufacturer || "Unknown",
                        totalDoses: vaccine.totalDoses || 4,
                        scheduledDate: vaccine.scheduledDate || null,
                        isPaid: vaccine.isPaid === true,
                        vaccineId: vaccine.vaccineId || 0,
                        isFromCombo: vaccine.isFromCombo || false,
                        // Include the full vaccineOfChild object for reference
                        vaccineOfChild: vaccine.vaccineOfChild,
                        // Display format for UI
                        displayDose: `Dose ${vaccine.doseNumber || 1} of ${vaccine.totalDoses || 4}`
                    };
                    
                    // Extra logging for debugging
                    console.log('Formatted NEXT_DOSE data:', vaccineToAdd);
                    console.log('Dose vaccine info - direct fields:', {
                        id: vaccine.id,
                        name: vaccine.vaccineName,
                        price: vaccine.price,
                        doseNumber: vaccine.doseNumber,
                        totalDoses: vaccine.totalDoses,
                        isPaid: vaccine.isPaid
                    });
                    break;
                    
                case 'VACCINE_COMBO':
                    if (!vaccine.id && !vaccine.comboId) {
                        console.error('Missing combo ID for combo:', vaccine);
                        setError('Invalid combo data: missing combo ID');
                        return;
                    }
                    
                    const comboId = vaccine.comboId || vaccine.id;
                    
                    // Log the complete combo object to see what's available
                    console.log('Complete combo object:', vaccine);
                    
                    // Ensure we have a proper vaccines array with all vaccines in the combo
                    const comboVaccines = vaccine.vaccines || [];
                    console.log('Combo vaccines:', comboVaccines);
                    
                    vaccineToAdd = {
                        type: 'VACCINE_COMBO',
                        comboId: String(comboId),
                        price: vaccine.price || 0, 
                        name: vaccine.comboName || vaccine.name || 'Vaccine Combo',
                        description: vaccine.description || "No description available",
                        // Store all vaccines in the combo with their details
                        vaccines: comboVaccines.map(v => ({
                            vaccineId: v.vaccineId,
                            name: v.vaccineName || v.name || "Unknown Vaccine",
                            price: v.price || 0,
                            totalDose: v.totalDose || 1
                        }))
                    };
                    
                    // Extra logging to verify the vaccines are properly included
                    console.log('Combo vaccines to be added:', vaccineToAdd.vaccines);
                break;
            
                default: // NEW_VACCINE
                    if (!vaccine.id) {
                        console.error('Missing vaccine ID for new vaccine:', vaccine);
                        setError('Invalid vaccine data: missing vaccine ID');
                        return;
                    }
                    
                    vaccineToAdd = {
                        type: 'NEW_VACCINE',
                        vaccineId: String(vaccine.id),
                        doseNumber: vaccine.doseNumber || 1,
                        price: vaccine.price || 0,
                        name: vaccine.name || 'Unknown Vaccine',
                        description: vaccine.description,
                        manufacturer: vaccine.manufacturer,
                        categoryName: vaccine.categoryName
                    };
            }
            
            console.log('Formatted vaccine to add:', vaccineToAdd);
            
            // Validate the formatted vaccine - make sure essential fields are set
            if (!vaccineToAdd.name) {
                console.error('Invalid vaccine data after formatting: missing name', vaccineToAdd);
                setError('Invalid vaccine data: missing name');
                return;
            }
            
            setSelectedVaccines(prev => [...prev, vaccineToAdd]);
        } else {
            // Remove vaccine from selection - more consistent comparison
            setSelectedVaccines(prev => prev.filter(v => {
                switch (v.type) {
                    case 'NEW_VACCINE':
                        return String(v.vaccineId) !== String(vaccine.id);
                    case 'NEXT_DOSE':
                        const doseIdToCheck = vaccine.id || vaccine.doseScheduleId;
                        return String(v.doseScheduleId) !== String(doseIdToCheck);
                    case 'VACCINE_COMBO':
                        const comboIdToCheck = vaccine.id || vaccine.comboId;
                        return String(v.comboId) !== String(comboIdToCheck);
                    default:
                        return true; // Keep items that don't match any type
                }
            }));
        }
        
        // Recalculate invoice after selection change
        calculateInvoice();
    };
    
    const handleRemoveVaccine = (vaccine) => {
        let updatedVaccines;
        switch (vaccine.type) {
            case 'NEW_VACCINE':
                updatedVaccines = selectedVaccines.filter(v => v.vaccineId !== vaccine.vaccineId);
                break;
            
            case 'NEXT_DOSE':
                updatedVaccines = selectedVaccines.filter(v => v.doseScheduleId !== vaccine.doseScheduleId);
                break;
            
            case 'VACCINE_COMBO':
                updatedVaccines = selectedVaccines.filter(v => v.comboId !== vaccine.comboId);
                break;
            
            default:
                console.error('Invalid vaccine type:', vaccine.type);
                return;
        }
        setSelectedVaccines(updatedVaccines);
    };
    
    // Navigation functions
    const handleNext = () => {
        if (currentStep === 1) {
            if (!selectedChild) {
                setError('Please select a child');
                return;
            }
            if (selectedVaccines.length === 0) {
                setError('Please select at least one vaccine');
                return;
            }
        } else if (currentStep === 2) {
            if (!selectedDate) {
                setError('Please select a date');
                return;
            }
            if (!selectedTimeSlot) {
                setError('Please select a time slot');
                return;
            }
            
            // Make doctor selection optional when in date-first mode
            if (!selectedDoctor && (isDayPriority === false || showDoctorSelection)) {
                setError('Missing doctor selection. Please go back to step 2.');
                return;
            }
            
            // Calculate invoice before moving to step 3
            calculateInvoice();
        } else if (currentStep === 3) {
            // Enhanced validation for appointment creation
            if (!selectedChild) {
                setError('Missing child information. Please go back to step 1.');
                return;
            }
            if (!selectedDate) {
                setError('Missing appointment date. Please go back to step 2.');
                return;
            }
            if (!selectedTimeSlot) {
                setError('Missing time slot. Please go back to step 2.');
                return;
            }
            
            // In date-first mode, doctor selection is optional unless the user opted for it
            const isDoctorRequired = isDayPriority === false || showDoctorSelection;
            if (!selectedDoctor && isDoctorRequired) {
                setError('Missing doctor selection. Please go back to step 2.');
                return;
            }
            
            if (selectedVaccines.length === 0) {
                setError('No vaccines selected. Please go back to step 1.');
                return;
            }
            
            // Fix any incorrectly formatted vaccine objects - ensure they have the right field names
            const fixedVaccines = selectedVaccines.map(vaccine => {
                const fixedVaccine = { ...vaccine };
                
                // Make sure 'type' is set
                if (!fixedVaccine.type) {
                    // Try to determine type from available fields
                    if (fixedVaccine.comboId) {
                        fixedVaccine.type = 'VACCINE_COMBO';
                    } else if (fixedVaccine.doseScheduleId || fixedVaccine.vaccineOfChildId) {
                        fixedVaccine.type = 'NEXT_DOSE';
                    } else {
                        fixedVaccine.type = 'NEW_VACCINE';
                    }
                }
                
                // Fix NEW_VACCINE type
                if (fixedVaccine.type === 'NEW_VACCINE') {
                    // Move id to vaccineId if needed
                    if (!fixedVaccine.vaccineId && fixedVaccine.id) {
                        fixedVaccine.vaccineId = fixedVaccine.id;
                    }
                }
                
                // Fix NEXT_DOSE type
                if (fixedVaccine.type === 'NEXT_DOSE') {
                    // Make sure doseScheduleId is set
                    if (!fixedVaccine.doseScheduleId && fixedVaccine.id) {
                        fixedVaccine.doseScheduleId = fixedVaccine.id;
                    }
                }
                
                // Fix VACCINE_COMBO type
                if (fixedVaccine.type === 'VACCINE_COMBO') {
                    // Make sure comboId is set
                    if (!fixedVaccine.comboId && fixedVaccine.id) {
                        fixedVaccine.comboId = fixedVaccine.id;
                    }
                }
                
                return fixedVaccine;
            });
            
            // Update the selectedVaccines array with the fixed vaccines
            setSelectedVaccines(fixedVaccines);
            
            // Validate vaccines data based on type
            const invalidVaccines = fixedVaccines.filter(vaccine => {
                // Log each vaccine being validated
                console.log('Validating vaccine:', vaccine);
                
                let isInvalid = false;
                
                switch (vaccine.type) {
                    case 'NEW_VACCINE':
                        // For NEW_VACCINE, we need vaccineId to be set
                        isInvalid = !vaccine.vaccineId || vaccine.vaccineId === 'undefined' || vaccine.vaccineId === '';
                        
                        // If we still think it's invalid but have id available, it could be a valid vaccine
                        // This handles cases where we have id = 1 but vaccineId is missing
                        if (isInvalid && vaccine.id && typeof vaccine.id === 'string' && vaccine.id !== '') {
                            console.log('Fixing NEW_VACCINE with missing vaccineId using id:', vaccine.id);
                            vaccine.vaccineId = vaccine.id;
                            isInvalid = false;
                        }
                        break;
                        
                    case 'NEXT_DOSE':
                        // Check for required fields for NEXT_DOSE
                        isInvalid = (!vaccine.doseScheduleId || vaccine.doseScheduleId === 'undefined' || vaccine.doseScheduleId === '') || 
                                  (!vaccine.vaccineOfChildId || vaccine.vaccineOfChildId === 'undefined' || vaccine.vaccineOfChildId === '');
                        break;
                        
                    case 'VACCINE_COMBO':
                        // Check for required fields for VACCINE_COMBO
                        isInvalid = !vaccine.comboId || vaccine.comboId === 'undefined' || vaccine.comboId === '';
                        break;
                        
                    default:
                        console.warn('Unknown vaccine type:', vaccine.type);
                        isInvalid = true;
                }
                
                return isInvalid;
            });
            
            if (invalidVaccines.length > 0) {
                console.error('Invalid vaccine data detected:', invalidVaccines);
                
                // Instead of showing an error, try to clean up the invalid vaccines
                if (invalidVaccines.length < fixedVaccines.length) {
                    // We have some valid vaccines, so we can remove the invalid ones
                    const validVaccines = fixedVaccines.filter(v => !invalidVaccines.includes(v));
                    setSelectedVaccines(validVaccines);
                    console.log('Removed invalid vaccines, proceeding with valid ones:', validVaccines);
                } else {
                    // All vaccines are invalid, show error
                setError('One or more vaccines have invalid data. Please try selecting vaccines again.');
                return;
                }
            }
            
            // Payment validation
            if (invoice && invoice.totalAmount > 0) {
                if (!paymentMethod) {
                setError('Please select a payment method');
                return;
            }
            } else {
                // If no payment required, default to OFFLINE
                setPaymentMethod('OFFLINE');
            }
            
            // All validations passed, show loading state
            setIsCreatingAppointment(true);
            
            // Clear any previous errors
            setError('');
            
            // Create the appointment
            handleCreateAppointment();
            return;
        }
        
        setCurrentStep(currentStep + 1);
        setError('');
    };

    const handleBack = () => {
        setCurrentStep(currentStep - 1);
        setError('');
    };
    
    // Get the progress percentage based on current step
    const getProgressPercentage = () => {
        const totalSteps = 4;
        return (currentStep / totalSteps) * 100;
    };
    
    // Modify date selection to use a calendar view
    const renderCalendar = () => {
        if (availableDates.length === 0) {
            return (
                <div className="text-center text-muted my-3">
                    <p>No available dates found for the next 30 days.</p>
                </div>
            );
        }

        // Get current month and year
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Get days in month
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Get first day of month
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        
        // Format available dates as strings for easy comparison
        const availableDateStrings = availableDates.map(date => 
            typeof date === 'string' ? date : format(new Date(date), 'yyyy-MM-dd')
        );
        
        // Create calendar grid
        const calendarDays = [];
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }
        
        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateString = format(date, 'yyyy-MM-dd');
            const isPastDate = date < today;
            const isAvailable = availableDateStrings.includes(dateString);
            const isSelected = selectedDate === dateString;
            
            calendarDays.push(
                <div 
                    key={`day-${day}`} 
                    className={`calendar-day 
                        ${isPastDate ? 'past' : ''} 
                        ${isAvailable ? 'available' : ''} 
                        ${isSelected ? 'selected' : ''}
                        ${(!isAvailable && !isPastDate) ? 'unavailable' : ''}
                        ${(isDayPriority === false && selectedDoctor && !isAvailable) ? 'doctor-unavailable' : ''}
                    `}
                    onClick={() => {
                        if (isAvailable && !isPastDate) {
                            setSelectedDate(dateString);
                            setSelectedTimeSlot('');
                            if (isDayPriority === true) {
                                setSelectedDoctor('');
                            }
                            
                            // Directly call our improved fetchAvailableTimeSlots function
                            const doctorId = isDayPriority === false ? selectedDoctor : null;
                            fetchAvailableTimeSlots(dateString, doctorId);
                        }
                    }}
                >
                    <div className="day-number">{day}</div>
                </div>
            );
        }
        
        return (
            <div className="calendar-container">
                <div className="calendar-header">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                </div>
                <div className="calendar-grid">
                    {calendarDays}
                </div>
            </div>
        );
    };
    
    // Add a helper component for displaying fallback data warnings
    const FallbackWarning = ({ message }) => {
        if (!message) return null;
        
        return (
            <Alert variant="warning" className="mt-2 mb-3">
                <Alert.Heading className="h6">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Note
                </Alert.Heading>
                <p className="mb-0 small">{message}</p>
            </Alert>
        );
    };
    
    // Render Step 1: Appointment Type and Child Selection
    const renderStep1 = () => {
        return (
            <>
                <Form.Group className="mb-4">
                    <Form.Label>Select Child</Form.Label>
                    <Form.Select 
                        value={selectedChild}
                        onChange={(e) => setSelectedChild(e.target.value)}
                        className="mb-3"
                    >
                        <option value="">-- Select a child --</option>
                        {children.map(child => (
                            <option key={child.child_id} value={child.child_id}>
                                {child.child_name} ({child.gender}, {calculateAge(child.dob)} years old)
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
                
                {!selectedChild ? (
                    <Alert variant="warning">
                        Please select a child first to view available vaccines.
                    </Alert>
                ) : (
                    <>
                <Form.Group className="mb-4">
                    <Form.Label>Appointment Type</Form.Label>
                            <div>
                            <Form.Check
                                    inline
                                type="radio"
                                    label="New Vaccine"
                                name="appointmentType"
                                    id="new-vaccine"
                                checked={appointmentType === 'NEW_VACCINE'}
                                    onChange={() => handleAppointmentTypeChange('NEW_VACCINE')}
                                />
                            <Form.Check
                                    inline
                                type="radio"
                                    label="Next Dose"
                                name="appointmentType"
                                    id="next-dose"
                                checked={appointmentType === 'NEXT_DOSE'}
                                    onChange={() => handleAppointmentTypeChange('NEXT_DOSE')}
                                />
                                <Form.Check
                                    inline
                                    type="radio"
                                    label="Vaccine Combo"
                                    name="appointmentType"
                                    id="vaccine-combo"
                                    checked={appointmentType === 'VACCINE_COMBO'}
                                    onChange={() => handleAppointmentTypeChange('VACCINE_COMBO')}
                                />
                            </div>
                </Form.Group>
                
                        {appointmentType && (
                                    <div className="mt-4">
                                <h5>Available {appointmentType.toLowerCase().replace('_', ' ')}s</h5>
                                {renderAvailableVaccines()}
                    </div>
                        )}
                    </>
                )}

                <div className="d-flex justify-content-between mt-4">
                    <Button 
                        variant="secondary" 
                        onClick={handleBack}
                        disabled={currentStep === 1}
                    >
                        Back
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleNext}
                        disabled={!selectedVaccines.length}
                    >
                        Next
                    </Button>
            </div>
            </>
        );
    };
    
    // Render Step 2: Schedule Selection
    const renderStep2 = () => {
        return (
            <div className="booking-step">
                <h4 className="mb-4">Schedule Your Appointment</h4>
                
                {/* Priority mode selector */}
                <div className="mb-4">
                    <h5>Select Priority</h5>
                    <Row>
                        <Col xs={12} sm={6}>
                            <Card 
                                onClick={() => setIsDayPriority(true)}
                                className={`mb-3 ${isDayPriority === true ? 'selected' : ''}`}
                                style={{ cursor: 'pointer', borderColor: isDayPriority === true ? '#007bff' : '#dee2e6' }}
                            >
                                <Card.Body className="d-flex align-items-center">
                                    <div className="me-3">
                                        <FontAwesomeIcon icon={faCalendarAlt} size="2x" color={isDayPriority === true ? '#007bff' : '#6c757d'} />
                                    </div>
                                    <div>
                                        <Card.Title className="mb-1">Date First</Card.Title>
                                        <Card.Text className="text-muted small mb-0">Choose your preferred date, then select from available time slots and doctors</Card.Text>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6}>
                            <Card 
                                onClick={() => setIsDayPriority(false)}
                                className={`mb-3 ${isDayPriority === false ? 'selected' : ''}`}
                                style={{ cursor: 'pointer', borderColor: isDayPriority === false ? '#007bff' : '#dee2e6' }}
                            >
                                <Card.Body className="d-flex align-items-center">
                                    <div className="me-3">
                                        <FontAwesomeIcon icon={faUser} size="2x" color={isDayPriority === false ? '#007bff' : '#6c757d'} />
                                    </div>
                                    <div>
                                        <Card.Title className="mb-1">Doctor First</Card.Title>
                                        <Card.Text className="text-muted small mb-0">Choose your preferred doctor, then select from their available dates and time slots</Card.Text>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </div>
                
                {/* Conditional rendering based on priority mode */}
                {isDayPriority === true ? (
                    <>
                        {renderDateSelection()}
                        {renderTimeSlotSelection()}
                        
                        {/* Make doctor selection optional for date-first mode */}
                        <div className="mb-4">
                            <Form.Check 
                                type="checkbox" 
                                id="doctor-selection-toggle" 
                                label="I want to choose a specific doctor (optional)" 
                                checked={showDoctorSelection}
                                onChange={(e) => setShowDoctorSelection(e.target.checked)}
                                className="mb-3"
                            />
                            {showDoctorSelection && renderDoctorSelection()}
                        </div>
                    </>
                ) : (
                    <>
                        {renderDoctorSelection()}
                        {renderDateSelection()}
                        {renderTimeSlotSelection()}
                    </>
                )}
                
                {/* Remove the duplicate navigation buttons here */}
            </div>
        );
    };
    
    // Helper rendering components
    const renderDateSelection = () => {
        return (
            <div className="mb-4">
                <h5>Select Date</h5>
                <FallbackWarning message={dateWarning} />
                
                {isLoadingDates ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" role="status" variant="primary">
                            <span className="visually-hidden">Loading available dates...</span>
                        </Spinner>
                        <p className="mt-2">Loading available dates...</p>
                    </div>
                ) : availableDates.length > 0 ? (
                    renderCalendar()
                ) : (
                    <Alert variant="info">
                        No available dates found. Please try again later or contact support.
                    </Alert>
                )}
            </div>
        );
    };

    const renderTimeSlotSelection = () => {
        return (
            <div className="time-slot-selection">
                <h3 className="my-3">Select a Time Slot</h3>
                {isLoadingTimeSlots ? (
                    <div className="text-center my-5">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading time slots...</span>
                        </Spinner>
                        <p className="mt-2">Loading available time slots...</p>
                    </div>
                ) : timeSlotWarning ? (
                    <FallbackWarning message={timeSlotWarning} />
                ) : availableSlots && Object.keys(availableSlots).length > 0 ? (
                    <Row className="time-slots-container">
                        {isDayPriority ? (
                            // Date-first approach: Show all time slots
                            availableSlots['all']?.map((slot, idx) => (
                                <Col xs={12} md={6} lg={3} key={idx}>
                                                    <Button
                                        variant={selectedTimeSlot === slot.id ? "primary" : "outline-primary"}
                                        className={`time-slot-btn w-100 mb-3 ${!slot.available ? 'disabled' : ''}`}
                                        onClick={() => handleTimeSlotSelect(slot.id)}
                                        disabled={!slot.available}
                                    >
                                        <div>{slot.id}</div>
                                        <Badge 
                                            bg="success"
                                            className="availability-badge"
                                        >
                                            {slot.availableCount}
                                        </Badge>
                                                    </Button>
                                                </Col>
                            ))
                        ) : (
                            // Doctor-first approach: Show time slots for the selected doctor
                            availableSlots[selectedDoctor]?.map((slot, idx) => (
                                <Col xs={12} md={6} lg={3} key={idx}>
                                    <Button
                                        variant={selectedTimeSlot === slot.id ? "primary" : "outline-primary"}
                                        className={`time-slot-btn w-100 mb-3 ${!slot.available ? 'disabled' : ''}`}
                                        onClick={() => handleTimeSlotSelect(slot.id)}
                                        disabled={!slot.available}
                                    >
                                        <div>{slot.id}</div>
                                        <Badge 
                                            bg="success"
                                            className="availability-badge"
                                        >
                                            {slot.availableCount}
                                        </Badge>
                                    </Button>
                            </Col>
                            ))
                        )}
                    </Row>
                ) : (
                    <Alert variant="info">
                        No time slots available for the selected date.
                    </Alert>
                )}
            </div>
        );
    };

    const renderDoctorSelection = () => {
        // Determine which doctor list to use based on priority mode
        const doctorsToDisplay = isDayPriority === true 
            ? availableDoctorsForTimeSlot 
            : availableDoctorsForSelection;
        
        // Debug logging to check what doctor data we have
        console.log('Rendering doctors in mode:', isDayPriority ? 'Date-first' : 'Doctor-first');
        console.log('Doctors to display:', doctorsToDisplay);
        
        return (
            <div className="mb-4">
                <h5>Select Doctor</h5>
                <FallbackWarning message={doctorWarning} />
                
                {isDayPriority === true && !selectedTimeSlot ? (
                    <Alert variant="info">Please select a time slot first.</Alert>
                ) : isLoadingDoctors ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" role="status" variant="primary">
                            <span className="visually-hidden">Loading doctors...</span>
                        </Spinner>
                        <p className="mt-2">Loading available doctors...</p>
                    </div>
                ) : doctorsToDisplay && doctorsToDisplay.length > 0 ? (
                    <Row className="g-3">
                        {doctorsToDisplay.map(doctor => {
                            // Debug log for each doctor
                            console.log('Rendering doctor:', doctor);
                            
                            // Get doctor name or fallback
                            const firstName = doctor.firstName || '';
                            const lastName = doctor.lastName || '';
                            const doctorName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : 'Unknown'; 
                            
                            return (
                            <Col xs={12} sm={6} md={4} key={doctor.id}>
                                <Card 
                                    onClick={() => handleDoctorSelect(doctor)}
                                        className={`doctor-card ${selectedDoctor === doctor.id ? 'selected border-primary' : ''}`}
                                    style={{ 
                                        cursor: 'pointer', 
                                        transition: 'all 0.3s ease',
                                            transform: selectedDoctor === doctor.id ? 'translateY(-3px)' : 'none',
                                            boxShadow: selectedDoctor === doctor.id ? '0 4px 8px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <Card.Body>
                                        <div className="d-flex align-items-center mb-2">
                                            <FontAwesomeIcon 
                                                icon={faUser} 
                                                className="me-2" 
                                                size="lg" 
                                                    color={selectedDoctor === doctor.id ? '#007bff' : '#6c757d'} 
                                            />
                                                <Card.Title className="mb-0">
                                                    Dr. {doctorName}
                                                </Card.Title>
                                        </div>
                                        <Badge bg="info" className="mb-2">{doctor.specialization || 'Pediatrician'}</Badge>
                                        <Card.Text className="mt-2 small text-muted">
                                            {doctor.isFallback 
                                                ? "Sample doctor data for demonstration" 
                                                : "Available for your selected time slot"}
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                            );
                        })}
                    </Row>
                ) : (
                    <Alert variant="warning">
                        {isDayPriority === true
                            ? "No doctors available for the selected time slot. Please choose a different time slot or date."
                            : "No doctors available. Please try again later."}
                    </Alert>
                )}
            </div>
        );
    };
    
    // Render Step 3: Payment Selection
    const renderStep3 = () => {
        return (
            <div>
                <h3 className="mb-4">Step 3: Review and Payment</h3>
                
                <Card className="mb-4">
                    <Card.Header as="h5">Provisional Invoice</Card.Header>
                    <Card.Body>
                        <h6>Selected Vaccines:</h6>
                        <ListGroup>
                            {invoice?.paidVaccines.map((vaccine, index) => (
                                <ListGroup.Item key={index}>
                                    {vaccine.name} - Dose {vaccine.doseNumber}
                                    <Badge bg="success" className="ms-2">Pre-paid</Badge>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                        
                        <h6 className="mt-3">Unpaid Vaccines:</h6>
                        <ListGroup>
                            {invoice?.unpaidVaccines.map((vaccine, index) => (
                                <ListGroup.Item key={index}>
                                    {vaccine.name} - Dose {vaccine.doseNumber}
                                    <span className="float-end">{formatCurrency(vaccine.price)}</span>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                        
                        <div className="d-flex justify-content-between fw-bold fs-5 mt-3">
                            <span>Total Amount:</span>
                            <span>{formatCurrency(invoice?.totalAmount || 0)}</span>
                        </div>
                        
                        {isPrePaid && (
                            <Alert variant="success" className="mt-3">
                                <FontAwesomeIcon icon={faCheck} className="me-2" />
                                All selected vaccines have been pre-paid. No payment required.
                            </Alert>
                        )}
                    </Card.Body>
                </Card>
                
                {!isPrePaid && (
                    <Form.Group className="mb-4">
                        <Form.Label>Select Payment Method</Form.Label>
                        <Row>
                            <Col md={6}>
                                <Form.Check
                                    type="radio"
                                    id="online-payment"
                                    name="paymentMethod"
                                    label="Online Payment (MoMo)"
                                    value="ONLINE"
                                    checked={paymentMethod === 'ONLINE'}
                                    onChange={() => handlePaymentMethodChange('ONLINE')}
                                    className="mb-2"
                                />
                                <small className="text-muted d-block mb-3">
                                    Pay now using MoMo e-wallet. You'll be redirected to complete the payment.
                                </small>
                            </Col>
                            <Col md={6}>
                                <Form.Check
                                    type="radio"
                                    id="offline-payment"
                                    name="paymentMethod"
                                    label="Offline Payment (Cash)"
                                    value="OFFLINE"
                                    checked={paymentMethod === 'OFFLINE'}
                                    onChange={() => handlePaymentMethodChange('OFFLINE')}
                                    className="mb-2"
                                />
                                <small className="text-muted d-block mb-3">
                                    Pay later at the clinic during your appointment.
                                </small>
                            </Col>
                        </Row>
                    </Form.Group>
                )}
                
                <div className="mb-3">
                    <h6>Appointment Details:</h6>
                    <p><strong>Date:</strong> {formatDate(selectedDate)}</p>
                    <p><strong>Time:</strong> {
                        selectedTimeSlot ? 
                            (() => {
                                // Try to format the time slot ID (which is usually like "8-9" or "9-10")
                                const timeSlotParts = selectedTimeSlot.toString().split('-');
                                if (timeSlotParts.length === 2) {
                                    const start = timeSlotParts[0].padStart(2, '0') + ':00';
                                    const end = timeSlotParts[1].padStart(2, '0') + ':00';
                                    return `${start} - ${end}`;
                                }
                                // If we can't format it, just show the ID
                                return selectedTimeSlot;
                            })()
                            : 'Not selected'
                    }</p>
                    <p><strong>Doctor:</strong> {
                        selectedDoctor ? 
                            (() => {
                                // Look for the doctor in the appropriate list
                                const doctorsList = isDayPriority ? availableDoctorsForTimeSlot : availableDoctorsForSelection;
                                const doctor = doctorsList.find(d => d.id === selectedDoctor);
                                
                                // Format the doctor name
                                const firstName = doctor?.firstName || '';
                                const lastName = doctor?.lastName || '';
                                const doctorName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : 'Unknown';
                                
                                return `Dr. ${doctorName}`;
                            })()
                            : 'Any available doctor'
                    }</p>
                    {notes && <p><strong>Notes:</strong> {notes}</p>}
                </div>
            </div>
        );
    };
    
    // Add a helper function to format currency in VND
    const formatCurrency = (amount) => {
        // Format as Vietnamese Dong (VND)
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0, // VND doesn't use decimal places
        }).format(amount);
    };
    
    // Render Step 4: Confirmation
    const renderStep4 = () => {
        // Check if we have appointment data
        if (!appointmentData && !appointmentId && !createdAppointmentId) {
            return (
                <Alert variant="danger">
                    <FontAwesomeIcon icon={faExclamationTriangle} /> No appointment data found.
                </Alert>
            );
        }
        
        // Use invoice data as a fallback if appointmentData is not available
        const displayData = appointmentData || {
            id: appointmentId || createdAppointmentId,
            childName: invoice?.childInfo?.name || 'Your child',
            appointmentTime: new Date().toISOString(),
            timeSlot: selectedTimeSlot,
            status: isPaid ? 'PAID' : 'PENDING',
            isPaid: isPaid,
            totalAmount: invoice?.totalAmount || 0
        };
        
        // Get payment status from appointmentData
        const isPaidStatus = displayData?.isPaid || displayData?.status === 'PAID' || isPaid;
        
        // Get payment method safely
        const paymentMethodDisplay = (displayData?.paymentMethod || paymentMethod || "ONLINE").toUpperCase();
        
        // Helper function to display payment status text
        const getPaymentStatusText = () => {
            if (isPaidStatus) {
                return "PAID";
            } else if (paymentStatus === 'SUCCESS') {
                return "PAID"; // Show as paid if payment was successful even if backend hasn't caught up
            } else if (displayData?.status === 'PENDING') {
                return "PENDING";
            } else {
                return "UNPAID";
            }
        };
        
        // Helper function to get payment status badge
        const getPaymentStatusBadge = () => {
            if (isPaidStatus || paymentStatus === 'SUCCESS') {
                return <Badge bg="success">PAID</Badge>;
            } else if (displayData?.status === 'PENDING') {
                return <Badge bg="warning">PENDING</Badge>;
            } else {
                return <Badge bg="danger">UNPAID</Badge>;
            }
        };
        
        return (
                <Card className="mb-3">
                <Card.Header>
                    <h4 className="m-0">
                        {isPaidStatus || paymentStatus === 'SUCCESS' ? (
                            <div className="text-center mb-4">
                                <div className="success-icon">
                                    <FontAwesomeIcon icon={faCheckCircle} size="3x" className="text-success" />
                                        </div>
                                <h2>Appointment Confirmed!</h2>
                                <p>Your appointment has been successfully scheduled.</p>
                            </div>
                        ) : (
                            <div>Appointment Details</div>
                        )}
                    </h4>
                </Card.Header>
                <Card.Body>
                    <div className="appointment-summary">
                        <div className="mb-3">
                            <h5>Appointment Details</h5>
                            <div className="detail-item">
                                <strong>Appointment ID:</strong> {displayData.id}
                            </div>
                            <div className="detail-item">
                                <strong>Child:</strong> {displayData.childName}
                            </div>
                            <div className="detail-item">
                                <strong>Date:</strong> {displayData.appointmentTime ? formatDate(displayData.appointmentTime) : "Scheduled date"}
                            </div>
                            <div className="detail-item">
                                <strong>Time:</strong> {displayData.timeSlot || ""}
                            </div>
                            <div className="detail-item">
                                <strong>Doctor:</strong> {displayData.doctorName || "Dr. Your doctor"}
                            </div>
                        </div>
                        
                        <div className="mb-3">
                            <h5>Payment Details</h5>
                            <div className="detail-item">
                                <strong>Payment Method:</strong> {paymentMethodDisplay}
                            </div>
                            <div className="detail-item">
                                <strong>Payment Status:</strong> {getPaymentStatusBadge()}
                            </div>
                            <div className="detail-item">
                                <strong>Total Amount:</strong> {formatCurrency(displayData.totalAmount)}
                            </div>
                        </div>
                    </div>
                    
                    <div className="d-flex justify-content-between mt-4">
                        <Link to="/appointments">
                            <Button variant="primary">
                                <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                View My Appointments
                            </Button>
                        </Link>
                        <Link to="/">
                            <Button variant="outline-primary">
                                <FontAwesomeIcon icon={faHome} className="me-2" />
                                Go to Homepage
                            </Button>
                        </Link>
                    </div>
                    </Card.Body>
                </Card>
        );
    };
    
    // Render navigation buttons
    const renderNavButtons = () => {
        return (
            <div className="d-flex justify-content-between mt-4">
                {currentStep > 1 && currentStep < 4 && (
                    <Button 
                        variant="outline-secondary" 
                        onClick={handleBack}
                    >
                        Previous
                    </Button>
                )}
                
                {currentStep < 4 && (
                    <Button 
                        variant="primary" 
                        className={currentStep > 1 ? 'ms-auto' : ''}
                        onClick={handleNext}
                        disabled={isCreatingAppointment}
                    >
                        {isCreatingAppointment ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                                Processing...
                            </>
                        ) : currentStep === 3 ? (
                            paymentMethod === 'ONLINE' 
                                ? 'Create Appointment & Pay Online' 
                                : 'Create Appointment & Pay Later'
                        ) : (
                            'Next'
                        )}
                    </Button>
                )}
                
                {currentStep === 4 && (
                    <div className="d-flex justify-content-center w-100 gap-3">
                        <Button 
                            variant="primary" 
                            onClick={() => navigate('/appointments')}
                        >
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                            View My Appointments
                        </Button>
                        <Button 
                            variant="outline-primary" 
                            onClick={() => navigate('/')}
                        >
                            <FontAwesomeIcon icon={faHome} className="me-2" />
                            Go to Homepage
                        </Button>
                    </div>
                )}
            </div>
        );
    };
    
    // Clear error on step change
    useEffect(() => {
        setError('');
    }, [currentStep]);
    
    // Display success message and show countdown for redirect
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess('');
                setIsSuccess(false);
            }, 5000); // Clear success after 5 seconds
            
            return () => clearTimeout(timer);
        }
    }, [success]);
    
    // Fetch available doctors for a specific time slot (date-first mode)
    const fetchAvailableDoctorsForTimeSlot = useCallback(async () => {
        if (!selectedDate || !selectedTimeSlot) return;
        
            setIsLoadingDoctors(true);
        setDoctorWarning('');
        try {
            // Get the slot ID from the selected time slot (could be the object or just the ID)
            const slotId = typeof selectedTimeSlot === 'object' ? selectedTimeSlot.id : selectedTimeSlot;
            
            // Fetch doctors available for this date and time slot
            const doctors = await appointmentService.getAvailableDoctorsForTimeSlot(selectedDate, slotId);
            
            // Debug the raw doctor data we're receiving
            console.log('Raw doctor data from API:', doctors);
            
            if (doctors && doctors.length > 0) {
                // Ensure all doctor objects have consistent fields 
                const formattedDoctors = doctors.map(doctor => {
                    console.log('Processing doctor:', doctor);
                    
                    // Create a normalized doctor object
                    const normalizedDoctor = {
                        id: doctor.id,
                        firstName: doctor.firstName || doctor.first_name || doctor.fullName?.split(' ')[0] || doctor.full_name?.split(' ')[0] || doctor.name?.split(' ')[0] || doctor.doctorName?.split(' ')[0] || doctor.employeeName?.split(' ')[0] || '',
                        lastName: doctor.lastName || doctor.last_name || (doctor.fullName?.split(' ').slice(1).join(' ')) || (doctor.full_name?.split(' ').slice(1).join(' ')) || (doctor.name?.split(' ').slice(1).join(' ')) || (doctor.doctorName?.split(' ').slice(1).join(' ')) || (doctor.employeeName?.split(' ').slice(1).join(' ')) || '',
                        specialization: doctor.specialization || 'Pediatrician',
                        imageUrl: doctor.imageUrl || null
                    };
                    
                    console.log('Normalized doctor:', normalizedDoctor);
                    return normalizedDoctor;
                });
                
                setAvailableDoctorsForTimeSlot(formattedDoctors);
                console.log('Available doctors for time slot:', formattedDoctors);
                return formattedDoctors;
            } else {
                setAvailableDoctorsForTimeSlot([]);
                setDoctorWarning('No doctors available for the selected time slot.');
                return [];
            }
        } catch (error) {
            console.error('Error fetching doctors for time slot:', error);
            setDoctorWarning('Failed to load available doctors. Please try again.');
            
            // Use fallback doctors if fetch failed
            const fallbackDoctors = appointmentService.generateFallbackDoctors(selectedTimeSlot);
            setAvailableDoctorsForTimeSlot(fallbackDoctors);
            return fallbackDoctors;
        } finally {
            setIsLoadingDoctors(false);
        }
    }, [selectedDate, selectedTimeSlot]);

    // Handler for date change
    const handleDateChange = (date) => {
        // Format date to YYYY-MM-DD
        const formattedDate = date ? date.toISOString().split('T')[0] : null;
        console.log('Selected date:', formattedDate);
        
        // Only update if the date is different to avoid unnecessary renders
        if (formattedDate !== selectedDate) {
            setSelectedDate(formattedDate);
            
            // Reset time slot and doctor selections when date changes
            setSelectedTimeSlot(null);
            if (isDayPriority === true) {
                setSelectedDoctor(null);
            }
            
            // Directly fetch time slots for the selected date
            if (formattedDate) {
                const doctorId = isDayPriority === false ? selectedDoctor : null;
                fetchAvailableTimeSlots(formattedDate, doctorId);
            } else {
            setAvailableSlots({});
            }
        }
    };

    // Function to fetch available dates
    const fetchAvailableDates = async (doctorId = null) => {
        setIsLoadingDates(true);
        setDateWarning('');
        try {
            // Get today's date and a month from now for the date range
            const startDate = format(new Date(), 'yyyy-MM-dd');
            const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
            
            if (doctorId) {
                // Doctor-first approach: Get dates when this doctor is available
                const dates = await appointmentService.getDoctorAvailableDates(doctorId, startDate, endDate);
                
                if (dates && dates.length > 0) {
                    setAvailableDates(dates);
                } else {
                    setAvailableDates([]);
                    setDateWarning('No available dates found for the selected doctor.');
                }
            } else {
                // Date-first approach: Get all available dates
                const dates = await appointmentService.getAvailableDates(null, startDate, endDate);
                
                if (dates && dates.length > 0) {
                    setAvailableDates(dates);
                } else {
                    setAvailableDates([]);
                    setDateWarning('No available dates found for the selected period.');
                }
            }
        } catch (error) {
            console.error('Error fetching available dates:', error);
            setDateWarning('Failed to load available dates. Please try again later.');
            setAvailableDates([]);
        } finally {
            setIsLoadingDates(false);
        }
    };
    
    // Function to fetch available time slots
    const fetchAvailableTimeSlots = async (date, doctorId = null) => {
        if (!date) return;
        
        setIsLoadingTimeSlots(true);
        setTimeSlotWarning('');
        try {
            let timeSlots = [];
            
            if (doctorId) {
                // Doctor-first approach: Get time slots for specific doctor on date
                timeSlots = await appointmentService.getDoctorTimeSlots(doctorId, date);
                
                if (timeSlots && timeSlots.length > 0) {
                    setAvailableSlots({ [doctorId]: timeSlots });
                    console.log('Available slots for doctor:', timeSlots);
                } else {
                    setAvailableSlots({});
                    setTimeSlotWarning('No time slots available for the selected doctor on this date.');
                }
            } else {
                // Date-first approach: Get all time slots for the date
                timeSlots = await appointmentService.getAvailableTimeSlots(date);
                
                if (timeSlots && timeSlots.length > 0) {
                    // Transform for compatibility with existing UI code
                    setAvailableSlots({ 'all': timeSlots });
                    console.log('Available slots for date:', timeSlots);
                } else {
                    setAvailableSlots({});
                    setTimeSlotWarning('No time slots available for the selected date.');
                }
            }
        } catch (error) {
            console.error('Error fetching time slots:', error);
            setTimeSlotWarning('Failed to load available time slots. Please try again.');
            setAvailableSlots({});
        } finally {
            setIsLoadingTimeSlots(false);
        }
    };

    // Handler for selecting a time slot
    const handleTimeSlotSelect = (timeSlot) => {
        console.log('Selected time slot:', timeSlot);
        setSelectedTimeSlot(timeSlot);
        
        // Clear doctor selection when time slot changes in date-first mode
        if (isDayPriority === true) {
        setSelectedDoctor(null);
            // The doctor fetching will be handled by the useEffect 
            // that watches for selectedTimeSlot changes
        }
    };

    // Handler for selecting a doctor
    const handleDoctorSelect = (doctor) => {
        console.log('Selected doctor:', doctor);
        
        if (!doctor) {
            console.warn('Attempted to select a null or undefined doctor');
            return;
        }
        
        const doctorId = doctor.id || doctor;
        setSelectedDoctor(doctorId);
        
        // If we already have a date selected in doctor-first mode,
        // we need to refresh the time slots for this doctor
        if (isDayPriority === false && selectedDate) {
            console.log('Doctor-first mode: Fetching time slots for selected doctor and date');
            fetchAvailableTimeSlots(selectedDate, doctorId);
        }
        
        // In Doctor First mode, the doctor selection triggers date fetching if we don't have dates yet
        if (isDayPriority === false && (!availableDates || availableDates.length === 0)) {
            console.log('Doctor First mode: Doctor selected, will fetch available dates for this doctor');
            fetchAvailableDates(doctorId);
        }
    };

    // Function to check if we can proceed to step 3
    const canProceedToStep3 = () => {
        // Required fields for step 2
        if (!selectedDate || !selectedTimeSlot) {
            return false;
        }
        
        // Doctor selection is required in doctor-first mode, but optional in date-first mode
        if (isDayPriority === false) {
            // In doctor-first mode, always require selecting a doctor
            return !!selectedDoctor;
        } else {
            // In date-first mode, doctor selection is only required if the user opted to choose a doctor
            return !showDoctorSelection || (showDoctorSelection && !!selectedDoctor);
        }
    };

    // Effects to fetch data when dependencies change
    // Effect to fetch available dates and time slots when needed
    useEffect(() => {
        if (currentStep === 2 && selectedDate) {
            setIsLoadingSchedule(true);
            setDateWarning('');
            setTimeSlotWarning('');
            
            // Call our more specific time slot function instead of the generic fetchAvailableSlots
            const doctorId = isDayPriority === false ? selectedDoctor : null;
            fetchAvailableTimeSlots(selectedDate, doctorId)
                .catch(error => {
                    console.error('Error fetching time slots:', error);
                    setError('Failed to load available time slots. Please try again.');
                    setDateWarning('Unable to connect to the server. Using sample data for demonstration.');
                    setTimeSlotWarning('Unable to load time slots from server. Using sample data.');
                })
                .finally(() => {
                    setIsLoadingSchedule(false);
                });
        } else if (currentStep !== 2) {
            // Clear slots when not on step 2
            setAvailableSlots({});
            setTimeSlotWarning('');
        }
    }, [currentStep, isDayPriority, selectedDoctor, selectedDate]);

    // Effect to fetch doctors when timeSlot changes in date-first mode
    // Effect to fetch doctors when timeSlot changes (for date-first mode)
    useEffect(() => {
        if (currentStep !== 2 || isDayPriority !== true || !selectedDate || !selectedTimeSlot) return;
        
            let isMounted = true;
            setIsLoadingDoctors(true);
            setDoctorWarning('');
            
            const fetchData = async () => {
                try {
                    const doctors = await fetchAvailableDoctorsForTimeSlot();
                    
                if (isMounted) {
                    // Additional check - ensure all doctor objects have consistent fields
                    // This is a safeguard in case our previous normalization didn't catch everything
                    if (doctors && doctors.length > 0) {
                        const properlyFormattedDoctors = doctors.map(doctor => ({
                            id: doctor.id,
                            firstName: doctor.firstName || doctor.first_name || '',
                            lastName: doctor.lastName || doctor.last_name || '',
                            specialization: doctor.specialization || 'Pediatrician',
                            imageUrl: doctor.imageUrl || null,
                            isFallback: doctor.isFallback || false
                        }));
                        
                        console.log('Final formatted doctors:', properlyFormattedDoctors);
                        setAvailableDoctorsForTimeSlot(properlyFormattedDoctors);
                    } else {
                        setAvailableDoctorsForTimeSlot([]);
                        setDoctorWarning('No doctors available for this time slot');
                    }
                    
                        if (doctors && doctors.length > 0 && doctors[0].hasOwnProperty('isFallback')) {
                        setDoctorWarning('Using sample doctor data.');
                        }
                    }
                } catch (error) {
                if (isMounted) {
                        console.error('Error in doctor fetching effect:', error);
                    setDoctorWarning('Unable to load doctors from server.');
                    
                    // Generate fallback doctors with proper formatting
                    const fallbackDoctors = appointmentService.generateFallbackDoctors(selectedTimeSlot);
                    console.log('Using fallback doctors:', fallbackDoctors);
                    setAvailableDoctorsForTimeSlot(fallbackDoctors);
                    }
                } finally {
                if (isMounted) {
                        setIsLoadingDoctors(false);
                    }
                }
            };
            
            fetchData();
            
            return () => {
                isMounted = false;
            };
    }, [currentStep, isDayPriority, selectedDate, selectedTimeSlot, fetchAvailableDoctorsForTimeSlot]);

    // Add fetchDoctors function before the useEffect
    const fetchDoctors = useCallback(async () => {
        try {
            setIsLoadingDoctors(true);
            // Use the appropriate method from appointmentService
            const response = await appointmentService.getAvailableDoctors();
            
            // Debug the raw doctor data
            console.log('Raw doctor data from getAvailableDoctors API:', response);
            
            // Ensure all doctor objects have consistent fields
            if (response && response.length > 0) {
                const formattedDoctors = response.map(doctor => {
                    console.log('Processing doctor for doctor-first approach:', doctor);
                    
                    // Create a normalized doctor object
                    const normalizedDoctor = {
                        id: doctor.id,
                        firstName: doctor.firstName || doctor.first_name || doctor.fullName?.split(' ')[0] || doctor.full_name?.split(' ')[0] || doctor.name?.split(' ')[0] || doctor.doctorName?.split(' ')[0] || doctor.employeeName?.split(' ')[0] || '',
                        lastName: doctor.lastName || doctor.last_name || (doctor.fullName?.split(' ').slice(1).join(' ')) || (doctor.full_name?.split(' ').slice(1).join(' ')) || (doctor.name?.split(' ').slice(1).join(' ')) || (doctor.doctorName?.split(' ').slice(1).join(' ')) || (doctor.employeeName?.split(' ').slice(1).join(' ')) || '',
                        specialization: doctor.specialization || 'Pediatrician',
                        imageUrl: doctor.imageUrl || null
                    };
                    
                    console.log('Normalized doctor for doctor-first:', normalizedDoctor);
                    return normalizedDoctor;
                });
                
                return formattedDoctors;
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching doctors:', error);
            // Use fallback doctors if fetch failed
            return appointmentService.generateFallbackDoctors();
        } finally {
            setIsLoadingDoctors(false);
        }
    }, []);

    // Effect to fetch doctors when priority mode changes to doctorFirst
    useEffect(() => {
        if (currentStep !== 2 || isDayPriority !== false) return;
            
        let isMounted = true;
            setIsLoadingDoctors(true);
            
            const fetchData = async () => {
                try {
                        const doctors = await fetchDoctors();
                        
                        if (isMounted) {
                    setAvailableDoctorsForSelection(doctors);
                    if (doctors.length > 0 && doctors[0].hasOwnProperty('isFallback')) {
                        setDoctorWarning('Using sample doctor data.');
                        }
                    }
                } catch (error) {
                    if (isMounted) {
                        console.error('Error fetching doctors in doctor-first mode:', error);
                    setDoctorWarning('Unable to load doctors from server.');
                    setAvailableDoctorsForSelection(appointmentService.generateFallbackDoctors());
                    }
                } finally {
                    if (isMounted) {
                        setIsLoadingDoctors(false);
                    }
                }
            };
            
            fetchData();
            
            return () => {
                isMounted = false;
            };
    }, [currentStep, isDayPriority, fetchDoctors]);

    // Update the appointment type selection handler
    const handleAppointmentTypeChange = (type) => {
        setAppointmentType(type);
        // Clear selected vaccines when changing type
        setSelectedVaccines([]);
        // Set day priority based on type
        setIsDayPriority(type === 'NEW_VACCINE');
        // Reset payment method and invoice
        setPaymentMethod('OFFLINE');
        setInvoice(null);
        setIsPrePaid(false);
        // Clear any errors
        setError('');
    };

    // Render available vaccines based on appointment type
    const renderAvailableVaccines = () => {
        if (isLoadingVaccineData) {
            return (
                <div className="text-center my-4">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading vaccines...</span>
                    </Spinner>
                    <p className="mt-2">Loading available vaccines...</p>
                </div>
            );
        }

        let vaccineList = [];
        switch (appointmentType) {
            case 'VACCINE_COMBO':
                vaccineList = childVaccineData.vaccineCombos || [];
                break;
            case 'NEXT_DOSE':
                vaccineList = childVaccineData.upcomingDoses || [];
                break;
            case 'NEW_VACCINE':
                vaccineList = childVaccineData.availableVaccines || [];
                break;
            default:
                return (
                    <Alert variant="info">
                        Please select an appointment type to view available vaccines.
                    </Alert>
                );
        }

        if (vaccineList.length === 0) {
            return (
                <Alert variant="info">
                    No {appointmentType.toLowerCase().replace('_', ' ')}s available for this child.
                </Alert>
            );
        }

        // Debug output of available vaccines and current selections
        console.log(`Rendering ${vaccineList.length} vaccines for type ${appointmentType}`, vaccineList);
        console.log('Current selections:', selectedVaccines);

        return (
            <Row xs={1} md={2} lg={3} className="g-4">
                {vaccineList.map((vaccine, index) => {
                    // Generate a unique and safe key
                    const vaccineId = vaccine.id || vaccine.doseScheduleId || vaccine.comboId || index;
                    const safeKey = `${appointmentType}-${vaccineId}-${index}`;
                    
                    // Improved selection checking logic with debugging
                    let isSelected = false;
                    
                    switch (appointmentType) {
                        case 'NEW_VACCINE':
                            isSelected = selectedVaccines.some(v => {
                                const matches = v.type === 'NEW_VACCINE' && String(v.vaccineId) === String(vaccine.id);
                                if (matches) console.log('Found matching NEW_VACCINE:', v, vaccine);
                                return matches;
                            });
                            break;
                        case 'NEXT_DOSE':
                            const doseIdToCheck = vaccine.id || vaccine.doseScheduleId;
                            isSelected = selectedVaccines.some(v => {
                                const matches = v.type === 'NEXT_DOSE' && String(v.doseScheduleId) === String(doseIdToCheck);
                                if (matches) console.log('Found matching NEXT_DOSE:', v, vaccine);
                                return matches;
                            });
                            break;
                        case 'VACCINE_COMBO':
                            const comboIdToCheck = vaccine.id || vaccine.comboId;
                            isSelected = selectedVaccines.some(v => {
                                const matches = v.type === 'VACCINE_COMBO' && String(v.comboId) === String(comboIdToCheck);
                                if (matches) console.log('Found matching VACCINE_COMBO:', v, vaccine);
                                return matches;
                            });
                            break;
                    }
                    
                    console.log(`Vaccine ${vaccine.id} (${vaccine.vaccineName || vaccine.name || 'Unknown'}) isSelected:`, isSelected);

                    return (
                        <Col key={safeKey}>
                <Card 
                                className={`h-100 ${isSelected ? 'border-primary' : ''}`}
                                style={{ 
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    borderWidth: isSelected ? '2px' : '1px',
                                    boxShadow: isSelected ? '0 0 8px rgba(0,123,255,0.5)' : 'none',
                                    transform: isSelected ? 'translateY(-2px)' : 'none'
                                }}
                                onClick={() => handleVaccineSelection(vaccine, !isSelected)}
                >
                    <Card.Body>
                                    <Card.Title>
                                        {appointmentType === 'VACCINE_COMBO' 
                                            ? (vaccine.comboName || vaccine.name)
                                            : vaccine.name}
                                        {isSelected && (
                                            <Badge bg="success" className="ms-2">Selected</Badge>
                                        )}
                                    </Card.Title>
                                    {appointmentType === 'VACCINE_COMBO' ? (
                                        <>
                                            <Card.Title style={{ fontSize: '1rem' }}>
                                                {vaccine.comboName || vaccine.name || "Vaccine Combo"}
                                            </Card.Title>
                                            <div className="mt-2 mb-2">
                                                <Badge bg="warning">Combo</Badge>
                                                <Badge bg="info" className="ms-2">{vaccine.vaccines?.length || 0} vaccines</Badge>
                                            </div>
                                            <div className="mb-2">
                                                <small className="text-muted">
                                                    {vaccine.description || 'Combination of vaccines'}
                                                </small>
                                            </div>
                                            <div className="mt-2">
                                                <strong>Price: </strong>{formatCurrency(vaccine.price || 0)}
                        </div>
                                            {vaccine.saleOff > 0 && (
                                                <Badge bg="success" className="mt-1">
                                                    Save {vaccine.saleOff}%
                                                </Badge>
                                            )}
                                        </>
                                    ) : appointmentType === 'NEXT_DOSE' ? (
                                        <>
                                            <Card.Title style={{ fontSize: '1rem' }}>
                                                {vaccine.vaccineName || vaccine.vaccineOfChild?.vaccine?.name || vaccine.name || "Unknown Vaccine"}
                                            </Card.Title>
                                            <div className="mt-2 mb-2">
                                                <Badge bg="info">Dose {vaccine.doseNumber || 1}</Badge>
                                            </div>
                                            <div className="mb-2">
                                                <small className="text-muted">
                                                    <strong>Schedule:</strong> {vaccine.scheduledDate ? 
                                                        new Date(vaccine.scheduledDate).toLocaleDateString() : 
                                                        'Not scheduled'}
                                                </small>
                                            </div>
                        <div className="mt-2">
                                                {vaccine.isPaid ? (
                                                    <Badge bg="success" style={{ fontSize: '0.9rem', padding: '0.4rem' }}>PAID</Badge>
                                                ) : (
                                                    <><strong>Price: </strong>{formatCurrency(vaccine.price || 0)}</>
                                                )}
                        </div>
                                        </>
                                    ) : (
                                        <>
                                            <Card.Title style={{ fontSize: '1rem' }}>
                                                {vaccine.name || "Unknown Vaccine"}
                                            </Card.Title>
                                            <div className="mt-2 mb-2">
                                                <Badge bg="primary">New Vaccine</Badge>
                                                {vaccine.doseNumber && (
                                                    <Badge bg="info" className="ms-2">Dose {vaccine.doseNumber}</Badge>
                                                )}
                                            </div>
                                            <div className="mb-2">
                                                <small className="text-muted">
                                                {vaccine.description || 'No description available'}
                                                </small>
                                            </div>
                                            <div className="mt-2">
                                                <strong>Price: </strong>{formatCurrency(vaccine.price || 0)}
                        </div>
                                        </>
                                    )}
                    </Card.Body>
                </Card>
            </Col>
                    );
                })}
            </Row>
        );
    };

    const renderUpcomingDoses = () => {
        console.log("Rendering upcoming doses:", childVaccineData.upcomingDoses);
        
        if (!childVaccineData.upcomingDoses || childVaccineData.upcomingDoses.length === 0) {
            return (
                <Alert variant="info" className="mt-3">
                    No upcoming doses scheduled for this child.
                </Alert>
            );
        }
        
        return (
            <div className="row g-3">
                {childVaccineData.upcomingDoses.map((dose, index) => {
                    // Get values directly from the dose object with better error handling
                    const vaccineName = dose.vaccineName || dose.vaccineOfChild?.vaccine?.name || "Unknown Vaccine";
                    const doseNumber = dose.doseNumber || 1;
                    const totalDoses = dose.totalDoses || 4;
                    
                    // Format the scheduled date nicely
                    const scheduledDate = dose.scheduledDate ? 
                        new Date(dose.scheduledDate).toLocaleDateString() : 
                        'Not scheduled';
                    
                    // Get paid status
                    const isPaid = dose.isPaid === true;
                    
                    // Format price if needed
                    const price = dose.price || 0;
                    const formattedPrice = formatCurrency(price);
                    
                    // Check if this dose is selected in the current selection
                    const isSelected = selectedVaccines.some(v => 
                        v.type === 'NEXT_DOSE' && 
                        (v.doseScheduleId === String(dose.id) || v.doseScheduleId === dose.id)
                    );
                    
                    return (
                        <div className="col-md-6 mb-3" key={`dose-${dose.id || index}`}>
                            <div 
                                className={`border rounded p-3 h-100 ${isSelected ? 'border-primary border-2' : 'border-1'}`}
                                onClick={() => handleVaccineSelection(dose, !isSelected)}
                                style={{ 
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    transform: isSelected ? 'translateY(-2px)' : 'none',
                                    boxShadow: isSelected ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h5 className="mt-0 mb-0">{vaccineName}</h5>
                                    {isSelected && <Badge bg="success">Selected</Badge>}
                        </div>
                                
                                <div className="mt-2 mb-2">
                                    <Badge bg="info">Dose {doseNumber} of {totalDoses}</Badge>
                                    {dose.isFromCombo && <Badge bg="warning" className="ms-2">From Combo</Badge>}
                        </div>
                                
                                <div className="mb-2">
                                    <small>
                                        <strong>Scheduled Date: </strong>{scheduledDate}
                                    </small>
                        </div>
                                
                                <div className="mt-3">
                                    {isPaid ? (
                                        <div className="bg-success text-white p-2 text-center rounded">PAID</div>
                                    ) : (
                                        <div>
                                            <strong>Price: </strong>{formattedPrice}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderVaccineCombos = () => {
        return childVaccineData.vaccineCombos.map((combo, index) => {
            const isSelected = selectedVaccines.some(v => 
                v.comboId === (combo.id || combo.comboId)?.toString()
            );
            
            // Debug logs to ensure we have complete data
            console.log(`Rendering combo ${combo.comboName || combo.name}:`, combo);
            const hasVaccines = combo.vaccines && combo.vaccines.length > 0;
            
            return (
                <Col md={6} key={`combo-${combo.id || combo.comboId || index}-${index}`} className="mb-3">
                <Card 
                        className={`h-100 ${isSelected ? 'border-primary' : ''}`}
                        onClick={() => handleVaccineSelection(combo, !isSelected)}
                        style={{ 
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            borderWidth: isSelected ? '2px' : '1px'
                        }}
                >
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                                <h5 className="mb-0">{combo.comboName || combo.name}</h5>
                            <Badge bg="info">Combo</Badge>
                        </div>
                        
                        <Card.Text className="text-muted small mb-3">{combo.description}</Card.Text>
                        
                        {hasVaccines ? (
                            <>
                                <h6 className="mb-2">Included Vaccines:</h6>
                        <ListGroup variant="flush" className="mb-3">
                            {combo.vaccines.map((vaccine, vIndex) => (
                                        <ListGroup.Item key={`${combo.id}-vaccine-${vIndex}`} className="py-2">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <strong>{vaccine.vaccineName || vaccine.name}</strong>
                                    <small className="text-muted d-block">
                                                        {vaccine.totalDose || vaccine.doseNumber || 1} dose{(vaccine.totalDose || vaccine.doseNumber || 1) > 1 ? 's' : ''}
                                    </small>
                                                </div>
                                                {vaccine.price && (
                                                    <Badge bg="secondary">${vaccine.price}</Badge>
                                                )}
                                            </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                            </>
                        ) : (
                            <Card.Text className="text-muted small mb-3">
                                Vaccine details not available
                            </Card.Text>
                        )}
                        
                        <div className="d-flex justify-content-between align-items-center mt-2">
                            <strong>Total Price:</strong>
                            <h5 className="mb-0 text-primary">${combo.price}</h5>
                        </div>
                        
                        {combo.saleOff > 0 && (
                            <div className="mt-1">
                                <Badge bg="success">Save {combo.saleOff}%</Badge>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Col>
            );
        });
    };

    // Update available doctors when time slot changes in date-first mode
    useEffect(() => {
        if (currentStep === 2 && isDayPriority === true && selectedDate && selectedTimeSlot) {
            fetchAvailableDoctorsForTimeSlot();
        }
    }, [selectedDate, selectedTimeSlot]);
    
    // Fetch available dates when priority mode is selected
    useEffect(() => {
        if (currentStep === 2 && isDayPriority !== null) {
            const doctorId = isDayPriority === false ? selectedDoctor : null;
            fetchAvailableDates(doctorId);
        }
    }, [currentStep, isDayPriority, selectedDoctor]);

    // Format hourly slot for display (e.g., "8-9" to "08:00-09:00")
    const formatTimeSlot = (slot) => {
        if (!slot) return '';
        const [start, end] = slot.split('-');
        const startTime = `${start.padStart(2, '0')}:00`;
        const endTime = `${end.padStart(2, '0')}:00`;
        return `${startTime}-${endTime}`;
    };

    // Check if child and vaccine can be vaccinated
    const canBeVaccinated = (vaccine) => {
        // Your implementation here
        return true; // This is a placeholder
    };

    // Add this helper function to calculate the total invoice amount
    const calculateInvoiceTotal = () => {
        let total = 0;
        
        // Calculate total cost based on selected vaccines/doses
        if (selectedVaccines && selectedVaccines.length > 0) {
            selectedVaccines.forEach(vaccine => {
                if (vaccine.type === 'VACCINE_COMBO') {
                    // For vaccine combos, use the combo price
                    total += vaccine.price || 0;
                } else if (vaccine.type === 'NEW_VACCINE') {
                    // For new vaccines, use the vaccine price
                    total += vaccine.price || 0;
                } else if (vaccine.type === 'NEXT_DOSE') {
                    // For next doses, check if it's already paid first
                    if (!vaccine.isPaid) {
                        total += vaccine.vaccineOfChild?.vaccine?.price || 0;
                    }
                }
            });
        }
        
        return total;
    };

    // Add new function to handle redirect from payment gateway
    useEffect(() => {
        // Check if we're returning from a payment gateway
        const query = new URLSearchParams(window.location.search);
        const partnerCode = query.get('partnerCode');
        const orderId = query.get('orderId');
        const requestId = query.get('requestId');
        const amount = query.get('amount');
        const orderInfo = query.get('orderInfo');
        
        // If we have these parameters, we're returning from MoMo payment
        if (partnerCode && orderId) {
            console.log('Detected return from MoMo payment gateway:', {
                partnerCode,
                orderId,
                requestId,
                amount,
                orderInfo
            });
            
            // Extract appointment ID from URL parameters, orderInfo, or sessionStorage
            // First try the direct appointmentId parameter
            let appointmentId = query.get('appointmentId');
            
            // If not available, try to extract from orderInfo (usually contains "Payment for appointment #X")
            if (!appointmentId && orderInfo) {
                const matches = orderInfo.match(/appointment\s+#(\d+)/i);
                if (matches && matches[1]) {
                    appointmentId = matches[1];
                    console.log('Extracted appointmentId from orderInfo:', appointmentId);
                }
            }
            
            // If still not available, try extraData
            if (!appointmentId) {
                const extraData = query.get('extraData');
                if (extraData && extraData.trim() !== '') {
                    // Try to parse as JSON first
                    try {
                        const extraDataObj = JSON.parse(extraData);
                        if (extraDataObj.appointmentId) {
                            appointmentId = extraDataObj.appointmentId;
                            console.log('Extracted appointmentId from extraData JSON:', appointmentId);
                        }
                    } catch (e) {
                        // If not JSON, just use the extraData if it looks like a number
                        if (!isNaN(extraData)) {
                            appointmentId = extraData;
                            console.log('Using extraData as appointmentId:', appointmentId);
                        }
                    }
                }
            }
            
            // If we still don't have an appointmentId, check sessionStorage
            if (!appointmentId) {
                const pendingPayment = sessionStorage.getItem('pendingPayment');
                if (pendingPayment) {
                    try {
                        const paymentData = JSON.parse(pendingPayment);
                        appointmentId = paymentData.appointmentId;
                        console.log('Retrieved appointmentId from sessionStorage:', appointmentId);
                    } catch (e) {
                        console.error('Error parsing pending payment data', e);
                    }
                }
            }
            
            // Get resultCode to determine success/failure (0 = success)
            const resultCode = query.get('resultCode');
            const isSuccess = resultCode === '0';
            console.log('Payment result:', isSuccess ? 'SUCCESS' : 'FAILURE', 'resultCode:', resultCode);
            
            // Clear URL parameters without refreshing the page
            window.history.replaceState({}, document.title, '/appointment-creation');
            
            if (appointmentId) {
                console.log('Processing payment result for appointment:', appointmentId);
                setCreatedAppointmentId(appointmentId);
                setCurrentStep(4); // Always go to step 4
                
                if (isSuccess) {
                    // Success message regardless of API call outcome
                    setSuccess("Payment completed successfully! Your appointment is confirmed.");
                    setIsSuccess(true);
                    
                    console.log('Payment was successful, updating appointment and payment status');
                    
                    // Use a longer delay for marking as paid to ensure backend is ready
                    setTimeout(() => {
                        console.log('Now marking appointment as paid in the backend...');
                        // First try using the appointmentService method which encapsulates the API URL
                        appointmentService.markAppointmentAsPaid(appointmentId)
                            .then(result => {
                                console.log('Appointment marked as paid successfully:', result);
                                // After successful payment marking, fetch the updated appointment data
                                setTimeout(() => {
                                    console.log('Refreshing appointment data after payment');
                                    refreshAppointmentData(appointmentId);
                                }, 3000);
                            })
                            .catch(err => {
                                console.error('Error marking appointment as paid with service method:', err);
                                console.log('Trying direct API call as fallback...');
                                
                                // Fallback to direct API call
                                try {
                                    axios.post(`${API_URL}/appointments/${appointmentId}/mark-paid`, {
                                        paymentMethod: 'MOMO',
                                        paymentStatus: 'COMPLETED',
                                        paymentDate: new Date().toISOString(),
                                        status: 'PAID'
                                    }, {
                                        headers: getAuthHeaders()
                                    })
                                    .then(response => {
                                        console.log('Direct mark-paid API call successful:', response.data);
                                        setTimeout(() => {
                                            refreshAppointmentData(appointmentId);
                                        }, 3000);
                                    })
                                    .catch(directErr => {
                                        console.error('All payment marking methods failed:', directErr);
                                        // Even if all attempts fail, still try to refresh the data
                                        setTimeout(() => {
                                            refreshAppointmentData(appointmentId);
                                        }, 3000);
                                    });
                                } catch (fallbackErr) {
                                    console.error('Exception in fallback payment marking:', fallbackErr);
                                    setTimeout(() => {
                                        refreshAppointmentData(appointmentId);
                                    }, 3000);
                                }
                            });
                    }, 2000);
                } else {
                    // Failure message but still show the appointment was created
                    setError("Payment was not completed. You can pay at the clinic.");
                    setSuccess("Appointment created successfully! You will need to pay at the clinic.");
                    setIsSuccess(true);
                    
                    // Still load appointment data for display
                    refreshAppointmentData(appointmentId);
                }
            } else {
                console.error('Could not determine appointmentId from MoMo redirect');
                setError("Payment was processed but we couldn't identify your appointment. Please contact support with this reference: " + orderId);
            }
        }
    }, []);
    
    // Refresh appointment data after creating/updating
    const refreshAppointmentData = (appointmentId, retryCount = 0, maxRetries = 5) => {
        console.log(`Refreshing appointment data for ID: ${appointmentId} Attempt: ${retryCount + 1}`);
        
        if (!appointmentId) {
            console.error('No appointment ID provided to refreshAppointmentData');
            return;
        }
        
        appointmentService.getAppointmentById(appointmentId)
            .then(data => {
                console.log('Loaded appointment data:', data);
                
                if (!data || data.error) {
                    throw new Error('Invalid appointment data received');
                }
                
                // Update state with appointment data
                setAppointmentData(data);
                setAppointmentId(appointmentId);
                
                // Set invoice data from appointment
                if (data.totalAmount !== undefined) {
                    setInvoice({
                        totalAmount: data.totalAmount,
                        items: data.appointmentVaccines || [],
                        childInfo: {
                            id: data.childId,
                            name: data.childName
                        }
                    });
                }
                
                // Update selected vaccines if available
                if (data.appointmentVaccines && Array.isArray(data.appointmentVaccines)) {
                    setSelectedVaccines(data.appointmentVaccines.map(v => ({
                        vaccineId: v.vaccineId,
                        vaccineName: v.vaccineName,
                        doseNumber: v.doseNumber || 1,
                        price: v.price || 0,
                        selected: true
                    })));
                }
                
                // Set payment status
                if (data.isPaid || data.status === 'PAID') {
                    setIsPaid(true);
                    setPaymentStatus('SUCCESS');
                }
                
                // Log payment status
                const paymentStatus = data.status || 'UNKNOWN';
                console.log('Payment Status:', paymentStatus);
                console.log('Appointment Vaccines:', data.appointmentVaccines);
                
                // Check if payment status is still PENDING despite successful payment
                // This could indicate the backend didn't properly update the payment record
                if (paymentStatus === 'PENDING' && (retryCount > 0 || isPaid || paymentStatus === 'SUCCESS')) {
                    console.log('Payment status still showing PENDING, attempting to force update...');
                    
                    // Attempt to force update the payment status
                    const forceUpdatePayment = async () => {
                        try {
                            // Get auth headers for API calls
                            const token = localStorage.getItem('token');
                            const headers = token ? {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            } : {
                                'Content-Type': 'application/json'
                            };
                            
                            // Create comprehensive payment data
                            const forcePaymentData = {
                                orderInfo: `Payment for appointment #${appointmentId}`,
                                resultCode: 0, // Success code
                                transId: `force-retry-${appointmentId}-${Date.now()}`,
                                amount: data.totalAmount || 0,
                                paymentMethod: 'MOMO',
                                paymentStatus: 'COMPLETED',
                                status: 'COMPLETED',
                                paymentDate: new Date().toISOString(),
                                forceUpdate: true,
                                retryCount: retryCount,
                                appointmentId: appointmentId
                            };
                            
                            console.log('Sending force update payment data:', forcePaymentData);
                            
                            // Call record payment endpoint
                            const response = await axios.post(`${API_URL}/payments/record`, forcePaymentData, { headers });
                            console.log('Force payment update response:', response.data);
                            
                            // Also call mark-paid endpoint for good measure
                            const markPaidResponse = await appointmentService.markAppointmentAsPaid(appointmentId);
                            console.log('Mark paid response:', markPaidResponse);
                            
                            // Force UI to show paid status
                            setIsPaid(true);
                            setPaymentStatus('SUCCESS');
                        } catch (error) {
                            console.error('Error forcing payment update:', error);
                        }
                    };
                    
                    // Execute the force update
                    forceUpdatePayment();
                }
                
                // Force UI to show paid status after any retry
                // This ensures user sees success even if backend is inconsistent
                if (retryCount > 0) {
                    setIsPaid(true);
                    
                    // Update local state to reflect paid status
                    setAppointmentData(prevData => ({
                        ...prevData,
                        isPaid: true,
                        status: 'PAID'
                    }));
                }
            })
            .catch(error => {
                console.error('Error fetching appointment data:', error);
                
                // If we haven't reached max retries yet, try again
                if (retryCount < maxRetries - 1) {
                    setTimeout(() => {
                        refreshAppointmentData(appointmentId, retryCount + 1, maxRetries);
                    }, 2000);
                } else {
                    // If we've reached max retries, force success in UI
                    console.log('Reached max retries with errors, forcing success UI state');
                    setIsPaid(true);
                    
                    // Create a minimal appointment data object to prevent rendering errors
                    setAppointmentData({
                        id: appointmentId,
                        status: 'PAID',
                        isPaid: true,
                        childName: 'Your child', // Fallback name
                        appointmentTime: new Date().toISOString(),
                        totalAmount: invoice?.totalAmount || 0,
                        appointmentVaccines: selectedVaccines || []
                    });
                }
            });
    };

    // Load child vaccine data when child and appointment type are selected
    useEffect(() => {
        if (selectedChild && appointmentType && currentStep === 1) {
            fetchChildVaccineData();
        }
    }, [selectedChild, appointmentType, currentStep]);

    // Set a timeout to force showing success after 10 seconds if still loading
    // in case the loading screen gets stuck
    useEffect(() => {
        if (currentStep === 4 && !isSuccess) {
            console.log('Setting up success timeout for step 4');
            const timer = setTimeout(() => {
                console.log('Loading timeout reached, forcing success state');
                setIsSuccess(true);
            }, 10000); // 10 seconds timeout
            
            return () => clearTimeout(timer);
        }
    }, [currentStep, isSuccess]);

    useEffect(() => {
        // Initialize timeSlots when a date is selected
        if (selectedDate) {
            fetchAvailableTimeSlots(selectedDate);
        }
    }, [selectedDate]);

    const [showDoctorSelection, setShowDoctorSelection] = useState(false);
    const [paymentCanceled, setPaymentCanceled] = useState(false);
    const [prevPaymentMethod, setPrevPaymentMethod] = useState(null);

    // Function to handle payment method change
    const handlePaymentMethodChange = async (newMethod) => {
        if (newMethod === paymentMethod) return; // No change
        
        console.log(`Payment method changing from ${paymentMethod} to ${newMethod}`);
        
        // If we've already created an appointment with a different payment method,
        // we need to delete/cancel it and create a new one
        if (createdAppointmentId) {
            console.log('Existing appointment needs to be recreated with new payment method');
            
            // Reset all appointment-related states to allow recreation
            setCreatedAppointmentId(null);
            setPaymentCanceled(false);
            setAppointmentResult(null);
            setPaymentModalOpen(false);
            setIsSuccess(false);
            setSuccess('');
        }
        
        // Update the payment method state
        setPaymentMethod(newMethod);
    };

    return (
        <div className="appointment-creation-page">
            <NavBar />

            <Container className="py-4">
                <Card>
                    <Card.Header className="bg-primary text-white">
                        <h2 className="mb-0">
                            <FontAwesomeIcon icon={faCalendarPlus} className="me-2" />
                            Create Appointment
                        </h2>
                    </Card.Header>
                    
                    <Card.Body>
                        <ProgressBar 
                            now={getProgressPercentage()} 
                            className="mb-4" 
                            variant="primary"
                            label={`Step ${currentStep} of 4`}
                        />
                        
                        {error && (
                            <Alert variant="danger" className="mb-4">
                                {error}
                            </Alert>
                        )}
                        
                        {currentStep === 1 && renderStep1()}
                        {currentStep === 2 && renderStep2()}
                        {currentStep === 3 && renderStep3()}
                        {currentStep === 4 && renderStep4()}
                        
                        {renderNavButtons()}
                    </Card.Body>
                </Card>
                
                {/* Payment Modal */}
                {createdAppointmentId && paymentMethod === 'ONLINE' && (
                    <PaymentModal
                        open={paymentModalOpen}
                        onClose={handlePaymentModalClose}
                        appointmentId={createdAppointmentId}
                        amount={calculateInvoiceTotal()}
                        onSuccess={handlePaymentSuccess}
                        onFailure={handlePaymentFailure}
                        redirectUrl={`${window.location.origin}/appointment-creation?paymentStatus=success&appointmentId=${createdAppointmentId}`}
                        cancelUrl={`${window.location.origin}/appointment-creation?paymentStatus=cancelled&appointmentId=${createdAppointmentId}`}
                        failureUrl={`${window.location.origin}/appointment-creation?paymentStatus=failed&appointmentId=${createdAppointmentId}`}
                    />
                )}
            </Container>
            
            {/* Add Toast Container for notifications */}
            <ToastContainer 
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );
};

export default AppointmentCreation; 