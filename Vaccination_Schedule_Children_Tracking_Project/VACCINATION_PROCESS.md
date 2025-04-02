# Vaccination Process Workflow

This document describes the complete workflow for the vaccination process in the Vaccination Schedule Children Tracking Project. The process involves multiple roles, including:

- **Receptionist**: Handles check-in and assigns doctors
- **Cashier**: Processes payments
- **Doctor**: Conducts health checks and approves vaccinations
- **Nurse**: Administers vaccines
- **Observation Staff**: Monitors patients post-vaccination

## Appointment Statuses

Throughout the process, an appointment can have the following statuses:

- `PENDING`: Initial state when an online appointment is created
- `CONFIRMED`: Appointment is confirmed
- `OFFLINE_PAYMENT`: Appointment created with offline payment option
- `PAID`: Payment completed for pre-paid appointments
- `CHECKED_IN`: Patient has arrived and checked in
- `AWAITING_PAYMENT`: Patient checked in but payment required
- `WITH_DOCTOR`: Patient is being examined by a doctor
- `WITH_NURSE`: Patient is with a nurse for vaccination
- `IN_OBSERVATION`: Post-vaccination observation
- `COMPLETED`: All steps completed
- `CANCELLED`: Appointment was cancelled
- `NO_SHOW`: Patient didn't show up
- `ABSENT`: Patient is absent
- `FAILED`: Appointment failed

## Vaccination Status

An appointment vaccine can have the following statuses:

- `PENDING`: Initial state
- `APPROVED`: Doctor has approved vaccination
- `REJECTED`: Doctor has rejected vaccination
- `VACCINATED`: Vaccination completed

## Complete Workflow

### 1. Receptionist Role

#### 1.1. Check-in Process
- When a patient arrives, the receptionist checks if they have an appointment
- The receptionist verifies the patient's information and checks them in
- If the appointment is already paid, the status changes to `CHECKED_IN`
- If the appointment requires payment, the status changes to `AWAITING_PAYMENT`

#### 1.2. Doctor Assignment
- After check-in or payment, the receptionist assigns the patient to an available doctor
- The appointment status changes to `WITH_DOCTOR`

**Endpoint: `/api/receptionist`**
- `GET /appointments`: View all appointments with filtering options
- `GET /today-appointments`: View today's appointments
- `GET /appointments/{id}`: View specific appointment details
- `POST /check-in/{id}`: Check in a patient
- `POST /assign-to-doctor/{appointmentId}/{doctorId}`: Assign patient to a doctor

### 2. Cashier Role

#### 2.1. Payment Processing
- If the appointment requires payment, the cashier handles it
- The cashier can process cash payments or generate MoMo payment URLs
- After payment, vaccines are processed and the appointment status changes to `CHECKED_IN`

**Endpoint: `/api/cashier`**
- `GET /awaiting-payment`: View all appointments awaiting payment
- `GET /today-awaiting-payment`: View today's appointments awaiting payment
- `GET /appointments/{id}`: View specific appointment details
- `POST /process-cash-payment`: Process a cash payment
- `GET /generate-momo-payment/{id}`: Generate a MoMo payment URL

### 3. Doctor Role

#### 3.1. Health Check
- The doctor examines the patient and creates a health record for each vaccine
- For each vaccine, the doctor decides whether to approve or reject
- If approved, the vaccine status changes to `APPROVED`
- If rejected, the vaccine status changes to `REJECTED`

#### 3.2. Appointment Status Update
- If any vaccines are approved, the appointment status changes to `WITH_NURSE`
- If all vaccines are rejected, the appointment status changes to `COMPLETED`

#### 3.3. Dose Scheduling
- The doctor can reschedule doses if needed

**Endpoint: `/api/doctor/vaccination`**
- `GET /assigned-appointments`: View assigned appointments with filtering options
- `GET /today-appointments`: View today's assigned appointments
- `GET /appointments/{id}`: View specific appointment details
- `POST /create-health-record`: Create a health record and approve/reject vaccination
- `POST /reschedule-dose/{doseScheduleId}`: Reschedule a dose

