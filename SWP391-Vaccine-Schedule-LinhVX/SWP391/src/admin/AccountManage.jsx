import React, { useState, useEffect } from "react";
import { Container, Table, Button, Modal, Form, Alert } from "react-bootstrap";
import accountService from "../services/accountService";
import { toast } from 'react-toastify';
import AdminLayout from './AdminLayout';

function AccountManage() {
  const [accounts, setAccounts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    roles: [],
    status: "ACTIVE"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch accounts and roles on component mount
  useEffect(() => {
    fetchAccounts();
    fetchRoles();
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

  const fetchRoles = async () => {
    try {
      const response = await accountService.getAllRoles();
      console.log('Fetched roles:', response);
      setRoles(response);
    } catch (err) {
      console.error("Error fetching roles:", err);
      toast.error("Failed to fetch roles. Using default roles.");
      // Set default roles as fallback
      setRoles([
        { roleId: 1, roleName: 'ADMIN' },
        { roleId: 2, roleName: 'DOCTOR' },
        { roleId: 3, roleName: 'NURSE' },
        { roleId: 4, roleName: 'STAFF' },
        { roleId: 5, roleName: 'USER' }
      ]);
    }
  };

  const handleShowModal = (account = null) => {
    if (account) {
      console.log('Editing account:', account);
      setSelectedAccount(account);
      setFormData({
        username: account.username,
        email: account.email,
        roles: Array.isArray(account.roles) ? account.roles : [],
        status: account.status
      });
    } else {
      setSelectedAccount(null);
      setFormData({
        username: "",
        email: "",
        roles: [],
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
      roles: [],
      status: "ACTIVE"
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'roles') {
      setFormData(prev => ({
        ...prev,
        roles: value ? [value] : []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      const submitData = {
        username: formData.username,
        email: formData.email,
        roles: formData.roles,
        status: formData.status === 'ACTIVE'
      };

      console.log('Submitting account data:', submitData);

      if (selectedAccount) {
        const result = await accountService.updateAccount(selectedAccount.id, submitData);
        console.log('Update result:', result);
        toast.success("Account updated successfully");
      } else {
        if (!formData.password) {
          throw new Error("Password is required for new accounts");
        }
        submitData.password = formData.password;
        const result = await accountService.createAccount(submitData);
        console.log('Create result:', result);
        toast.success("Account created successfully");
      }
      
      handleCloseModal();
      await fetchAccounts();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      const errorMessage = err.response?.data?.message || err.message || "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
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
                      {account.roles && account.roles.length > 0 ? (
                        <span
                          className={`badge bg-${
                            account.roles[0] === 'ADMIN' ? 'danger' :
                            account.roles[0] === 'DOCTOR' ? 'success' :
                            account.roles[0] === 'NURSE' ? 'info' :
                            account.roles[0] === 'STAFF' ? 'warning' :
                            'primary'
                          }`}
                        >
                          {account.roles[0]}
                        </span>
                      ) : (
                        <span className="badge bg-secondary">No role</span>
                      )}
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
                  disabled={selectedAccount}
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
                <Form.Label>Roles</Form.Label>
                <Form.Select
                  name="roles"
                  value={formData.roles}
                  onChange={handleInputChange}
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.roleId} value={role.roleName}>
                      {role.roleName}
                    </option>
                  ))}
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
