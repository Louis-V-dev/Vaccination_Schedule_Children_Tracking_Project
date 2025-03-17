import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Form, Row, Col, ProgressBar, Alert, Badge, Spinner, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faSpinner, faCheck, faSyringe, faClock, faUser, faCalendarAlt, faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import appointmentService from '../services/appointmentService';
import childService from '../services/ChildService';
import { formatDate } from '../utils/formatUtils';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { format, addDays } from 'date-fns';
import '../assets/css/appointment.css';
import Calendar from 'react-calendar';

const AppointmentCreation = () => {
    // Track the current step in appointment creation process
    const [currentStep, setCurrentStep] = useState(1);
    
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
    
    // Step 3: Payment Selection
    const [paymentMethod, setPaymentMethod] = useState('');
    const [invoice, setInvoice] = useState(null);
    const [isPrePaid, setIsPrePaid] = useState(false);
    
    // Error and success handling
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
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
    
    // Load child vaccine data when child is selected
    useEffect(() => {
        const fetchChildVaccineData = async () => {
            if (!selectedChild || !appointmentType || currentStep !== 1) return;
            
            setIsLoadingVaccineData(true);
            try {
                const response = await appointmentService.getChildVaccineData(selectedChild, appointmentType);
                setChildVaccineData(response);
            } catch (error) {
                setError('Failed to load vaccine data. Please try again.');
                console.error('Error loading child vaccine data:', error);
            } finally {
                setIsLoadingVaccineData(false);
            }
        };
        
        fetchChildVaccineData();
    }, [selectedChild, appointmentType, currentStep]);
    
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
            return sum + (vaccine.isPaid ? 0 : vaccine.price);
        }, 0);
        
        const paidVaccines = selectedVaccines.filter(v => v.isPaid);
        const unpaidVaccines = selectedVaccines.filter(v => !v.isPaid);
        
        setInvoice({
            totalAmount,
            paidVaccines,
            unpaidVaccines
        });
    };
    
    // Handle appointment creation
    const handleCreateAppointment = async () => {
        try {
            const appointmentData = {
                childId: selectedChild,
                isDayPriority,
                appointmentDate: selectedDate,
                timeSlot: selectedTimeSlot,
                doctorId: selectedDoctor,
                vaccines: selectedVaccines.map(v => ({
                    vaccineId: v.vaccineId,
                    vaccineOfChildId: v.vaccineOfChildId,
                    doseScheduleId: v.doseScheduleId,
                    doseNumber: v.doseNumber
                })),
                paymentMethod,
                notes
            };
            
            const response = await appointmentService.createAppointment(appointmentData);
            
            if (response && response.appointmentId) {
                if (paymentMethod === 'ONLINE') {
                    // Redirect to payment page
                    const paymentResponse = await appointmentService.createPayment(response.appointmentId);
                    if (paymentResponse && paymentResponse.paymentUrl) {
                        window.location.href = paymentResponse.paymentUrl;
                    }
                    } else {
                    setSuccess('Appointment created successfully!');
                    // Reset form or redirect to confirmation page
                }
            }
        } catch (error) {
            setError('Failed to create appointment. Please try again.');
            console.error('Error creating appointment:', error);
        }
    };
    
    // Handle vaccine selection based on type (new, existing, or next dose)
    const handleVaccineSelection = (vaccine, type) => {
        let isAlreadySelected;
        switch (type) {
            case 'new':
                isAlreadySelected = selectedVaccines.some(v => v.vaccineId === vaccine.id);
                if (!isAlreadySelected) {
                    setSelectedVaccines([...selectedVaccines, {
                        ...vaccine,
                        vaccineId: vaccine.id,
                        type: 'NEW_VACCINE'
                    }]);
                }
                break;
            
            case 'next':
                isAlreadySelected = selectedVaccines.some(v => v.doseScheduleId === vaccine.id);
                if (!isAlreadySelected) {
                    setSelectedVaccines([...selectedVaccines, {
                        ...vaccine,
                        doseScheduleId: vaccine.id,
                        type: 'NEXT_DOSE'
                    }]);
                }
                break;
            
            case 'combo':
                isAlreadySelected = selectedVaccines.some(v => v.comboId === vaccine.comboId);
                if (!isAlreadySelected) {
                    setSelectedVaccines([...selectedVaccines, {
                        ...vaccine,
                        type: 'VACCINE_COMBO'
                    }]);
                }
                break;
            
            default:
                console.error('Invalid vaccine type:', type);
                return;
        }
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
            if (!selectedDoctor) {
                setError('Please select a doctor');
                return;
            }
            // Calculate invoice before moving to step 3
            calculateInvoice();
        } else if (currentStep === 3) {
            if (invoice && invoice.totalAmount > 0 && !paymentMethod) {
                setError('Please select a payment method');
                return;
            }
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
        if (Object.keys(availableSlots).length === 0) {
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
        
        // Create array of available dates formatted as YYYY-MM-DD
        const availableDateStrings = Object.keys(availableSlots).map(d => d.date);
        
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
            
            // Get doctor count for this date (if in dateFirst mode)
            let doctorCount = 0;
            if (isDayPriority === true && isAvailable) {
                const dateData = Object.entries(availableSlots).find(([key, value]) => key.date === dateString);
                doctorCount = dateData ? (dateData[1].doctorCount || 0) : 0;
            }
            
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
                        }
                    }}
                >
                    <div className="day-number">{day}</div>
                    {isAvailable && isDayPriority === true && (
                        <small className="doctor-count">
                            {doctorCount} {doctorCount === 1 ? 'doctor' : 'doctors'}
                        </small>
                    )}
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
                
                        {!appointmentType && (
                            <Alert variant="info">
                                Please select an appointment type to view available vaccines.
                            </Alert>
                        )}

                        {appointmentType && !childVaccineData && (
                            <div className="text-center">
                                <Spinner animation="border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </Spinner>
                                                </div>
                        )}

                        {childVaccineData && (
                            <div>
                                <Row>
                                    {appointmentType === 'NEW_VACCINE' && childVaccineData.availableVaccines?.length > 0 && renderAvailableVaccines()}
                                    {appointmentType === 'NEXT_DOSE' && childVaccineData.upcomingDoses?.length > 0 && renderUpcomingDoses()}
                                    {appointmentType === 'VACCINE_COMBO' && childVaccineData.vaccineCombos?.length > 0 && renderVaccineCombos()}
                                    
                                    {appointmentType === 'NEW_VACCINE' && (!childVaccineData.availableVaccines || childVaccineData.availableVaccines.length === 0) && (
                                        <Alert variant="info">
                                            No new vaccines available for this child at the moment.
                                        </Alert>
                                    )}
                                    
                                    {appointmentType === 'NEXT_DOSE' && (!childVaccineData.upcomingDoses || childVaccineData.upcomingDoses.length === 0) && (
                                        <Alert variant="info">
                                            No upcoming doses scheduled for this child at the moment.
                                        </Alert>
                                    )}
                                    
                                    {appointmentType === 'VACCINE_COMBO' && (!childVaccineData.vaccineCombos || childVaccineData.vaccineCombos.length === 0) && (
                                        <Alert variant="info">
                                            No vaccine combos available at the moment.
                                        </Alert>
                                    )}
                            </Row>

                                {selectedVaccines.length > 0 && (
                                    <div className="mt-4">
                                        <h5>Selected Vaccines:</h5>
                                        <ListGroup>
                                            {selectedVaccines.map((vaccine, index) => (
                                                <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        {appointmentType === 'NEW_VACCINE' && vaccine.name}
                                                        {appointmentType === 'NEXT_DOSE' && `${vaccine.vaccine.name} (Dose ${vaccine.doseNumber})`}
                                                        {appointmentType === 'VACCINE_COMBO' && vaccine.comboName}
                                                    </div>
                                                    <Button 
                                                        variant="outline-danger" 
                                                        size="sm"
                                                        onClick={() => handleRemoveVaccine(vaccine)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    </div>
                        )}
                    </div>
                        )}
                    </>
                )}

                <div className="mt-4 d-flex justify-content-between">
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
                        {renderDoctorSelection()}
                    </>
                ) : (
                    <>
                        {renderDoctorSelection()}
                        {renderDateSelection()}
                        {renderTimeSlotSelection()}
                    </>
                )}
                
                <div className="d-flex justify-content-between mt-4">
                    <Button variant="outline-secondary" onClick={handleBack}>
                        Back
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleNext}
                        disabled={!canProceedToStep3()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        );
    };
    
    // Helper rendering components
    const renderDateSelection = () => {
        return (
            <div className="mb-4">
                <h5>Select Date</h5>
                <FallbackWarning message={dateWarning} />
                
                {isLoadingSchedule ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" role="status" variant="primary">
                            <span className="visually-hidden">Loading available dates...</span>
                        </Spinner>
                        <p className="mt-2">Loading available dates...</p>
                    </div>
                ) : Object.keys(availableSlots).length > 0 ? (
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
            <div className="mb-4">
                <h5>Select Time</h5>
                
                {!selectedDate ? (
                    <Alert variant="info">Please select a date first.</Alert>
                ) : isLoadingSchedule ? (
                    <div className="text-center py-4">
                        <Spinner animation="border" role="status" variant="primary">
                            <span className="visually-hidden">Loading time slots...</span>
                        </Spinner>
                        <p className="mt-2">Loading available time slots...</p>
                    </div>
                ) : Object.keys(availableSlots).length > 0 ? (
                    <Row className="g-3">
                        {Object.entries(availableSlots).map(([doctorName, slots]) => (
                            <Col xs={12} key={doctorName}>
                                <Card className="mb-3">
                                    <Card.Header>{doctorName}</Card.Header>
                                    <Card.Body>
                                        <Row className="g-2">
                                            {slots.map(slot => (
                                                <Col xs={6} sm={4} md={3} key={slot}>
                                                    <Button
                                                        variant={selectedTimeSlot === slot ? "primary" : "outline-primary"}
                                                        className="w-100 mb-2"
                                                        onClick={() => {
                                                            setSelectedTimeSlot(slot);
                                                            if (isDayPriority) {
                                                                setSelectedDoctor(doctorName);
                                                            }
                                                        }}
                                                    >
                                                        {slot}
                                                    </Button>
                                                </Col>
                                            ))}
                                        </Row>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Alert variant="warning">
                        No time slots available for the selected date. Please choose a different date.
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
                        {doctorsToDisplay.map(doctor => (
                            <Col xs={12} sm={6} md={4} key={doctor.id}>
                                <Card 
                                    onClick={() => handleDoctorSelect(doctor)}
                                    className={`doctor-card ${selectedDoctor?.id === doctor.id ? 'selected border-primary' : ''}`}
                                    style={{ 
                                        cursor: 'pointer', 
                                        transition: 'all 0.3s ease',
                                        transform: selectedDoctor?.id === doctor.id ? 'translateY(-3px)' : 'none',
                                        boxShadow: selectedDoctor?.id === doctor.id ? '0 4px 8px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <Card.Body>
                                        <div className="d-flex align-items-center mb-2">
                                            <FontAwesomeIcon 
                                                icon={faUser} 
                                                className="me-2" 
                                                size="lg" 
                                                color={selectedDoctor?.id === doctor.id ? '#007bff' : '#6c757d'} 
                                            />
                                            <Card.Title className="mb-0">Dr. {doctor.firstName} {doctor.lastName}</Card.Title>
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
                        ))}
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
                                    <span className="float-end">${vaccine.price}</span>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                        
                        <div className="d-flex justify-content-between fw-bold fs-5 mt-3">
                            <span>Total Amount:</span>
                            <span>${invoice?.totalAmount || 0}</span>
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
                                    onChange={(e) => setPaymentMethod(e.target.value)}
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
                                    onChange={(e) => setPaymentMethod(e.target.value)}
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
                        Object.values(availableSlots).find(ts => ts.id === parseInt(selectedTimeSlot))
                            ? `${Object.values(availableSlots).find(ts => ts.id === parseInt(selectedTimeSlot)).startTime} - 
                               ${Object.values(availableSlots).find(ts => ts.id === parseInt(selectedTimeSlot)).endTime}`
                            : 'Not selected'
                    }</p>
                    <p><strong>Doctor:</strong> {
                        selectedDoctor 
                            ? `Dr. ${Object.values(availableSlots).find(d => d.id === selectedDoctor)?.firstName} 
                               ${Object.values(availableSlots).find(d => d.id === selectedDoctor)?.lastName}`
                            : 'Any available doctor'
                    }</p>
                    {notes && <p><strong>Notes:</strong> {notes}</p>}
                </div>
            </div>
        );
    };
    
    // Render Step 4: Confirmation
    const renderStep4 = () => {
        // Calculate child info
        const childInfo = children.find(child => child.child_id === selectedChild) || {};
        
        // Get time slot info
        const selectedTimeSlotInfo = Object.values(availableSlots).find(ts => ts.id === parseInt(selectedTimeSlot)) || {};
        
        // Get doctor info
        const selectedDoctorInfo = isDayPriority === true 
            ? availableDoctorsForTimeSlot.find(d => d.id === selectedDoctor) 
            : availableDoctorsForSelection.find(d => d.id === selectedDoctor) || {};
        
        // Calculate total amount for invoice
        const calculateProvisionalInvoiceTotal = () => {
            let total = 0;
            selectedVaccines.forEach(vaccine => {
                if (!vaccine.isPaid) {
                    total += (vaccine.vaccine.price || 0);
                }
            });
            return total;
        };
        
        return (
            <div className="mt-4">
                <h4 className="mb-3">
                    <FontAwesomeIcon icon={faCheck} className="me-2" />
                    Appointment Summary
                </h4>
                
                <Card className="mb-3">
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <h5 className="mb-3">Patient Information</h5>
                                <p><strong>Child:</strong> {childInfo?.child_name}</p>
                                <p><strong>Age:</strong> {childInfo?.age}</p>
                                <p><strong>Appointment Type:</strong> {isDayPriority === true ? 'New Vaccination' : 'Next Dose'}</p>
                            </Col>
                            <Col md={6}>
                                <h5 className="mb-3">Schedule Information</h5>
                                <p><strong>Date:</strong> {formatDate(selectedDate)}</p>
                                <p><strong>Time:</strong> {selectedTimeSlotInfo?.startTime} - {selectedTimeSlotInfo?.endTime}</p>
                                <p><strong>Doctor:</strong> Dr. {selectedDoctorInfo?.firstName} {selectedDoctorInfo?.lastName}</p>
                            </Col>
                        </Row>
                        
                        <h5 className="mb-3 mt-4">Vaccines</h5>
                        {selectedVaccines.length > 0 ? (
                            <ListGroup>
                                {selectedVaccines.map((vaccine, index) => (
                                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <span className="me-2">{vaccine.vaccine.name}</span>
                                            {isDayPriority === false && (
                                                <Badge bg="info" className="me-2">Dose {vaccine.doseSchedule?.doseNumber}</Badge>
                                            )}
                                            {vaccine.isPaid && <Badge bg="success">Paid</Badge>}
                                        </div>
                                        <span>${vaccine.vaccine.price}</span>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        ) : (
                            <Alert variant="warning">No vaccines selected</Alert>
                        )}
                        
                        <h5 className="mb-3">Payment Information</h5>
                        <p><strong>Payment Method:</strong> {paymentMethod === 'ONLINE' ? 'Online Payment (MoMo)' : 'Offline Payment (at clinic)'}</p>
                        <p><strong>Total Amount:</strong> ${calculateProvisionalInvoiceTotal()}</p>
                        
                        {notes && (
                            <>
                                <h5 className="mb-3 mt-4">Additional Notes</h5>
                                <p>{notes}</p>
                            </>
                        )}
                    </Card.Body>
                </Card>
                
                {/* Error message */}
                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                
                {/* Success message */}
                {success && <Alert variant="success" className="mt-3">{success}</Alert>}
            </div>
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
                            'Create Appointment'
                        ) : (
                            'Next'
                        )}
                    </Button>
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
            }, 5000); // Clear success after 5 seconds
            
            return () => clearTimeout(timer);
        }
    }, [success]);
    
    // Fetch available doctors for a specific time slot (date-first mode)
    const fetchAvailableDoctorsForTimeSlot = useCallback(async () => {
        if (!selectedDate || !selectedTimeSlot) return [];
        
        try {
            setIsLoadingDoctors(true);
            
            console.log(`Fetching doctors available on ${selectedDate} for time slot ${selectedTimeSlot}`);
            const result = await appointmentService.getAvailableDoctorsForTimeSlot(selectedDate, selectedTimeSlot);
            
            console.log('Available doctors for time slot:', result);
            setAvailableDoctorsForTimeSlot(result || []);
            if (result && result.length === 0) {
                setDoctorWarning('No doctors available for the selected time slot.');
            } else {
                setDoctorWarning('');
            }
            return result || [];
        } catch (error) {
            console.error('Error fetching doctors for time slot:', error);
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
            setAvailableSlots({});
            setAvailableDoctorsForTimeSlot([]);
        }
    };

    // Handler for selecting a time slot
    const handleTimeSlotSelect = (timeSlot) => {
        console.log('Selected time slot:', timeSlot);
        setSelectedTimeSlot(timeSlot);
        
        // Clear doctor selection when time slot changes
        setSelectedDoctor(null);
        setAvailableDoctorsForTimeSlot([]);
        
        // We're removing this fetch call to prevent double-fetch
        // The useEffect hook will handle the fetch when selectedTimeSlot changes
        // if (isDayPriority === true) {
        //     fetchAvailableDoctorsForTimeSlot();
        // }
    };

    // Handler for selecting a doctor
    const handleDoctorSelect = (doctor) => {
        console.log('Selected doctor:', doctor);
        
        if (!doctor) {
            console.warn('Attempted to select a null or undefined doctor');
            return;
        }
        
        // In Doctor First mode, the doctor selection triggers date fetching
        if (isDayPriority === false) {
            console.log('Doctor First mode: Doctor selected, will fetch available dates for this doctor');
        }
        
        // Store doctor in state
        setSelectedDoctor(doctor.id || doctor); // Sometimes doctor is the full object, sometimes just the ID
        
        // Add debug info
        console.log(`Doctor selected. Priority mode: ${isDayPriority}, Current step: ${currentStep}`);
        console.log('Current state:', {
            selectedDate,
            selectedTimeSlot,
            selectedDoctor: doctor.id || doctor,
            availableDoctorsForSelection: availableDoctorsForSelection.length, 
            availableDoctorsForTimeSlot: availableDoctorsForTimeSlot.length
        });
    };

    // Function to check if we can proceed to step 3
    const canProceedToStep3 = () => {
        // Required fields for step 2
        return selectedDate && selectedTimeSlot && selectedDoctor;
    };

    // Effects to fetch data when dependencies change
    // Effect to fetch available dates and time slots when needed
    useEffect(() => {
        if (currentStep === 2 || selectedDate) {
            setIsLoadingSchedule(true);
            setDateWarning('');
            setTimeSlotWarning('');
            
            fetchAvailableSlots()
                .then(slots => {
                    setAvailableSlots(slots || {});
                    // If we got fallback data, show a notification
                    if (slots && Object.keys(slots).length > 0 && slots[Object.keys(slots)[0]].isFallback) {
                        setDateWarning('Using sample data while connecting to the server. This is for demonstration purposes only.');
                        setTimeSlotWarning('Using sample time slots. This is for demonstration purposes only.');
                    }
                })
                .catch(error => {
                    console.error('Error fetching slots:', error);
                    setError('Failed to load available time slots. Please try again.');
                    setDateWarning('Unable to connect to the server. Using sample data for demonstration.');
                    setTimeSlotWarning('Unable to load time slots from server. Using sample data.');
                    setAvailableSlots({});
                })
                .finally(() => {
                    setIsLoadingSchedule(false);
                });
        } else {
            // Clear slots when date is cleared
            setAvailableSlots({});
            setTimeSlotWarning('');
        }
    }, [currentStep, isDayPriority, selectedDoctor, selectedDate]);

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
                        setAvailableDoctorsForTimeSlot(doctors || []);
                        if (doctors && doctors.length > 0 && doctors[0].hasOwnProperty('isFallback')) {
                        setDoctorWarning('Using sample doctor data.');
                        }
                    }
                } catch (error) {
                if (isMounted) {
                        console.error('Error in doctor fetching effect:', error);
                    setDoctorWarning('Unable to load doctors from server.');
                    setAvailableDoctorsForTimeSlot(appointmentService.generateFallbackDoctors(selectedTimeSlot));
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
            return response || [];
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
        setIsDayPriority(type === 'NEW_VACCINE');
        setSelectedVaccines([]); // Clear selected vaccines when changing type
    };

    // Add new render functions for different vaccine types
    const renderAvailableVaccines = () => {
        return childVaccineData.availableVaccines.map((vaccine, index) => (
            <Col md={6} key={`new-${vaccine.id}-${index}`} className="mb-3">
                <Card 
                    className={`h-100 ${selectedVaccines.some(v => v.vaccineId === vaccine.id) ? 'border-primary' : ''}`}
                    onClick={() => handleVaccineSelection(vaccine, 'new')}
                    style={{ cursor: 'pointer' }}
                >
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="mb-0">{vaccine.name}</h5>
                            <Badge bg="info">New</Badge>
                        </div>
                        <Card.Text className="text-muted small">{vaccine.description}</Card.Text>
                        <div className="mt-2">
                            <strong>Price: </strong>
                            <span>${vaccine.price}</span>
                        </div>
                        <div className="mt-1">
                            <strong>Doses Required: </strong>
                            <span>{vaccine.dosage || 1}</span>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        ));
    };

    const renderUpcomingDoses = () => {
        return childVaccineData.upcomingDoses.map((dose, index) => (
            <Col md={6} key={`dose-${dose.id}-${index}`} className="mb-3">
                <Card 
                    className={`h-100 ${selectedVaccines.some(v => v.doseScheduleId === dose.id) ? 'border-primary' : ''}`}
                    onClick={() => handleVaccineSelection(dose, 'next')}
                    style={{ cursor: 'pointer' }}
                >
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="mb-0">{dose.vaccine.name}</h5>
                            <Badge bg="warning">Next Dose</Badge>
                        </div>
                        <Card.Text className="text-muted small">
                            Dose {dose.doseNumber} of {dose.totalDoses}
                        </Card.Text>
                        <div className="mt-2">
                            <strong>Due Date: </strong>
                            <span>{formatDate(dose.dueDate)}</span>
                        </div>
                        <div className="mt-1">
                            <strong>Price: </strong>
                            <span>${dose.vaccine.price}</span>
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        ));
    };

    const renderVaccineCombos = () => {
        return childVaccineData.vaccineCombos.map((combo, index) => (
            <Col md={6} key={`combo-${combo.comboId}-${index}`} className="mb-3">
                <Card 
                    className={`h-100 ${selectedVaccines.some(v => v.comboId === combo.comboId) ? 'border-primary' : ''}`}
                    onClick={() => handleVaccineSelection(combo, 'combo')}
                    style={{ cursor: 'pointer' }}
                >
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <h5 className="mb-0">{combo.comboName}</h5>
                            <Badge bg="info">Combo</Badge>
                        </div>
                        
                        <Card.Text className="text-muted small mb-3">{combo.description}</Card.Text>
                        
                        <ListGroup variant="flush" className="mb-3">
                            {combo.vaccines.map((vaccine, vIndex) => (
                                <ListGroup.Item key={vIndex}>
                                    {vaccine.vaccineName}
                                    <small className="text-muted d-block">
                                        {vaccine.totalDose} dose{vaccine.totalDose > 1 ? 's' : ''}
                                    </small>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                        
                        <div className="mt-2">
                            <strong>Total Price: </strong>
                            <span>${combo.price}</span>
                        </div>
                        
                        {combo.saleOff > 0 && (
                            <div className="mt-1">
                                <Badge bg="success">Save {combo.saleOff}%</Badge>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Col>
        ));
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
            </Container>
        </div>
    );
};

export default AppointmentCreation; 