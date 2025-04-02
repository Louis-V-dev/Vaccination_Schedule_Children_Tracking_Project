import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, Table, Button, Input, InputNumber, DatePicker, Tabs, Modal, message, 
  Tag, Space, Form, Select, Radio, Collapse, Descriptions, Alert, Tooltip, Statistic, Row, Col
} from 'antd';
import { 
  SearchOutlined, ClockCircleOutlined, CheckCircleOutlined, 
  ExclamationCircleOutlined, MedicineBoxOutlined, HeartOutlined
} from '@ant-design/icons';
import moment from 'moment';
import StaffService from '../../services/StaffService';

const { Option } = Select;
const { Panel } = Collapse;
const { TextArea } = Input;
const { Countdown } = Statistic;

const StaffDashboard = () => {
  const [observations, setObservations] = useState([]);
  const [todayObservations, setTodayObservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [careModalVisible, setCareModalVisible] = useState(false);
  const [careForm] = Form.useForm();
  const [currentTime, setCurrentTime] = useState(moment());

  useEffect(() => {
    fetchAllObservations();
    fetchTodayObservations();
    
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const fetchAllObservations = async () => {
    setLoading(true);
    try {
      const response = await StaffService.getAllInObservation();
      setObservations(response.result || []);
    } catch (error) {
      message.error('Failed to fetch patients in observation');
      console.error('Error fetching observations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayObservations = async () => {
    setLoading(true);
    try {
      const response = await StaffService.getTodayInObservation();
      setTodayObservations(response.result || []);
    } catch (error) {
      message.error('Failed to fetch today\'s observations');
      console.error('Error fetching today\'s observations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Fetch observations for selected date
    fetchObservationsByDate(date);
  };

  const fetchObservationsByDate = async (date) => {
    setLoading(true);
    try {
      const formattedDate = date.format('YYYY-MM-DD');
      const response = await StaffService.getObservationsByDate(formattedDate);
      setObservations(response.result || []);
    } catch (error) {
      message.error('Failed to fetch observations for selected date');
      console.error('Error fetching observations by date:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAppointmentDetails = async (appointment) => {
    try {
      // Fetch detailed appointment information
      const response = await StaffService.getAppointmentDetails(appointment.id);
      setSelectedAppointment(response.result);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('Failed to fetch appointment details');
      console.error('Error fetching appointment details:', error);
    }
  };

  const openCareModal = () => {
    if (!selectedAppointment) return;
    
    setDetailModalVisible(false);
    setCareModalVisible(true);
    
    careForm.setFieldsValue({
      reaction: 'NONE',
      temperature: 37.0,
      bloodPressure: '',
      pulse: 80,
      additionalSymptoms: '',
      recommendations: '',
      followUpNeeded: false,
      notes: ''
    });
  };

  const handleCareSubmit = async (values) => {
    if (!selectedAppointment) return;
    
    try {
      // Create payload for post-vaccination care
      const vaccinationRecords = selectedAppointment.appointmentVaccines
        .filter(av => av.status === 'VACCINATED')
        .map(av => av.vaccinationRecord?.id)
        .filter(id => id);
      
      if (vaccinationRecords.length === 0) {
        message.error('No vaccination records found for this appointment');
        return;
      }
      
      // For simplicity, we'll associate the care with the first vaccination
      const payload = {
        appointmentId: selectedAppointment.id,
        appointmentVaccineId: selectedAppointment.appointmentVaccines.find(av => av.status === 'VACCINATED').id,
        ...values
      };
      
      const response = await StaffService.recordPostVaccinationCare(payload);
      
      if (response && response.code === 100) {
        message.success('Post-vaccination care recorded successfully');
        setCareModalVisible(false);
        
        // Update appointment status to completed
        await StaffService.completeAppointment(selectedAppointment.id);
        
        // Refresh data
        fetchAllObservations();
        fetchTodayObservations();
      } else {
        message.error('Failed to record post-vaccination care');
      }
    } catch (error) {
      message.error('Failed to record post-vaccination care');
      console.error('Error recording post-vaccination care:', error);
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

  const calculateObservationTime = (appointment) => {
    if (!appointment || !appointment.appointmentVaccines) return null;
    
    // Find the most recent vaccination time
    const vaccinatedAppointments = appointment.appointmentVaccines
      .filter(av => av.status === 'VACCINATED' && av.vaccinationRecord)
      .map(av => av.vaccinationRecord);
    
    if (vaccinatedAppointments.length === 0) return null;
    
    // Sort by creation time and get the latest
    const latestVaccination = vaccinatedAppointments.sort((a, b) => {
      return moment(b.createdAt).diff(moment(a.createdAt));
    })[0];
    
    if (!latestVaccination || !latestVaccination.createdAt) return null;
    
    const vaccinationTime = moment(latestVaccination.createdAt);
    const observationEndTime = vaccinationTime.clone().add(30, 'minutes');
    
    return {
      vaccinationTime,
      observationEndTime,
      observationTimeRemaining: observationEndTime.diff(currentTime, 'seconds')
    };
  };

  const isObservationCompleted = (appointment) => {
    const observationTimes = calculateObservationTime(appointment);
    if (!observationTimes) return false;
    
    return observationTimes.observationTimeRemaining <= 0;
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
      title: 'Vaccination Time',
      key: 'vaccinationTime',
      render: (_, record) => {
        const observationTimes = calculateObservationTime(record);
        return observationTimes ? 
          observationTimes.vaccinationTime.format('HH:mm:ss') : 
          'Unknown';
      },
    },
    {
      title: 'Observation Status',
      key: 'observationStatus',
      render: (_, record) => {
        const observationTimes = calculateObservationTime(record);
        if (!observationTimes) return <Tag color="red">Error</Tag>;
        
        const { observationTimeRemaining } = observationTimes;
        
        if (observationTimeRemaining <= 0) {
          return (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              Ready for Discharge
            </Tag>
          );
        } else {
          return (
            <Tag color="processing" icon={<ClockCircleOutlined />}>
              Observing ({Math.ceil(observationTimeRemaining / 60)} min left)
            </Tag>
          );
        }
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const observationCompleted = isObservationCompleted(record);
        
        return (
          <Button 
            type="primary" 
            icon={<HeartOutlined />}
            onClick={() => showAppointmentDetails(record)}
            disabled={!observationCompleted}
          >
            {observationCompleted ? 'Record & Discharge' : 'View Details'}
          </Button>
        );
      },
    },
  ];

  // Define tabs items for the new Tabs API
  const tabItems = [
    {
      key: 'today',
      label: 'Today\'s Observations',
      children: (
        <Card>
          <Table
            columns={columns}
            dataSource={todayObservations}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    },
    {
      key: 'all',
      label: 'All Observations',
      children: (
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <DatePicker 
                value={selectedDate}
                onChange={handleDateChange}
              />
            </Space>
          </div>
          
          <Table
            columns={columns}
            dataSource={observations}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    }
  ];

  return (
    <div className="staff-dashboard">
      <h1>Post-Vaccination Care</h1>
      
      <Alert
        message="Post-Vaccination Observation Protocol"
        description="Patients must be observed for at least 30 minutes after vaccination. Please monitor for any adverse reactions and record them accurately."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Tabs defaultActiveKey="today" items={tabItems} />
      
      {/* Appointment Details Modal */}
      <Modal
        title="Patient Observation Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="proceed" 
            type="primary" 
            onClick={openCareModal}
            disabled={!isObservationCompleted(selectedAppointment)}
          >
            Record Post-Vaccination Care
          </Button>,
        ]}
        width={800}
      >
        {selectedAppointment && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Observation Timer">
                  {(() => {
                    const observationTimes = calculateObservationTime(selectedAppointment);
                    if (!observationTimes) return <p>No vaccination time recorded</p>;
                    
                    const { observationTimeRemaining } = observationTimes;
                    
                    return (
                      <>
                        <p><strong>Vaccination Time:</strong> {observationTimes.vaccinationTime.format('HH:mm:ss')}</p>
                        <p><strong>Observation End Time:</strong> {observationTimes.observationEndTime.format('HH:mm:ss')}</p>
                        
                        {observationTimeRemaining > 0 ? (
                          <Countdown 
                            title="Time Remaining" 
                            value={Date.now() + observationTimeRemaining * 1000} 
                            format="mm:ss" 
                          />
                        ) : (
                          <Alert
                            message="Observation Period Complete"
                            description="The 30-minute observation period has ended. You can now record post-vaccination care and discharge the patient."
                            type="success"
                            showIcon
                          />
                        )}
                      </>
                    );
                  })()}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Patient Information">
                  <p><strong>Child:</strong> {selectedAppointment.child?.child_name}</p>
                  <p><strong>Date of Birth:</strong> {moment(selectedAppointment.child?.birthDate).format('DD/MM/YYYY')}</p>
                  <p><strong>Age:</strong> {moment().diff(moment(selectedAppointment.child?.birthDate), 'years')} years</p>
                  <p><strong>Gender:</strong> {selectedAppointment.child?.gender}</p>
                  <p><strong>Parent:</strong> {selectedAppointment.child?.account_Id?.fullName}</p>
                  <p><strong>Phone:</strong> {selectedAppointment.child?.account_Id?.phoneNumber}</p>
                </Card>
              </Col>
            </Row>
            
            <h3 style={{ marginTop: 24 }}>Vaccination Details</h3>
            <Table 
              dataSource={selectedAppointment.appointmentVaccines.filter(av => av.status === 'VACCINATED')} 
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'Vaccine',
                  dataIndex: ['vaccine', 'name'],
                  key: 'vaccineName',
                },
                {
                  title: 'Dose',
                  key: 'doseNumber',
                  render: (_, record) => `Dose ${record.doseSchedule?.doseNumber || 'N/A'}`,
                },
                {
                  title: 'Administration Site',
                  key: 'injectionSite',
                  render: (_, record) => {
                    const site = record.vaccinationRecord?.injectionSite;
                    if (!site) return 'N/A';
                    return site.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
                  }
                },
                {
                  title: 'Administration Time',
                  key: 'administrationTime',
                  render: (_, record) => {
                    const time = record.vaccinationRecord?.createdAt;
                    return time ? moment(time).format('HH:mm:ss') : 'N/A';
                  }
                },
              ]}
            />
            
            <Collapse defaultActiveKey={['1']} style={{ marginTop: 24 }}>
              <Panel header="Health Records & Nurse Notes" key="1">
                {selectedAppointment.appointmentVaccines
                  .filter(av => av.status === 'VACCINATED')
                  .map((av, index) => (
                    <div key={index} style={{ marginBottom: 15, paddingBottom: 15, borderBottom: '1px solid #eee' }}>
                      <h4>{av.vaccine?.name} (Dose {av.doseSchedule?.doseNumber || 'N/A'})</h4>
                      
                      {av.healthRecord && (
                        <div>
                          <p><strong>Doctor's Notes:</strong> {av.healthRecord.doctorNotes || 'None'}</p>
                          <p><strong>Recommendations:</strong> {av.healthRecord.nextAppointmentRecommendations || 'None'}</p>
                        </div>
                      )}
                      
                      {av.vaccinationRecord && (
                        <div>
                          <p><strong>Administered by:</strong> {av.vaccinationRecord.nurse?.fullName || 'Unknown'}</p>
                          <p><strong>Nurse Notes:</strong> {av.vaccinationRecord.nurseNotes || 'None'}</p>
                        </div>
                      )}
                    </div>
                  ))
                }
              </Panel>
            </Collapse>
          </div>
        )}
      </Modal>
      
      {/* Post Vaccination Care Modal */}
      <Modal
        title="Record Post-Vaccination Care"
        open={careModalVisible}
        onCancel={() => {
          setCareModalVisible(false);
          setDetailModalVisible(true);
        }}
        footer={null}
        width={600}
      >
        <Form 
          form={careForm}
          layout="vertical"
          onFinish={handleCareSubmit}
        >
          <Form.Item 
            name="reaction" 
            label="Observed Reaction"
            rules={[{ required: true, message: 'Please select observed reaction' }]}
          >
            <Radio.Group>
              <Radio.Button value="NONE">No Reaction</Radio.Button>
              <Radio.Button value="MILD">Mild Reaction</Radio.Button>
              <Radio.Button value="MODERATE">Moderate Reaction</Radio.Button>
              <Radio.Button value="SEVERE">Severe Reaction</Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item 
            name="temperature" 
            label="Temperature (°C)"
          >
            <InputNumber step={0.1} precision={1} min={35} max={42} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item 
            name="bloodPressure" 
            label="Blood Pressure (mmHg)"
          >
            <Input placeholder="e.g., 120/80" />
          </Form.Item>
          
          <Form.Item 
            name="pulse" 
            label="Pulse (bpm)"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item 
            name="additionalSymptoms" 
            label="Additional Symptoms"
            dependencies={['reaction']}
            style={{ display: careForm.getFieldValue('reaction') !== 'NONE' ? 'block' : 'none' }}
          >
            <TextArea 
              rows={3} 
              placeholder="Describe any symptoms or reactions observed (redness, swelling, fever, etc.)"
            />
          </Form.Item>
          
          <Form.Item name="recommendations" label="Recommendations">
            <TextArea 
              rows={2} 
              placeholder="Any recommendations for post-care at home"
            />
          </Form.Item>
          
          <Form.Item name="followUpNeeded" valuePropName="checked" label="Follow-up Needed">
            <Radio.Group>
              <Radio value={true}>Yes</Radio>
              <Radio value={false}>No</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item name="notes" label="Additional Notes">
            <TextArea 
              rows={3} 
              placeholder="Any additional notes about the observation period"
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Complete & Discharge Patient
              </Button>
              <Button onClick={() => {
                setCareModalVisible(false);
                setDetailModalVisible(true);
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StaffDashboard; 