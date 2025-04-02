import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, Table, Button, Input, DatePicker, Tabs, Modal, message, 
  Tag, Space, Form, InputNumber, Select, Checkbox, Radio, Collapse
} from 'antd';
import { 
  SearchOutlined, MedicineBoxOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, CalendarOutlined 
} from '@ant-design/icons';
import moment from 'moment';
import DoctorService from '../../services/DoctorService';

const { Option } = Select;
const { Panel } = Collapse;
const { TextArea } = Input;

const DoctorDashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [todayAssignments, setTodayAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [healthRecordForm] = Form.useForm();
  const [healthRecordModalVisible, setHealthRecordModalVisible] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedDoseSchedule, setSelectedDoseSchedule] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(null);

  useEffect(() => {
    fetchAllAssignments();
    fetchTodayAssignments();
  }, []);

  const fetchAllAssignments = async () => {
    setLoading(true);
    try {
      const response = await DoctorService.getAllAssignedAppointments();
      setAssignments(response.result || []);
    } catch (error) {
      message.error('Failed to fetch assigned appointments');
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAssignments = async () => {
    setLoading(true);
    try {
      const response = await DoctorService.getTodayAppointments();
      setTodayAssignments(response.result || []);
    } catch (error) {
      message.error('Failed to fetch today\'s appointments');
      console.error('Error fetching today\'s appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Fetch appointments for selected date
    fetchAppointmentsByDate(date);
  };

  const fetchAppointmentsByDate = async (date) => {
    setLoading(true);
    try {
      const formattedDate = date.format('YYYY-MM-DD');
      const response = await DoctorService.getAppointmentsByDate(formattedDate);
      setAssignments(response.result || []);
    } catch (error) {
      message.error('Failed to fetch appointments for selected date');
      console.error('Error fetching appointments by date:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAppointmentDetails = async (appointment) => {
    try {
      // Fetch detailed appointment information
      const response = await DoctorService.getAppointmentDetails(appointment.id);
      setSelectedAppointment(response.result);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('Failed to fetch appointment details');
      console.error('Error fetching appointment details:', error);
    }
  };

  const openHealthRecordModal = (appointmentVaccine) => {
    setSelectedVaccine(appointmentVaccine);
    setDetailModalVisible(false);
    setHealthRecordModalVisible(true);
    
    // Initialize form with default values
    healthRecordForm.setFieldsValue({
      temperature: 37.0,
      weight: null,
      height: null,
      bloodPressure: null,
      heartRate: null,
      allergies: '',
      currentMedications: '',
      preVaccinationHealth: '',
      doctorNotes: '',
      vaccinationApproved: true,
      rejectionReason: '',
      nextAppointmentRecommendations: ''
    });
  };

  const handleHealthRecordSubmit = async (values) => {
    if (!selectedVaccine) return;
    
    try {
      const payload = {
        appointmentVaccineId: selectedVaccine.id,
        ...values
      };
      
      const response = await DoctorService.createHealthRecord(payload);
      
      if (response && response.code === 100) {
        message.success('Health record created successfully');
        setHealthRecordModalVisible(false);
        
        // Refresh data
        fetchAllAssignments();
        fetchTodayAssignments();
        
        // Check if all vaccines in this appointment have been processed
        const updatedResponse = await DoctorService.getAppointmentDetails(selectedAppointment.id);
        const updatedAppointment = updatedResponse.result;
        
        const allProcessed = updatedAppointment.appointmentVaccines.every(
          av => av.status === 'APPROVED' || av.status === 'REJECTED'
        );
        
        if (allProcessed) {
          message.info('All vaccines have been processed for this appointment');
        } else {
          // If there are more vaccines to process, show the appointment details again
          setSelectedAppointment(updatedAppointment);
          setDetailModalVisible(true);
        }
      } else {
        message.error('Failed to create health record');
      }
    } catch (error) {
      message.error('Failed to create health record');
      console.error('Error creating health record:', error);
    }
  };

  const openRescheduleModal = (doseSchedule) => {
    setSelectedDoseSchedule(doseSchedule);
    setRescheduleDate(null);
    setRescheduleModalVisible(true);
  };

  const handleReschedule = async () => {
    if (!selectedDoseSchedule || !rescheduleDate) return;
    
    try {
      const formattedDate = rescheduleDate.format('YYYY-MM-DD');
      const response = await DoctorService.rescheduleDose(selectedDoseSchedule.id, formattedDate);
      
      if (response && response.code === 100) {
        message.success('Dose rescheduled successfully');
        setRescheduleModalVisible(false);
        
        // Refresh data
        const updatedResponse = await DoctorService.getAppointmentDetails(selectedAppointment.id);
        setSelectedAppointment(updatedResponse.result);
      } else {
        message.error('Failed to reschedule dose');
      }
    } catch (error) {
      message.error('Failed to reschedule dose');
      console.error('Error rescheduling dose:', error);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'SCHEDULED': <Tag color="blue">Scheduled</Tag>,
      'CHECKED_IN': <Tag color="green">Checked In</Tag>,
      'AWAITING_PAYMENT': <Tag color="orange">Awaiting Payment</Tag>,
      'WITH_DOCTOR': <Tag color="purple">With Doctor</Tag>,
      'WITH_NURSE': <Tag color="cyan">With Nurse</Tag>,
      'IN_OBSERVATION': <Tag color="geekblue">In Observation</Tag>,
      'COMPLETED': <Tag color="green">Completed</Tag>,
      'CANCELLED': <Tag color="red">Cancelled</Tag>
    };
    return statusMap[status] || <Tag color="default">{status}</Tag>;
  };

  const getVaccinationStatusTag = (status) => {
    const statusMap = {
      'PENDING': <Tag color="orange">Pending</Tag>,
      'APPROVED': <Tag color="green">Approved</Tag>,
      'REJECTED': <Tag color="red">Rejected</Tag>,
      'VACCINATED': <Tag color="blue">Vaccinated</Tag>
    };
    return statusMap[status] || <Tag color="default">{status}</Tag>;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Child Name',
      dataIndex: ['child', 'child_name'],
      key: 'childName',
    },
    {
      title: 'Age',
      key: 'age',
      render: (_, record) => {
        const birthDate = record.child?.birthDate;
        if (!birthDate) return 'N/A';
        const age = moment().diff(moment(birthDate), 'years');
        return `${age} years`;
      },
    },
    {
      title: 'Appointment Date',
      dataIndex: 'appointmentDate',
      key: 'appointmentDate',
      render: (text) => moment(text).format('DD/MM/YYYY'),
    },
    {
      title: 'Time Slot',
      dataIndex: 'timeSlot',
      key: 'timeSlot',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Number of Vaccines',
      key: 'vaccineCount',
      render: (_, record) => record.appointmentVaccines?.length || 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="primary" onClick={() => showAppointmentDetails(record)}>
          Examine
        </Button>
      ),
    },
  ];

  // Define tabs items for the new Tabs API
  const tabItems = [
    {
      key: 'today',
      label: 'Today\'s Appointments',
      children: (
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h3>{moment().format('dddd, MMMM D, YYYY')}</h3>
              <p>{todayAssignments.length} appointments to examine</p>
            </div>
          </div>
          
          <Table
            columns={columns}
            dataSource={todayAssignments}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    },
    {
      key: 'all',
      label: 'All Assignments',
      children: (
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <DatePicker 
                value={selectedDate}
                onChange={handleDateChange}
              />
            </Space>
          </div>
          
          <Table
            columns={columns}
            dataSource={assignments}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    }
  ];

  return (
    <div className="doctor-dashboard">
      <h1>Doctor Dashboard</h1>
      
      <Tabs defaultActiveKey="today" items={tabItems} />
      
      {/* Appointment Details Modal */}
      <Modal
        title="Appointment Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedAppointment && (
          <div>
            <h3>Patient Information</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p><strong>Child:</strong> {selectedAppointment.child?.child_name}</p>
                <p><strong>Date of Birth:</strong> {moment(selectedAppointment.child?.birthDate).format('DD/MM/YYYY')}</p>
                <p><strong>Age:</strong> {moment().diff(moment(selectedAppointment.child?.birthDate), 'years')} years</p>
                <p><strong>Gender:</strong> {selectedAppointment.child?.gender}</p>
              </div>
              <div>
                <p><strong>Parent:</strong> {selectedAppointment.child?.account_Id?.fullName}</p>
                <p><strong>Phone:</strong> {selectedAppointment.child?.account_Id?.phoneNumber}</p>
                <p><strong>Email:</strong> {selectedAppointment.child?.account_Id?.email}</p>
              </div>
            </div>
            
            <Collapse defaultActiveKey={['1']} style={{ marginTop: 20, marginBottom: 20 }}>
              <Panel header="Medical History (if available)" key="1">
                <p>
                  {selectedAppointment.child?.medicalHistory || 'No medical history provided'}
                </p>
              </Panel>
            </Collapse>
            
            <h3>Vaccines to Examine</h3>
            <Table 
              dataSource={selectedAppointment.appointmentVaccines} 
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'Vaccine',
                  dataIndex: ['vaccine', 'name'],
                  key: 'vaccineName',
                },
                {
                  title: 'Dose Number',
                  key: 'doseNumber',
                  render: (_, record) => record.doseSchedule?.doseNumber || 'N/A',
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => getVaccinationStatusTag(status),
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record) => (
                    record.status === 'PENDING' ? (
                      <Button 
                        type="primary" 
                        icon={<MedicineBoxOutlined />}
                        onClick={() => openHealthRecordModal(record)}
                      >
                        Examine
                      </Button>
                    ) : (
                      <Tag color="default">Already Processed</Tag>
                    )
                  ),
                },
              ]}
            />
            
            {selectedAppointment.child?.vaccinesOfChild?.length > 0 && (
              <>
                <h3 style={{ marginTop: 20 }}>Vaccination History</h3>
                <Table 
                  dataSource={selectedAppointment.child.vaccinesOfChild} 
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: 'Vaccine',
                      dataIndex: ['vaccine', 'name'],
                      key: 'vaccineName',
                    },
                    {
                      title: 'Current Dose / Total Doses',
                      key: 'doseProgress',
                      render: (_, record) => `${record.currentDose} / ${record.totalDoses}`,
                    },
                    {
                      title: 'Status',
                      dataIndex: 'isCompleted',
                      key: 'isCompleted',
                      render: (completed) => completed ? 
                        <Tag color="green">Completed</Tag> : 
                        <Tag color="blue">In Progress</Tag>,
                    },
                    {
                      title: 'Next Dose',
                      key: 'nextDose',
                      render: (_, record) => {
                        const nextDose = record.doseSchedules?.find(ds => 
                          ds.doseNumber === record.currentDose + 1 && ds.status === 'SCHEDULED'
                        );
                        return nextDose ? 
                          moment(nextDose.scheduledDate).format('DD/MM/YYYY') : 
                          'None scheduled';
                      },
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (_, record) => {
                        const nextDose = record.doseSchedules?.find(ds => 
                          ds.doseNumber === record.currentDose + 1 && ds.status === 'SCHEDULED'
                        );
                        return nextDose ? (
                          <Button 
                            icon={<CalendarOutlined />}
                            onClick={() => openRescheduleModal(nextDose)}
                          >
                            Reschedule
                          </Button>
                        ) : null;
                      },
                    },
                  ]}
                />
              </>
            )}
          </div>
        )}
      </Modal>
      
      {/* Health Record Modal */}
      <Modal
        title="Create Health Record"
        open={healthRecordModalVisible}
        onCancel={() => {
          setHealthRecordModalVisible(false);
          setDetailModalVisible(true);
        }}
        footer={null}
        width={700}
      >
        <div style={{ marginBottom: 20 }}>
          <h3>
            Creating health record for {selectedVaccine?.vaccine?.name} 
            (Dose {selectedVaccine?.doseSchedule?.doseNumber || 'N/A'})
          </h3>
        </div>
        
        <Form 
          form={healthRecordForm}
          layout="vertical"
          onFinish={handleHealthRecordSubmit}
        >
          <h4>Pre-vaccination Health Assessment</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            <Form.Item name="temperature" label="Temperature (°C)" style={{ width: 'calc(33% - 14px)' }}>
              <InputNumber step={0.1} precision={1} min={35} max={42} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item name="weight" label="Weight (kg)" style={{ width: 'calc(33% - 14px)' }}>
              <InputNumber step={0.1} precision={1} min={0} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item name="height" label="Height (cm)" style={{ width: 'calc(33% - 14px)' }}>
              <InputNumber step={0.1} precision={1} min={0} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item name="bloodPressure" label="Blood Pressure (mmHg)" style={{ width: 'calc(33% - 14px)' }}>
              <Input placeholder="e.g., 120/80" />
            </Form.Item>
            
            <Form.Item name="heartRate" label="Heart Rate (bpm)" style={{ width: 'calc(33% - 14px)' }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          
          <Form.Item name="preVaccinationHealth" label="General Health Status">
            <TextArea rows={3} placeholder="Describe the child's general health status" />
          </Form.Item>
          
          <Form.Item name="allergies" label="Allergies">
            <TextArea rows={2} placeholder="List any known allergies" />
          </Form.Item>
          
          <Form.Item name="currentMedications" label="Current Medications">
            <TextArea rows={2} placeholder="List any current medications" />
          </Form.Item>
          
          <Form.Item name="doctorNotes" label="Doctor's Notes">
            <TextArea rows={3} placeholder="Additional observations or notes" />
          </Form.Item>
          
          <Form.Item name="vaccinationApproved" label="Vaccination Decision">
            <Radio.Group>
              <Radio value={true}>
                <CheckCircleOutlined style={{ color: 'green' }} /> Approve Vaccination
              </Radio>
              <Radio value={false}>
                <CloseCircleOutlined style={{ color: 'red' }} /> Reject Vaccination
              </Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item 
            name="rejectionReason" 
            label="Reason for Rejection"
            dependencies={['vaccinationApproved']}
            style={{ display: healthRecordForm.getFieldValue('vaccinationApproved') === false ? 'block' : 'none' }}
          >
            <TextArea rows={3} placeholder="Explain why vaccination is not recommended" />
          </Form.Item>
          
          <Form.Item name="nextAppointmentRecommendations" label="Recommendations for Next Appointment">
            <TextArea rows={2} placeholder="Any special instructions for the next appointment" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit Health Record
              </Button>
              <Button onClick={() => {
                setHealthRecordModalVisible(false);
                setDetailModalVisible(true);
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Reschedule Modal */}
      <Modal
        title="Reschedule Dose"
        open={rescheduleModalVisible}
        onCancel={() => setRescheduleModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setRescheduleModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleReschedule}
            disabled={!rescheduleDate}
          >
            Reschedule
          </Button>,
        ]}
      >
        <div>
          <p>
            <strong>Vaccine:</strong> {selectedDoseSchedule?.vaccineOfChild?.vaccine?.name}
          </p>
          <p>
            <strong>Current Scheduled Date:</strong> {
              selectedDoseSchedule ? moment(selectedDoseSchedule.scheduledDate).format('DD/MM/YYYY') : ''
            }
          </p>
          <p>
            <strong>Dose Number:</strong> {selectedDoseSchedule?.doseNumber}
          </p>
          
          <div style={{ marginTop: 20 }}>
            <p><strong>Select New Date:</strong></p>
            <DatePicker 
              style={{ width: '100%' }} 
              onChange={(date) => setRescheduleDate(date)}
              disabledDate={(current) => current && current < moment().startOf('day')}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DoctorDashboard; 