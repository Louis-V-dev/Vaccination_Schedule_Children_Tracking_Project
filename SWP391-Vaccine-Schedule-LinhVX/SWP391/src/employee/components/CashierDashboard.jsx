import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Table, Button, Input, DatePicker, Tabs, Modal, message, Tag, Space, InputNumber, Form, Radio } from 'antd';
import { SearchOutlined, DollarOutlined, QrcodeOutlined, CreditCardOutlined, BarcodeOutlined } from '@ant-design/icons';
import moment from 'moment';
import CashierService from '../../services/CashierService';

const CashierDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedDate, setSelectedDate] = useState(moment());
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentForm] = Form.useForm();
  const [momoQrModalVisible, setMomoQrModalVisible] = useState(false);
  const [momoPaymentUrl, setMomoPaymentUrl] = useState('');

  useEffect(() => {
    fetchAllAppointments();
    fetchTodayAppointments();
  }, []);

  const fetchAllAppointments = async () => {
    setLoading(true);
    try {
      const response = await CashierService.getAllAwaitingPayment();
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
      const response = await CashierService.getTodayAwaitingPayment();
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
      const response = await CashierService.getAwaitingPaymentByDate(formattedDate);
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

  // Calculate total amount of the appointment
  const calculateTotal = (appointment) => {
    if (!appointment || !appointment.appointmentVaccines) return 0;
    
    return appointment.appointmentVaccines.reduce((total, av) => {
      return total + (av.vaccine?.price || 0);
    }, 0);
  };

  const openPaymentModal = () => {
    if (!selectedAppointment) return;
    
    setDetailModalVisible(false);
    setPaymentModalVisible(true);
    
    const totalAmount = calculateTotal(selectedAppointment);
    
    paymentForm.setFieldsValue({
      paymentMethod: 'CASH',
      amountPaid: totalAmount,
      receivedBy: 'Current Cashier', // This should be replaced by the logged-in user's name
      notes: '',
    });
  };

  const generateMomoQrCode = async () => {
    if (!selectedAppointment) return;
    
    try {
      const response = await CashierService.generateMomoPayment(selectedAppointment.id);
      
      if (response && response.result && response.result.paymentUrl) {
        setMomoPaymentUrl(response.result.paymentUrl);
        setPaymentModalVisible(false);
        setMomoQrModalVisible(true);
      } else {
        message.error('Failed to generate MoMo payment link');
      }
    } catch (error) {
      message.error('Failed to generate MoMo payment');
      console.error('Error generating MoMo payment:', error);
    }
  };

  const processCashPayment = async (values) => {
    if (!selectedAppointment) return;
    
    try {
      const payload = {
        appointmentId: selectedAppointment.id,
        amountPaid: values.amountPaid,
        receivedBy: values.receivedBy,
        notes: values.notes
      };
      
      const response = await CashierService.processCashPayment(payload);
      
      if (response && response.code === 100) {
        message.success('Payment processed successfully');
        setPaymentModalVisible(false);
        fetchAllAppointments();
        fetchTodayAppointments();
      } else {
        message.error('Failed to process payment');
      }
    } catch (error) {
      message.error('Failed to process payment');
      console.error('Error processing payment:', error);
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
      title: 'Estimated Amount',
      key: 'amount',
      render: (_, record) => {
        const total = calculateTotal(record);
        return `$${total.toFixed(2)}`;
      },
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
      label: 'Today\'s Payments',
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
      label: 'All Payments',
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

  return (
    <div className="cashier-dashboard">
      <h1>Cashier Dashboard</h1>
      
      <Tabs defaultActiveKey="today" items={tabItems} />
      
      <Modal
        title="Appointment Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          <Button 
            key="process" 
            type="primary" 
            icon={<DollarOutlined />}
            onClick={openPaymentModal}
            disabled={selectedAppointment?.paid}
          >
            Process Payment
          </Button>,
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
            
            <h3>Appointment Details</h3>
            <p><strong>Date:</strong> {moment(selectedAppointment.appointmentDate).format('DD/MM/YYYY')}</p>
            <p><strong>Time Slot:</strong> {selectedAppointment.timeSlot}</p>
            <p><strong>Status:</strong> {getStatusTag(selectedAppointment.status)}</p>
            
            <h3>Vaccines</h3>
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
                  title: 'Price',
                  dataIndex: ['vaccine', 'price'],
                  key: 'price',
                  render: (price) => `$${price?.toFixed(2) || '0.00'}`,
                }
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}><strong>Total</strong></Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <strong>${calculateTotal(selectedAppointment).toFixed(2)}</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </div>
        )}
      </Modal>
      
      <Modal
        title="Process Payment"
        open={paymentModalVisible}
        onCancel={() => {
          setPaymentModalVisible(false);
          setDetailModalVisible(true);
        }}
        footer={null}
        width={600}
      >
        <Form 
          form={paymentForm}
          layout="vertical"
          onFinish={processCashPayment}
        >
          <Form.Item
            name="paymentMethod"
            label="Payment Method"
            rules={[{ required: true, message: 'Please select payment method' }]}
          >
            <Radio.Group>
              <Radio.Button value="CASH">
                <DollarOutlined /> Cash
              </Radio.Button>
              <Radio.Button value="MOMO" onClick={generateMomoQrCode}>
                <QrcodeOutlined /> MoMo / QR Code
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item
            name="amountPaid"
            label="Amount Paid"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              min={0}
            />
          </Form.Item>
          
          <Form.Item
            name="receivedBy"
            label="Received By"
            rules={[{ required: true, message: 'Please enter receiver' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Process Cash Payment
              </Button>
              <Button onClick={() => setPaymentModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      
      <Modal
        title="MoMo Payment QR Code"
        open={momoQrModalVisible}
        onCancel={() => {
          setMomoQrModalVisible(false);
          setPaymentModalVisible(true);
        }}
        footer={[
          <Button 
            key="back" 
            onClick={() => {
              setMomoQrModalVisible(false);
              setPaymentModalVisible(true);
            }}
          >
            Back to Payment Options
          </Button>,
        ]}
        width={500}
      >
        <div style={{ textAlign: 'center' }}>
          <p>Scan the QR code or click the link below to pay with MoMo:</p>
          
          {momoPaymentUrl && (
            <>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(momoPaymentUrl)}`} 
                alt="MoMo QR Code" 
                style={{ maxWidth: '100%', height: 'auto', marginBottom: '20px' }}
              />
              <p>
                <a href={momoPaymentUrl} target="_blank" rel="noopener noreferrer">
                  Open Payment Link
                </a>
              </p>
            </>
          )}
          
          <p>Once payment is complete, click "Check Payment Status" to verify.</p>
        </div>
      </Modal>
    </div>
  );
};

export default CashierDashboard; 