import React, { useState, useEffect } from "react";
import { Container, Table, Button, Modal, Form, Alert } from "react-bootstrap";
import accountService from "../services/accountService";
import { toast } from 'react-toastify';
import AdminLayout from './AdminLayout';

function AccountManage() {
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    role: "USER",
    status: "ACTIVE"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch accounts on component mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountService.getAllAccounts();
      if (Array.isArray(data)) {
        setAccounts(data);
        setError("");
      } else {
        console.warn("Received non-array data:", data);
        setAccounts([]);
        setError("Invalid data format received from server");
      }
    } catch (err) {
      console.error("Error in fetchAccounts:", err);
      setError("Failed to fetch accounts");
      toast.error("Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (account = null) => {
    if (account) {
      setSelectedAccount(account);
      setFormData({
        username: account.username,
        email: account.email,
        password: "",
        fullName: account.fullName,
        role: account.role,
        status: account.status
      });
    } else {
      setSelectedAccount(null);
      setFormData({
        username: "",
        email: "",
        password: "",
        fullName: "",
        role: "USER",
        status: "ACTIVE"
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAccount(null);
    setFormData({
      username: "",
      email: "",
      password: "",
      fullName: "",
      role: "USER",
      status: "ACTIVE"
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedAccount) {
        await accountService.updateAccount(selectedAccount.id, formData);
        toast.success("Account updated successfully");
      } else {
        await accountService.createAccount(formData);
        toast.success("Account created successfully");
      }
      handleCloseModal();
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      toast.error(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      try {
        setLoading(true);
        await accountService.deleteAccount(id);
        toast.success("Account deleted successfully");
        fetchAccounts();
      } catch (err) {
        setError("Failed to delete account");
        toast.error("Failed to delete account");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AdminLayout>
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Account Management</h1>
          <Button variant="primary" onClick={() => handleShowModal()}>
            Add New Account
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {loading && <Alert variant="info">Loading accounts...</Alert>}

        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Username</th>
                <th>Email</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length > 0 ? (
                accounts.map((account, index) => (
                  <tr key={account.id || index}>
                    <td>{index + 1}</td>
                    <td>{account.username}</td>
                    <td>{account.email}</td>
                    <td>{account.fullName}</td>
                    <td>
                      <span className={`badge bg-${account.role === 'ADMIN' ? 'danger' : account.role === 'DOCTOR' ? 'success' : 'primary'}`}>
                        {account.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge bg-${account.status === 'ACTIVE' ? 'success' : 'secondary'}`}>
                        {account.status}
                      </span>
                    </td>
                    <td>
                      <Button
                        variant="info"
                        size="sm"
                        className="me-2"
                        onClick={() => handleShowModal(account)}
                      >
                        <i className="fas fa-edit"></i> Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(account.id)}
                      >
                        <i className="fas fa-trash"></i> Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">
                    {loading ? "Loading accounts..." : "No accounts found or you don't have permission to view them"}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        <Modal show={showModal} onHide={handleCloseModal}>
          <Modal.Header closeButton>
            <Modal.Title>
              {selectedAccount ? "Edit Account" : "Create New Account"}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!selectedAccount}
                  placeholder={selectedAccount ? "Leave blank to keep current password" : ""}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Role</Form.Label>
                <Form.Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                  <option value="DOCTOR">Doctor</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </AdminLayout>
  );
}

export default AccountManage;
