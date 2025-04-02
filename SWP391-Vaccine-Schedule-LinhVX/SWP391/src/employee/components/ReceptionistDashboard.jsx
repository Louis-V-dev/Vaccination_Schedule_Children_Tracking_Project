import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Table, Button, Input, DatePicker, Tabs, Modal, message, Tag, Space, Select } from 'antd';
import { SearchOutlined, FilterOutlined, CheckCircleOutlined, DollarOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import moment from 'moment';
import ReceptionistService from '../../services/ReceptionistService';

const { Option } = Select;

const ReceptionistDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState(moment());
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    fetchAllAppointments();
    fetchTodayAppointments();
  }, []);

  const fetchAllAppointments = async () => {
    setLoading(true);
    try {
      const response = await ReceptionistService.getAllAppointments();
      setAppointments(response.result || []);
    } catch (error) {
      message.error('Failed to fetch appointments');
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAppointments = async () => {
    setLoading(true);
    try {
      const response = await ReceptionistService.getTodayAppointments();
      setTodayAppointments(response.result || []);
    } catch (error) {
      message.error('Failed to fetch today\'s appointments');
      console.error('Error fetching today\'s appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
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
      const response = await ReceptionistService.getAppointmentsByDate(formattedDate);
      setAppointments(response.result || []);
    } catch (error) {
      message.error('Failed to fetch appointments for selected date');
      console.error('Error fetching appointments by date:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAppointmentDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setDetailModalVisible(true);
  };

  const handleCheckIn = async () => {
    if (!selectedAppointment) return;

    try {
      // Check if payment is required first
      if (!selectedAppointment.paid) {
        // Update status to send to cashier
        await ReceptionistService.updateAppointmentStatus(selectedAppointment.id, 'AWAITING_PAYMENT');
        message.success('Appointment marked for payment. Please direct the patient to the cashier.');
      } else {
        // Update status to checked in
        await ReceptionistService.updateAppointmentStatus(selectedAppointment.id, 'CHECKED_IN');
        message.success('Patient checked in successfully');
      }
      
      // Refresh data
      fetchAllAppointments();
      fetchTodayAppointments();
      setDetailModalVisible(false);
    } catch (error) {
      message.error('Failed to update appointment status');
      console.error('Error updating status:', error);
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

  const filteredAppointments = (appointmentList) => {
    return appointmentList.filter(appointment => {
      const childName = appointment.child?.child_name?.toLowerCase() || '';
      const parentName = appointment.child?.account_Id?.fullName?.toLowerCase() || '';
      const phone = appointment.child?.account_Id?.phoneNumber || '';
      const searchValue = searchText.toLowerCase();
      
      return childName.includes(searchValue) || 
             parentName.includes(searchValue) || 
             phone.includes(searchValue);
    });
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
      title: 'Parent Name',
      dataIndex: ['child', 'account_Id', 'fullName'],
      key: 'parentName',
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
      title: 'Paid',
      key: 'paid',
      dataIndex: 'paid',
      render: (paid) => paid ? <Tag color="green">Paid</Tag> : <Tag color="red">Unpaid</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="primary" onClick={() => showAppointmentDetails(record)}>
          View Details
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
            <Input 
              placeholder="Search by name or phone" 
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 300 }}
            />
          </div>
          
          <Table
            columns={columns}
            dataSource={filteredAppointments(todayAppointments)}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    },
    {
      key: 'all',
      label: 'All Appointments',
      children: (
        <Card>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <Space>
              <Input 
                placeholder="Search by name or phone" 
                prefix={<SearchOutlined />}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 300 }}
              />
              <DatePicker 
                value={selectedDate}
                onChange={handleDateChange}
              />
            </Space>
          </div>
          
          <Table
            columns={columns}
            dataSource={filteredAppointments(appointments)}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    }
  ];

  // Define footer for the modal with the new API
  const modalFooter = [
    <Button key="back" onClick={() => setDetailModalVisible(false)}>
      Close
    </Button>,
    <Button 
      key="checkin" 
      type="primary" 
      onClick={handleCheckIn}
      disabled={selectedAppointment?.status !== 'SCHEDULED'}
    >
      {selectedAppointment?.paid ? 'Check In' : 'Send to Cashier'}
    </Button>,
  ];

  return (
    <div className="receptionist-dashboard">
      <h1>Receptionist Dashboard</h1>
      
      <Tabs defaultActiveKey="today" items={tabItems} />
      
      <Modal
        title="Appointment Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={modalFooter}
        width={700}
      >
        {selectedAppointment && (
          <div>
            <h3>Patient Information</h3>
            <p><strong>Child:</strong> {selectedAppointment.child?.child_name}</p>
            <p><strong>Parent:</strong> {selectedAppointment.child?.account_Id?.fullName}</p>
            <p><strong>Phone:</strong> {selectedAppointment.child?.account_Id?.phoneNumber}</p>
            <p><strong>Email:</strong> {selectedAppointment.child?.account_Id?.email}</p>
            
            <h3>Appointment Details</h3>
            <p><strong>Date:</strong> {moment(selectedAppointment.appointmentDate).format('DD/MM/YYYY')}</p>
            <p><strong>Time Slot:</strong> {selectedAppointment.timeSlot}</p>
            <p><strong>Status:</strong> {getStatusTag(selectedAppointment.status)}</p>
            <p><strong>Payment Status:</strong> {selectedAppointment.paid ? 
              <Tag color="green">Paid</Tag> : 
              <Tag color="red">Unpaid</Tag>}
            </p>
            
            <h3>Vaccines</h3>
            <ul>
              {selectedAppointment.appointmentVaccines?.map((av) => (
                <li key={av.id}>
                  {av.vaccine?.name} - {av.status}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReceptionistDashboard; 