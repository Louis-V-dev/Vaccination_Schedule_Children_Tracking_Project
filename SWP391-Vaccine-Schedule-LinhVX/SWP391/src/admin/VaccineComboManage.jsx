import React, { useState, useEffect } from "react";
import { Container, Table, Button, Modal, Form, Alert, Row, Col } from "react-bootstrap";
import { toast } from 'react-toastify';
import vaccineComboService from "../services/vaccineComboService";
import vaccineService from "../services/vaccineService";
import AdminLayout from './AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

function VaccineComboManage() {
    const [combos, setCombos] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedCombo, setSelectedCombo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        comboName: "",
        description: "",
        price: "0",
        saleOff: 0,
        status: true,
        vaccineDetails: []
    });

    // Add state for vaccine prices
    const [vaccinePrices, setVaccinePrices] = useState({});

    useEffect(() => {
        fetchCombos();
        fetchVaccines();
    }, []);

    const fetchCombos = async () => {
        try {
            setLoading(true);
            const data = await vaccineComboService.getAllCombos();
            setCombos(data);
            setError("");
        } catch (err) {
            console.error("Error in fetchCombos:", err);
            setError("Failed to fetch vaccine combos");
            toast.error("Failed to fetch vaccine combos");
        } finally {
            setLoading(false);
        }
    };

    const fetchVaccines = async () => {
        try {
            const data = await vaccineService.getAllVaccines();
            setVaccines(data);
            // Create a map of vaccine prices
            const priceMap = {};
            data.forEach(vaccine => {
                priceMap[vaccine.id] = vaccine.price || 0;
            });
            setVaccinePrices(priceMap);
        } catch (err) {
            console.error("Error fetching vaccines:", err);
            toast.error("Failed to fetch vaccines");
        }
    };

    // Calculate total price based on vaccines and combo sale off
    const calculateTotalPrice = (details, saleOff = 0) => {
        const originalPrice = calculateOriginalPrice(details);
        return originalPrice * (1 - saleOff / 100);
    };

    // Calculate original price without discounts
    const calculateOriginalPrice = (details) => {
        return details.reduce((total, detail) => {
            const vaccine = vaccines.find(v => v.id === parseInt(detail.vaccineId));
            const vaccinePrice = vaccine ? vaccine.price : 0;
            const quantity = vaccine ? vaccine.dose : 0; // Use vaccine's predefined dose
            return total + (vaccinePrice * quantity);
        }, 0);
    };

    const handleShowModal = (combo = null) => {
        if (combo) {
            setSelectedCombo(combo);
            setFormData({
                comboName: combo.comboName || "",
                description: combo.description || "",
                price: combo.price?.toString() || "0",
                saleOff: combo.saleOff || 0,
                status: combo.status ?? true,
                vaccineDetails: combo.vaccineDetails || []
            });
        } else {
            setSelectedCombo(null);
            setFormData({
                comboName: "",
                description: "",
                price: "0",
                saleOff: 0,
                status: true,
                vaccineDetails: []
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedCombo(null);
        setFormData({
            comboName: "",
            description: "",
            price: "0",
            saleOff: 0,
            status: true,
            vaccineDetails: []
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: name === 'saleOff' ? (value === '' ? 0 : Number(value)) : value
            };
            
            if (name === 'saleOff') {
                const totalPrice = calculateTotalPrice(prev.vaccineDetails, Number(value));
                newData.price = totalPrice.toFixed(2);
            }
            
            return newData;
        });
    };

    const handleAddVaccineDetail = () => {
        setFormData(prev => ({
            ...prev,
            vaccineDetails: [
                ...prev.vaccineDetails,
                { vaccineId: '', ageGroup: '' }
            ]
        }));
    };

    const handleRemoveVaccineDetail = (index) => {
        setFormData(prev => ({
            ...prev,
            vaccineDetails: prev.vaccineDetails.filter((_, i) => i !== index)
        }));
    };

    const handleVaccineDetailChange = (index, field, value) => {
        setFormData(prev => {
            const newDetails = [...prev.vaccineDetails];
            newDetails[index] = {
                ...newDetails[index],
                [field]: value
            };
            
            // Automatically update the combo price based on vaccines and combo discount
            const totalPrice = calculateTotalPrice(newDetails, prev.saleOff);
            
            return {
                ...prev,
                vaccineDetails: newDetails,
                price: totalPrice.toFixed(2)
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                saleOff: parseFloat(formData.saleOff),
                vaccineDetails: formData.vaccineDetails.map(detail => ({
                    ...detail,
                    dose: parseInt(detail.dose),
                    vaccineId: parseInt(detail.vaccineId)
                }))
            };
            console.log('Submitting payload:', payload);
            
            if (selectedCombo) {
                await vaccineComboService.updateCombo(selectedCombo.comboId, payload);
                toast.success("Vaccine combo updated successfully");
            } else {
                await vaccineComboService.createCombo(payload);
                toast.success("Vaccine combo created successfully");
            }
            handleCloseModal();
            fetchCombos();
        } catch (err) {
            console.error('Error details:', err.response?.data);
            setError(err.response?.data?.message || "An error occurred");
            toast.error(err.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this vaccine combo?")) {
            try {
                setLoading(true);
                await vaccineComboService.deleteCombo(id);
                toast.success("Vaccine combo deleted successfully");
                fetchCombos();
            } catch (err) {
                setError("Failed to delete vaccine combo");
                toast.error("Failed to delete vaccine combo");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <AdminLayout>
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1>Vaccine Combo Management</h1>
                    <Button variant="primary" onClick={() => handleShowModal()}>
                        Add New Combo
                    </Button>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}
                {loading && <Alert variant="info">Loading...</Alert>}

                <div className="table-responsive">
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Original Price</th>
                                <th>Final Price</th>
                                <th>Status</th>
                                <th>Vaccines</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {combos.map((combo, index) => (
                                <tr key={combo.comboId}>
                                    <td>{index + 1}</td>
                                    <td>{combo.comboName}</td>
                                    <td>{combo.description}</td>
                                    <td>${calculateOriginalPrice(combo.vaccineDetails).toFixed(2)}</td>
                                    <td>${Number(combo.price).toFixed(2)}</td>
                                    <td>
                                        <span className={`badge bg-${combo.status ? 'success' : 'danger'}`}>
                                            {combo.status ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        {combo.vaccineDetails.map(detail => (
                                            <div key={detail.vaccineId}>
                                                {vaccines.find(v => v.id === detail.vaccineId)?.name || 'Unknown'} 
                                                ({vaccines.find(v => v.id === detail.vaccineId)?.dose || 0} doses)
                                                {detail.saleOff > 0 && ` - ${detail.saleOff}% off`}
                                            </div>
                                        ))}
                                    </td>
                                    <td>
                                        <Button
                                            variant="info"
                                            size="sm"
                                            className="me-2"
                                            onClick={() => handleShowModal(combo)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(combo.comboId)}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                <Modal show={showModal} onHide={handleCloseModal} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>
                            {selectedCombo ? "Edit Vaccine Combo" : "Create New Vaccine Combo"}
                        </Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleSubmit}>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Combo Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="comboName"
                                    value={formData.comboName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Sale Off (%)</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="saleOff"
                                    value={formData.saleOff}
                                    onChange={handleInputChange}
                                    min="0"
                                    max="100"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Original Price</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={calculateOriginalPrice(formData.vaccineDetails).toFixed(2)}
                                    disabled
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Final Price (After Discount)</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="price"
                                    value={formData.price}
                                    disabled
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Status</Form.Label>
                                <Form.Select
                                    name="status"
                                    value={formData.status}
                                    onChange={e => handleInputChange({
                                        target: {
                                            name: 'status',
                                            value: e.target.value === 'true'
                                        }
                                    })}
                                >
                                    <option value={true}>Active</option>
                                    <option value={false}>Inactive</option>
                                </Form.Select>
                            </Form.Group>

                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <h5>Vaccines in Combo</h5>
                                    <Button
                                        variant="success"
                                        size="sm"
                                        onClick={handleAddVaccineDetail}
                                    >
                                        <FontAwesomeIcon icon={faPlus} /> Add Vaccine
                                    </Button>
                                </div>
                                {formData.vaccineDetails.map((detail, index) => (
                                    <div key={index} className="border p-3 mb-2">
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Vaccine</Form.Label>
                                                    <Form.Select
                                                        value={detail.vaccineId}
                                                        onChange={(e) => handleVaccineDetailChange(index, 'vaccineId', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Select Vaccine</option>
                                                        {vaccines.map(vaccine => (
                                                            <option key={vaccine.id} value={vaccine.id}>
                                                                {vaccine.name} ({vaccine.dose} doses)
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={5}>
                                                <Form.Group>
                                                    <Form.Label>Age Group</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={detail.ageGroup}
                                                        onChange={(e) => handleVaccineDetailChange(index, 'ageGroup', e.target.value)}
                                                        placeholder="e.g., 0-6 months"
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={1} className="d-flex align-items-end">
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleRemoveVaccineDetail(index)}
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} />
                                                        </Button>
                                                    </Col>
                                        </Row>
                                    </div>
                                ))}
                            </div>
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

export default VaccineComboManage; 