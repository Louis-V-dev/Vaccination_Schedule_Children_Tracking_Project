import React, { useState, useEffect } from "react";
import { Button, Col, Container, Form, Modal, Row, Table } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import vaccineService from "../services/vaccineService";
import comboService from "../services/comboService";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ComboManage() {
    const [showModal, setShowModal] = useState(false);
    const [comboName, setComboName] = useState("");
    const [comboDescription, setComboDescription] = useState("");
    const [selectedVaccines, setSelectedVaccines] = useState([]);
    const [targetAgeGroup, setTargetAgeGroup] = useState("");
    const [salePercentage, setSalePercentage] = useState(0);
    const [comboCategory, setComboCategory] = useState("");
    const [newComboCategory, setNewComboCategory] = useState("");
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [vaccines, setVaccines] = useState([]);
    const [combos, setCombos] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchVaccines();
        fetchCombos();
    }, []);

    const fetchVaccines = async () => {
        try {
            const data = await vaccineService.getAllVaccines();
            setVaccines(data);
        } catch (error) {
            toast.error("Failed to fetch vaccines: " + error.message);
        }
    };

    const fetchCombos = async () => {
        try {
            setLoading(true);
            const data = await comboService.getAllCombos();
            setCombos(data);
        } catch (error) {
            toast.error("Failed to fetch combos: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            fetchCombos();
            return;
        }
        try {
            setLoading(true);
            const data = await comboService.searchCombos(searchTerm);
            setCombos(data);
        } catch (error) {
            toast.error("Failed to search combos: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        clearForm();
    };

    const handleShowModal = () => setShowModal(true);

    const clearForm = () => {
        setComboName("");
        setComboDescription("");
        setSelectedVaccines([]);
        setTargetAgeGroup("");
        setSalePercentage(0);
        setComboCategory("");
        setNewComboCategory("");
        setErrors({});
        setIsEditing(false);
        setEditingId(null);
    };

    const handleVaccineSelect = (vaccineId) => {
        const selectedVaccine = vaccines.find((v) => v.id === vaccineId);
        if (!selectedVaccine) return;

        const existingIndex = selectedVaccines.findIndex(
            (item) => item.vaccineId === vaccineId
        );

        if (existingIndex > -1) {
            const updatedVaccines = [...selectedVaccines];
            updatedVaccines.splice(existingIndex, 1);
            setSelectedVaccines(updatedVaccines);
        } else {
            setSelectedVaccines([
                ...selectedVaccines,
                { vaccineId: vaccineId, vaccineName: selectedVaccine.name, doses: 1 }
            ]);
        }
    };

    const handleDoseChange = (vaccineId, newDoses) => {
        setSelectedVaccines((prevVaccines) =>
            prevVaccines.map((vaccine) =>
                vaccine.vaccineId === vaccineId
                    ? { ...vaccine, doses: parseInt(newDoses, 10) || 0 }
                    : vaccine
            )
        );
    };

    const handleSave = async () => {
        const newErrors = {};
        if (!comboName.trim()) newErrors.comboName = "Combo Name is required";
        if (selectedVaccines.length === 0) newErrors.selectedVaccines = "At least one vaccine must be selected";
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);
            const comboData = {
                comboName: comboName.trim(),
                description: comboDescription.trim(),
                vaccines: selectedVaccines.map(v => ({
                    vaccineId: v.vaccineId,
                    doses: v.doses,
                    ageGroup: targetAgeGroup,
                    saleOff: salePercentage
                })),
                status: true
            };

            if (isEditing) {
                await comboService.updateCombo(editingId, comboData);
                toast.success("Combo updated successfully!");
            } else {
                await comboService.addCombo(comboData);
                toast.success("Combo added successfully!");
            }

            fetchCombos();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving combo:', error);
            toast.error(`Failed to ${isEditing ? 'update' : 'add'} combo: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (combo) => {
        setIsEditing(true);
        setEditingId(combo.id);
        setComboName(combo.comboName);
        setComboDescription(combo.description || "");
        setSelectedVaccines(combo.vaccines.map(v => ({
            vaccineId: v.vaccineId,
            vaccineName: vaccines.find(vac => vac.id === v.vaccineId)?.name || '',
            doses: v.doses
        })));
        setTargetAgeGroup(combo.vaccines[0]?.ageGroup || "");
        setSalePercentage(combo.vaccines[0]?.saleOff || 0);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this combo?")) {
            try {
                setLoading(true);
                await comboService.deleteCombo(id);
                toast.success("Combo deleted successfully!");
                fetchCombos();
            } catch (error) {
                toast.error("Failed to delete combo: " + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <>
            <Sidebar />
            <Container>
                <h1>Combo Management</h1>
                
                <Row className="mb-3">
                    <Col md={6}>
                        <Form.Group className="d-flex">
                            <Form.Control
                                type="text"
                                placeholder="Search combos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button variant="primary" onClick={handleSearch} className="ms-2">
                                Search
                            </Button>
                        </Form.Group>
                    </Col>
                    <Col md={6} className="text-end">
                        <Button variant="primary" onClick={handleShowModal}>
                            Add New Combo
                        </Button>
                    </Col>
                </Row>

                {loading ? (
                    <div className="text-center">Loading...</div>
                ) : (
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Vaccines</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {combos.map((combo) => (
                                <tr key={combo.id}>
                                    <td>{combo.comboName}</td>
                                    <td>{combo.description}</td>
                                    <td>
                                        {combo.vaccines.map((v, index) => (
                                            <div key={index}>
                                                {vaccines.find(vac => vac.id === v.vaccineId)?.name} 
                                                ({v.doses} doses)
                                            </div>
                                        ))}
                                    </td>
                                    <td>{combo.status ? "Active" : "Inactive"}</td>
                                    <td>
                                        <Button variant="primary" size="sm" onClick={() => handleEdit(combo)} className="me-2">
                                            Edit
                                        </Button>
                                        <Button variant="danger" size="sm" onClick={() => handleDelete(combo.id)}>
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}

                <Modal show={showModal} onHide={handleCloseModal} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>{isEditing ? 'Edit Combo' : 'Add New Combo'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3" controlId="formGridComboName">
                                <Form.Label>Combo Name *</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter Combo Name"
                                    value={comboName}
                                    onChange={(e) => setComboName(e.target.value)}
                                    isInvalid={!!errors.comboName}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.comboName}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formGridComboDescription">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Enter Combo Description"
                                    value={comboDescription}
                                    onChange={(e) => setComboDescription(e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formGridVaccines">
                                <Form.Label>Select Vaccines *</Form.Label>
                                {errors.selectedVaccines && (
                                    <div className="text-danger">{errors.selectedVaccines}</div>
                                )}
                                {vaccines.map((vaccine) => (
                                    <div key={vaccine.id} className="mb-2">
                                        <Form.Check
                                            type="checkbox"
                                            id={`vaccine-${vaccine.id}`}
                                            label={vaccine.name}
                                            checked={selectedVaccines.some(
                                                (v) => v.vaccineId === vaccine.id
                                            )}
                                            onChange={() => handleVaccineSelect(vaccine.id)}
                                            inline
                                        />
                                        {selectedVaccines.some((v) => v.vaccineId === vaccine.id) && (
                                            <Form.Control
                                                type="number"
                                                min="1"
                                                value={
                                                    selectedVaccines.find(
                                                        (v) => v.vaccineId === vaccine.id
                                                    ).doses
                                                }
                                                onChange={(e) =>
                                                    handleDoseChange(vaccine.id, e.target.value)
                                                }
                                                style={{
                                                    width: "80px",
                                                    display: "inline-block",
                                                    marginLeft: "10px",
                                                }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </Form.Group>

                            <Row className="mb-3">
                                <Form.Group as={Col} controlId="formGridTargetAgeGroup">
                                    <Form.Label>Target Age Group</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Target Age Group"
                                        value={targetAgeGroup}
                                        onChange={(e) => setTargetAgeGroup(e.target.value)}
                                    />
                                </Form.Group>

                                <Form.Group as={Col} controlId="formGridSalePercentage">
                                    <Form.Label>Sale Percentage</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={salePercentage}
                                        onChange={(e) => setSalePercentage(e.target.value)}
                                    />
                                </Form.Group>
                            </Row>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </>
    );
}

export default ComboManage;