### 4. Nurse Role

#### 4.1. Vaccine Administration
- The nurse selects approved vaccines for administration
- For each administered vaccine, the nurse creates a vaccination record
- The vaccine status changes to `VACCINATED`
- The associated dose schedule is marked as `COMPLETED`
- The `currentDose` of the `VaccineOfChild` is incremented

#### 4.2. Appointment Status Update
- When all approved vaccines are administered, the appointment status changes to `IN_OBSERVATION`

**Endpoint: `/api/nurse`**
- `GET /pending-vaccinations`: View pending vaccinations with filtering options
- `GET /today-pending-vaccinations`: View today's pending vaccinations
- `GET /appointments/{id}`: View specific appointment details
- `GET /approved-vaccines/{appointmentId}`: View approved vaccines for an appointment
- `POST /record-vaccination`: Record a vaccination

### 5. Observation Staff Role

#### 5.1. Start Observation
- The staff starts the observation for vaccinated patients
- The observation time is recorded for each administered vaccine

#### 5.2. Record Post-Vaccination Reactions
- After at least 30 minutes, the staff records any reactions
- If there are any reactions, they provide treatment and recommendations

#### 5.3. Complete Appointment
- When all observations are completed, the appointment status changes to `COMPLETED`

**Endpoint: `/api/observation-staff`**
- `GET /in-observation`: View appointments in observation with filtering options
- `GET /today-in-observation`: View today's appointments in observation
- `GET /appointments/{id}`: View specific appointment details
- `GET /vaccinated-vaccines/{appointmentId}`: View vaccinated vaccines for an appointment
- `POST /start-observation/{appointmentId}`: Start observation for an appointment
- `POST /record-post-vaccination-care`: Record post-vaccination care
- `POST /complete-appointment/{appointmentId}`: Complete an appointment

## API Structure

### Controllers
- `ReceptionistController`: Handles receptionist operations
- `CashierController`: Handles cashier operations
- `DoctorVaccinationController`: Handles doctor operations
- `NurseController`: Handles nurse operations
- `ObservationStaffController`: Handles observation staff operations
- `MomoPaymentCallbackController`: Handles MoMo payment callbacks

### Services
- `AppointmentService`: Manages appointments
- `VaccinationService`: Manages vaccination records and processes
- `PaymentService`: Handles payment processing

### Models
- `HealthRecordRequest`: DTO for creating health records
- `VaccinationRecordRequest`: DTO for recording vaccinations
- `PostVaccinationCareRequest`: DTO for recording post-vaccination care
- `CashPaymentRequest`: DTO for processing cash payments

## Error Handling

The system uses a centralized error handling mechanism with the following error categories:
- Payment errors (10xxx)
- Doctor errors (11xxx)
- Nurse errors (12xxx)
- Staff errors (13xxx)
- Vaccination errors (14xxx)

## Security

Each endpoint is secured with role-based access control:
- `/api/receptionist/*` requires `RECEPTIONIST` role
- `/api/cashier/*` requires `CASHIER` role
- `/api/doctor/vaccination/*` requires `DOCTOR` role
- `/api/nurse/*` requires `NURSE` role
- `/api/observation-staff/*` requires `STAFF` role

## Flow Diagram

```
Appointment Creation
      |
      v
Receptionist Check-in
      |
      v
Payment Required? ----- Yes ----> Cashier Payment
      |                              |
      | No                           |
      v                              v
Assign to Doctor <-----------------/
      |
      v
Doctor Health Check
      |
      v
Any Vaccines Approved? -- No ---> Appointment Completed
      |
      | Yes
      v
Nurse Vaccination
      |
      v
Observation Staff Monitoring
      |
      v
Appointment Completed
``` 