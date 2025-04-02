import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Card, Table, Button, Input, DatePicker, Tabs, Modal, message, 
  Tag, Space, Form, InputNumber, Select, Radio, Collapse, Descriptions
} from 'antd';
import { 
  SearchOutlined, MedicineBoxOutlined, CheckCircleOutlined, 
  FileDoneOutlined
} from '@ant-design/icons';
import moment from 'moment';
import NurseService from '../../services/NurseService';

const { Option } = Select;
const { Panel } = Collapse;
const { TextArea } = Input;

const NurseDashboard = () => {
  const [pendingVaccinations, setPendingVaccinations] = useState([]);
  const [todayPendingVaccinations, setTodayPendingVaccinations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment());
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [vaccineModalVisible, setVaccineModalVisible] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  const [approvedVaccines, setApprovedVaccines] = useState([]);
  const [vaccinationForm] = Form.useForm();

  useEffect(() => {
    fetchAllPendingVaccinations();
    fetchTodayPendingVaccinations();
  }, []);

  const fetchAllPendingVaccinations = async () => {
    setLoading(true);
    try {
      const response = await NurseService.getAllPendingVaccinations();
      setPendingVaccinations(response.result || []);
    } catch (error) {
      message.error('Failed to fetch pending vaccinations');
      console.error('Error fetching pending vaccinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayPendingVaccinations = async () => {
    setLoading(true);
    try {
      const response = await NurseService.getTodayPendingVaccinations();
      setTodayPendingVaccinations(response.result || []);
    } catch (error) {
      message.error('Failed to fetch today\'s pending vaccinations');
      console.error('Error fetching today\'s pending vaccinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    // Fetch vaccinations for selected date
    fetchVaccinationsByDate(date);
  };

  const fetchVaccinationsByDate = async (date) => {
    setLoading(true);
    try {
      const formattedDate = date.format('YYYY-MM-DD');
      const response = await NurseService.getVaccinationsByDate(formattedDate);
      setPendingVaccinations(response.result || []);
    } catch (error) {
      message.error('Failed to fetch vaccinations for selected date');
      console.error('Error fetching vaccinations by date:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAppointmentDetails = async (appointment) => {
    try {
      // Fetch detailed appointment information
      const response = await NurseService.getAppointmentDetails(appointment.id);
      setSelectedAppointment(response.result);
      
      // Fetch approved vaccines
      const vaccinesResponse = await NurseService.getApprovedVaccinesForAppointment(appointment.id);
      setApprovedVaccines(vaccinesResponse.result || []);
      
      setDetailModalVisible(true);
    } catch (error) {
      message.error('Failed to fetch appointment details');
      console.error('Error fetching appointment details:', error);
    }
  };

  const openVaccinationModal = (vaccine) => {
    setSelectedVaccine(vaccine);
    setDetailModalVisible(false);
    setVaccineModalVisible(true);
    
    // Get today's date for vaccine expiry default
    const nextMonth = moment().add(1, 'month');
    
    // Initialize form with default values
    vaccinationForm.setFieldsValue({
      vaccineBatchNumber: '',
      vaccineExpiryDate: nextMonth,
      injectionSite: 'LEFT_ARM',
      routeOfAdministration: 'INTRAMUSCULAR',
      doseAmount: vaccine.vaccine?.recommendedDose || '0.5',
      nurseNotes: ''
    });
  };

  const handleVaccinationSubmit = async (values) => {
    if (!selectedVaccine) return;
    
    try {
      const payload = {
        appointmentVaccineId: selectedVaccine.id,
        ...values,
        vaccineExpiryDate: values.vaccineExpiryDate.format('YYYY-MM-DD')
      };
      
      const response = await NurseService.recordVaccination(payload);
      
      if (response && response.code === 100) {
        message.success('Vaccination recorded successfully');
        setVaccineModalVisible(false);
        
        // Refresh data
        fetchAllPendingVaccinations();
        fetchTodayPendingVaccinations();
        
        // Check if all approved vaccines have been administered
        const updatedVaccinesResponse = await NurseService.getApprovedVaccinesForAppointment(selectedAppointment.id);
        const updatedVaccines = updatedVaccinesResponse.result || [];
        setApprovedVaccines(updatedVaccines);
        
        const allVaccinated = updatedVaccines.every(v => v.status === 'VACCINATED');
        
        if (allVaccinated) {
          message.info('All vaccinations completed for this appointment');
        } else {
          // If there are more vaccines to administer, show the appointment details again
          setDetailModalVisible(true);
        }
      } else {
        message.error('Failed to record vaccination');
      }
    } catch (error) {
      message.error('Failed to record vaccination');
      console.error('Error recording vaccination:', error);
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
      title: 'Approved Vaccines',
      key: 'approvedVaccineCount',
      render: (_, record) => {
        const approvedCount = record.appointmentVaccines?.filter(
          av => av.status === 'APPROVED'
        ).length || 0;
        return approvedCount;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<MedicineBoxOutlined />}
          onClick={() => showAppointmentDetails(record)}
        >
          Administer Vaccines
        </Button>
      ),
    },
  ];

  // Define tabs items for the new Tabs API
  const tabItems = [
    {
      key: 'today',
      label: 'Today\'s Vaccinations',
      children: (
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h3>{moment().format('dddd, MMMM D, YYYY')}</h3>
              <p>{todayPendingVaccinations.length} pending vaccinations</p>
            </div>
          </div>
          
          <Table
            columns={columns}
            dataSource={todayPendingVaccinations}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    },
    {
      key: 'all',
      label: 'All Pending Vaccinations',
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
            dataSource={pendingVaccinations}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    }
  ];

  return (
    <div className="nurse-dashboard">
      <h1>Nurse Dashboard</h1>
      
      <Tabs defaultActiveKey="today" items={tabItems} />
      
      <Modal
        title="Appointment Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedAppointment && (
          <div>
            <h3>Patient Information</h3>
            <p><strong>Child:</strong> {selectedAppointment.child?.child_name}</p>
            <p><strong>Parent:</strong> {selectedAppointment.child?.account_Id?.fullName}</p>
            <p><strong>Phone:</strong> {selectedAppointment.child?.account_Id?.phoneNumber}</p>
            <p><strong>Email:</strong> {selectedAppointment.child?.account_Id?.email}</p>
            
            <h3>Health Records</h3>
            <Collapse defaultActiveKey={['1']}>
              <Panel header="Doctor's Notes" key="1">
                <p>
                  {selectedAppointment.doctorNotes || 'No notes available.'}
                </p>
              </Panel>
            </Collapse>
            
            <h3>Approved Vaccines to Administer</h3>
            {approvedVaccines.length > 0 ? (
              <Table
                columns={[
                  {
                    title: 'Vaccine',
                    dataIndex: ['vaccine', 'name'],
                    key: 'vaccineId',
                  },
                  {
                    title: 'Dose Number',
                    dataIndex: ['doseSchedule', 'doseNumber'],
                    key: 'doseNumber',
                  },
                  {
                    title: 'Status',
                    key: 'status',
                    render: (_, record) => getVaccinationStatusTag(record.status),
                  },
                  {
                    title: 'Action',
                    key: 'action',
                    render: (_, record) => (
                      <Space>
                        <Button 
                          type="primary" 
                          icon={<MedicineBoxOutlined />}
                          onClick={() => openVaccinationModal(record)}
                          disabled={record.status !== 'APPROVED'}
                        >
                          Administer
                        </Button>
                      </Space>
                    ),
                  },
                ]}
                dataSource={approvedVaccines}
                rowKey="id"
                pagination={false}
              />
            ) : (
              <p>No approved vaccines for this appointment.</p>
            )}
          </div>
        )}
      </Modal>
      
      <Modal
        title="Record Vaccination"
        open={vaccineModalVisible}
        onCancel={() => {
          setVaccineModalVisible(false);
          setDetailModalVisible(true);
        }}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 20 }}>
          <h3>
            Recording vaccination for {selectedVaccine?.vaccine?.name} 
            (Dose {selectedVaccine?.doseSchedule?.doseNumber || 'N/A'})
          </h3>
        </div>
        
        <Form 
          form={vaccinationForm}
          layout="vertical"
          onFinish={handleVaccinationSubmit}
        >
          <Form.Item 
            name="vaccineBatchNumber" 
            label="Vaccine Batch Number"
            rules={[{ required: true, message: 'Please enter batch number' }]}
          >
            <Input placeholder="e.g., BT1234-567" />
          </Form.Item>
          
          <Form.Item 
            name="vaccineExpiryDate" 
            label="Vaccine Expiry Date"
            rules={[{ required: true, message: 'Please select expiry date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item 
            name="injectionSite" 
            label="Injection Site"
            rules={[{ required: true, message: 'Please select injection site' }]}
          >
            <Select>
              <Option value="LEFT_ARM">Left Arm</Option>
              <Option value="RIGHT_ARM">Right Arm</Option>
              <Option value="LEFT_THIGH">Left Thigh</Option>
              <Option value="RIGHT_THIGH">Right Thigh</Option>
              <Option value="BUTTOCK">Buttock</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="routeOfAdministration" 
            label="Route of Administration"
            rules={[{ required: true, message: 'Please select administration route' }]}
          >
            <Select>
              <Option value="INTRAMUSCULAR">Intramuscular (IM)</Option>
              <Option value="SUBCUTANEOUS">Subcutaneous (SC)</Option>
              <Option value="INTRADERMAL">Intradermal (ID)</Option>
              <Option value="ORAL">Oral</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="doseAmount" 
            label="Dose Amount (ml)"
            rules={[{ required: true, message: 'Please enter dose amount' }]}
          >
            <InputNumber 
              step={0.1} 
              precision={1} 
              min={0.1} 
              max={10} 
              style={{ width: '100%' }} 
            />
          </Form.Item>
          
          <Form.Item name="nurseNotes" label="Nurse Notes">
            <TextArea rows={3} placeholder="Any notes about the vaccination administration" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<FileDoneOutlined />}>
                Record Vaccination
              </Button>
              <Button onClick={() => {
                setVaccineModalVisible(false);
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

export default NurseDashboard; 