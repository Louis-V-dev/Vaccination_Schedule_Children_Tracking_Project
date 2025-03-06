import React, { useState, useEffect } from "react";
import { Button, Col, Container, Form, Modal, Row, Table, Alert, InputGroup } from "react-bootstrap";
import Sidebar from "../components/Sidebar"; // Assuming Sidebar is correctly implemented
import vaccineService from "../services/vaccineService";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";
import AdminLayout from './AdminLayout';
import DoseIntervalForm from './DoseIntervalForm';
import { createInterval, deleteAllIntervalsForVaccine, getIntervalsForVaccine, createIntervalsWithRetry, createMultipleIntervals } from '../services/doseIntervalService';

// Get auth header function
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }
    return { Authorization: `Bearer ${token}` };
};

function VaccineManage() {
    const [show, setShow] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [vaccineName, setVaccineName] = useState("");
    const [description, setDescription] = useState("");
    const [origin, setOrigin] = useState("");
    const [instructions, setInstructions] = useState("");
    const [contraindications, setContraindications] = useState("");
    const [precautions, setPrecautions] = useState("");
    const [interactions, setInteractions] = useState("");
    const [sideEffects, setSideEffects] = useState("");
    const [storageInstructions, setStorageInstructions] = useState("");
    const [targetGroups, setTargetGroups] = useState("");
    const [schedule, setSchedule] = useState("");
    const [postVaccinationReactions, setPostVaccinationReactions] = useState("");
    const [productionDate, setProductionDate] = useState("");
    const [vaccineImage, setVaccineImage] = useState(null); // Store the image file
    const [quantity, setQuantity] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [status, setStatus] = useState("Active"); // Default to Active
    const [vaccineType, setVaccineType] = useState("");
    const [price, setPrice] = useState(""); // Add price state
    const [newCategoryName, setNewCategoryName] = useState("");
    const [vaccineCategories, setVaccineCategories] = useState([]);
    const [categoryError, setCategoryError] = useState("");

    const [errors, setErrors] = useState({});
    const [vaccines, setVaccines] = useState([]); // Initialize as an empty array

    // Add loading and search states
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Add this state variable
    const [showIntervalModal, setShowIntervalModal] = useState(false);
    const [selectedVaccineId, setSelectedVaccineId] = useState(null);

    const [totalDoses, setTotalDoses] = useState(1); // Total number of doses
    const [intervalDays, setIntervalDays] = useState([]); // Array of interval days between doses
    const [intervalUnits, setIntervalUnits] = useState({});

    // Add this state variable
    const [hasExistingIntervals, setHasExistingIntervals] = useState(false);

    // Fetch vaccines and categories on component mount
    useEffect(() => {
        fetchVaccines();
        fetchCategories();
    }, []);

    const fetchVaccines = async () => {
        try {
            setLoading(true);
            const data = await vaccineService.getAllVaccines();
            console.log('Vaccines fetched successfully:', data);
            setVaccines(data);
        } catch (error) {
            console.error('Vaccine fetch error:', error);
            
            // Only redirect on authentication errors
            if (error.message?.includes('Authentication error')) {
                toast.error("Authentication problem. Please log in again.");
                setTimeout(() => window.location.href = '/login', 3000);
            } else {
                toast.error("Failed to fetch vaccines: " + (error.message || "Unknown error"));
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const headers = getAuthHeader();
            console.log('Fetching categories with headers:', headers);
            
            // The correct endpoint for categories is /api/vaccines/categories, not /api/categories/all
            try {
                const response = await axios.get('http://localhost:8080/api/vaccines/categories', {
                    headers: headers
                });
                console.log('Categories response:', response.data);
                setVaccineCategories(response.data || []);
            } catch (error) {
                console.error('Error fetching categories:', error.response?.status, error.response?.data);
                
                // Handle authentication errors
                if (error.response?.status === 403 || error.response?.status === 401) {
                    toast.error("Authentication error. Please log in again.");
                    setTimeout(() => window.location.href = '/login', 3000);
                } else {
                    toast.error("Failed to fetch vaccine categories");
                }
            }
        } catch (error) {
            console.error('Outer error fetching categories:', error);
            toast.error("Failed to fetch vaccine categories");
        }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            fetchVaccines();
            return;
        }
        try {
            setLoading(true);
            const data = await vaccineService.searchVaccines(searchTerm);
            setVaccines(data);
        } catch (error) {
            toast.error("Failed to search vaccines: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setShow(false);
        setShowCategoryModal(false);
        clearForm();
        setIsEditing(false);
        setEditingId(null);
        setHasExistingIntervals(false);
    };
    const handleShow = () => setShow(true);

    const clearForm = () => {
        setVaccineName("");
        setDescription("");
        setOrigin("");
        setInstructions("");
        setContraindications("");
        setPrecautions("");
        setInteractions("");
        setSideEffects("");
        setStorageInstructions("");
        setTargetGroups("");
        setSchedule("");
        setPostVaccinationReactions("");
        setQuantity("");
        setExpiryDate("");
        setProductionDate("");
        setStatus("Active");
        setVaccineType("");
        setPrice("");
        setVaccineImage(null);
        setNewCategoryName("");
        setErrors({});
        setTotalDoses(1);
        setIntervalDays([]);
        setIntervalUnits({});
    };

    const handleEdit = (vaccine) => {
        setIsEditing(true);
        setEditingId(vaccine.id);
        setVaccineName(vaccine.name || "");
        setDescription(vaccine.description || "");
        setOrigin(vaccine.manufacturer || "");
        
        // Extract total doses from dosage field if possible
        const dosageMatch = vaccine.dosage ? vaccine.dosage.match(/(\d+)\s*dose/) : null;
        const doses = dosageMatch ? parseInt(dosageMatch[1]) : 1;
        setTotalDoses(doses);
        
        // Initialize interval days array and units
        const initialIntervalDays = Array(doses - 1).fill(28);
        setIntervalDays(initialIntervalDays);
        
        // Initialize interval units as days by default
        const initialUnits = {};
        for (let i = 1; i < doses; i++) {
            initialUnits[i] = 'days';
        }
        setIntervalUnits(initialUnits);
        
        // Don't set instructions to dosage, as we're using dosage for total doses
        setInstructions("");
        setContraindications(vaccine.contraindications || "");
        setPrecautions(vaccine.precautions || "");
        setInteractions(vaccine.interactions || "");
        setSideEffects(vaccine.adverseReactions || "");
        setStorageInstructions(vaccine.storageConditions || "");
        setTargetGroups(vaccine.recommended || "");
        setSchedule(vaccine.preVaccination || "");
        setPostVaccinationReactions(vaccine.compatibility || "");
        setQuantity(vaccine.quantity?.toString() || "");
        setExpiryDate(vaccine.expirationDate ? vaccine.expirationDate.split('T')[0] : "");
        setProductionDate(vaccine.productionDate ? vaccine.productionDate.split('T')[0] : "");
        setStatus(vaccine.status === "true" ? "Active" : "Inactive");
        setVaccineType(vaccine.categoryName || "");
        setPrice(vaccine.price?.toString() || "");
        
        setShow(true);
        
        // If editing and there are multiple doses, fetch the intervals
        if (doses > 1) {
            fetchIntervalsForVaccine(vaccine.id);
        }
    };

    const fetchIntervalsForVaccine = async (vaccineId) => {
        try {
            const intervals = await getIntervalsForVaccine(vaccineId);
            console.log('Fetched intervals:', intervals);
            
            if (intervals && intervals.length > 0) {
                // Set flag that this vaccine has existing intervals
                setHasExistingIntervals(true);
                
                // Sort intervals by fromDose to ensure correct order
                intervals.sort((a, b) => a.fromDose - b.fromDose);
                
                // Create a new array with the correct interval days
                const newIntervalDays = [];
                for (let i = 0; i < intervals.length; i++) {
                    const interval = intervals[i];
                    // Make sure the interval is for consecutive doses
                    if (interval.fromDose === i + 1 && interval.toDose === i + 2) {
                        newIntervalDays[i] = interval.intervalDays;
                    }
                }
                
                // Update the interval days state
                setIntervalDays(newIntervalDays);
            } else {
                setHasExistingIntervals(false);
            }
        } catch (error) {
            console.error('Error fetching intervals:', error);
            toast.error('Failed to load dose intervals. Using default values.');
            setHasExistingIntervals(false);
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            console.log('Selected image file:', file);
            setVaccineImage(file);
        }
    };

    const handleTotalDosesChange = (e) => {
        const newValue = e.target.value === '' ? '' : parseInt(e.target.value);
        setTotalDoses(newValue);
        
        // Update interval days array based on new doses
        const newIntervalDays = [];
        const newIntervalUnits = { ...intervalUnits };
        
        if (newValue > 1) {
            for (let i = 1; i < newValue; i++) {
                // Keep existing values and units if available
                if (i <= intervalDays.length) {
                    newIntervalDays.push(intervalDays[i-1]);
                } else {
                    newIntervalDays.push(0);
                    newIntervalUnits[i] = 'days'; // Set default unit for new intervals
                }
            }
            
            // Remove units for intervals that no longer exist
            Object.keys(newIntervalUnits).forEach(key => {
                if (parseInt(key) >= newValue - 1) {
                    delete newIntervalUnits[key];
                }
            });
        }
        
        setIntervalDays(newIntervalDays);
        setIntervalUnits(newIntervalUnits);
    };

    const handleIntervalChange = (index, value) => {
        const newIntervalDays = [...intervalDays];
        const unit = intervalUnits[index + 1] || 'days';
        // Convert to days if unit is months
        const convertedValue = unit === 'months' ? value * 30 : value;
        newIntervalDays[index] = parseInt(convertedValue) || 0;
        setIntervalDays(newIntervalDays);
    };

    const handleUnitChange = (index, unit) => {
        const newUnits = { ...intervalUnits };
        const oldUnit = newUnits[index + 1] || 'days';
        newUnits[index + 1] = unit;
        setIntervalUnits(newUnits);

        // Convert the value when changing units
        const currentValue = intervalDays[index];
        if (currentValue) {
            const newValue = unit === 'months' ? 
                Math.round(currentValue / 30) : 
                currentValue * 30;
            handleIntervalChange(index, newValue);
        }
    };

    const handleSave = async () => {
        const newErrors = {};
        if (!vaccineName.trim()) newErrors.vaccineName = "Vaccine Name is required";
        if (!origin.trim()) newErrors.origin = "Origin is required";
        if (!quantity || isNaN(quantity) || parseInt(quantity) <= 0) newErrors.quantity = "Quantity must be a positive number";
        if (!expiryDate) newErrors.expiryDate = "Expiry Date is required";
        if (!productionDate) newErrors.productionDate = "Production Date is required";
        if (!vaccineType) newErrors.vaccineType = "Vaccine Category is required";
        if (!price || isNaN(price) || parseFloat(price) < 0) newErrors.price = "Price must be a non-negative number";

        // Validate production date is before expiry date
        if (productionDate && expiryDate) {
            const prodDate = new Date(productionDate);
            const expDate = new Date(expiryDate);
            if (prodDate >= expDate) {
                newErrors.productionDate = "Production Date must be before Expiry Date";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            
            // Format dates to match backend expectations (YYYY-MM-DD)
            const formattedProductionDate = new Date(productionDate).toISOString().split('T')[0];
            const formattedExpiryDate = new Date(expiryDate).toISOString().split('T')[0];
            
            // Ensure numeric values are properly formatted
            const formattedPrice = parseFloat(price).toFixed(2);
            const formattedQuantity = Math.max(0, parseInt(quantity, 10));
            
            // Basic required fields
            formData.append('name', vaccineName.trim());
            formData.append('manufacturer', origin.trim());
            formData.append('quantity', formattedQuantity);
            formData.append('expirationDate', formattedExpiryDate);
            formData.append('productionDate', formattedProductionDate);
            formData.append('price', formattedPrice);
            formData.append('categoryName', vaccineType);
            formData.append('status', status === "Active" ? "true" : "false");
            formData.append('dosage', `${totalDoses} dose(s)`);

            // Optional fields - only append if they have values
            if (description?.trim()) formData.append('description', description.trim());
            if (contraindications?.trim()) formData.append('contraindications', contraindications.trim());
            if (precautions?.trim()) formData.append('precautions', precautions.trim());
            if (interactions?.trim()) formData.append('interactions', interactions.trim());
            if (sideEffects?.trim()) formData.append('adverseReactions', sideEffects.trim());
            if (storageInstructions?.trim()) formData.append('storageConditions', storageInstructions.trim());
            if (targetGroups?.trim()) formData.append('recommended', targetGroups.trim());
            if (schedule?.trim()) formData.append('preVaccination', schedule.trim());
            if (postVaccinationReactions?.trim()) formData.append('compatibility', postVaccinationReactions.trim());

            // Handle image upload
            if (vaccineImage instanceof File) {
                formData.append('imagineUrl', vaccineImage);
            }

            // Log the form data for debugging
            console.log('Sending form data:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}: ${value}`);
            }

            let response;
            let savedVaccineData;
            
            if (isEditing) {
                console.log('Updating vaccine with ID:', editingId);
                savedVaccineData = await vaccineService.updateVaccine(editingId, formData);
                console.log('Update response:', savedVaccineData);
            } else {
                console.log('Adding new vaccine');
                response = await vaccineService.addVaccine(formData);
                savedVaccineData = response.data;
                console.log('Add response:', savedVaccineData);
            }

            if (savedVaccineData) {
                const savedVaccineId = isEditing ? editingId : savedVaccineData.id;
                
                if (savedVaccineId && totalDoses > 1) {
                    try {
                        const intervalDataArray = intervalDays.map((days, index) => {
                            const unit = intervalUnits[index + 1] || 'days';
                            const convertedDays = unit === 'months' ? days * 30 : days;
                            return {
                                fromDose: index + 1,
                                toDose: index + 2,
                                intervalDays: convertedDays
                            };
                        });

                        await createMultipleIntervals(savedVaccineId, intervalDataArray);
                    } catch (intervalError) {
                        console.error('Error saving intervals:', intervalError);
                        toast.warning("Vaccine saved but there was an issue with intervals");
                    }
                }

                toast.success(isEditing ? "Vaccine updated successfully!" : "Vaccine added successfully!");
                fetchVaccines();
                handleClose();
            } else {
                throw new Error('No response data received');
            }
        } catch (error) {
            console.error('Error saving vaccine:', error);
            console.error('Error details:', error.response?.data);
            
            let errorMessage = "Failed to save vaccine";
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.code === 9999) {
                errorMessage = "Server error. Please check all fields and try again.";
            }
            
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this vaccine?")) {
            try {
                setLoading(true);
                await vaccineService.deleteVaccine(id);
                toast.success("Vaccine deleted successfully!");
                fetchVaccines();
            } catch (error) {
                toast.error("Failed to delete vaccine: " + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddCategory = async () => {
        try {
            setCategoryError("");
            if (!newCategoryName.trim()) {
                setCategoryError("Category name is required");
                return;
            }

            const headers = getAuthHeader();
            console.log('Adding category with payload:', { categoryName: newCategoryName.trim() });
            const response = await axios.post(
                'http://localhost:8080/api/categories/add', 
                { categoryName: newCategoryName.trim() },
                { headers }
            );

            if (response.data) {
                // Show success toast that auto-dismisses after 1 second
                toast.success("Category added successfully", {
                    autoClose: 1000
                });
                
                // Update categories list and select the new category
                await fetchCategories();
                setVaccineType(response.data.categoryName);
                setNewCategoryName("");
                setShowCategoryModal(false);
            }
        } catch (error) {
            console.error('Error adding category:', error);
            console.log('Error response:', error.response?.data);
            if (error.response?.status === 403) {
                toast.error("Authentication error. Please log in again.");
                window.location.href = '/login';
            } else {
                const errorMessage = error.response?.data?.message || "Failed to add category";
                setCategoryError(errorMessage);
                toast.error(errorMessage);
            }
        }
    };

    // Add this function to handle opening the interval modal
    const handleManageIntervals = (vaccineId) => {
        setSelectedVaccineId(vaccineId);
        setShowIntervalModal(true);
    };

    return (
        <AdminLayout>
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Vaccine Management</h1>
                    <Button variant="primary" onClick={() => handleShow()}>
                            Add New Vaccine
                        </Button>
                </div>

                {loading && <Alert variant="info">Loading vaccines...</Alert>}

                <div className="table-responsive">
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Manufacturer</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Production Date</th>
                                <th>Expiry Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vaccines.map((vaccine) => (
                                <tr key={vaccine.id}>
                                    <td style={{ width: '100px' }}>
                                        {vaccine.imagineUrl ? (
                                            <img
                                                src={`http://localhost:8080/api/vaccines/images/${vaccine.imagineUrl}`}
                                                alt={vaccine.name}
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                                                onError={(e) => {
                                                    console.error('Image load error for:', vaccine.imagineUrl);
                                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZWVlIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSIjYWFhIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                                                }}
                                            />
                                        ) : (
                                            <div style={{ 
                                                width: '50px', 
                                                height: '50px', 
                                                background: '#eee',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '4px',
                                                color: '#aaa',
                                                fontSize: '10px'
                                            }}>
                                                No Image
                                            </div>
                                        )}
                                    </td>
                                    <td>{vaccine.name}</td>
                                    <td>{vaccine.categoryName || 'N/A'}</td>
                                    <td>{vaccine.manufacturer}</td>
                                    <td>{vaccine.quantity}</td>
                                    <td>{vaccine.price ? Number(vaccine.price).toLocaleString('de-DE') : '0'}</td>
                                    <td>{vaccine.productionDate}</td>
                                    <td>{vaccine.expirationDate}</td>
                                    <td>{vaccine.status === "true" ? "Active" : "Inactive"}</td>
                                    <td>
                                        <Button variant="primary" size="sm" onClick={() => handleEdit(vaccine)} className="me-2">
                                            Edit
                                        </Button>
                                        <Button variant="danger" size="sm" onClick={() => handleDelete(vaccine.id)}>
                                            Delete
                                        </Button>
                                        <Button variant="info" size="sm" onClick={() => handleManageIntervals(vaccine.id)}>
                                            Manage Intervals
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                <Modal show={show} onHide={handleClose} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>{isEditing ? 'Edit Vaccine' : 'Add New Vaccine'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Row className="mb-3">
                                <Form.Group as={Col} controlId="formGridVaccineName">
                                    <Form.Label>Vaccine Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Vaccine Name"
                                        value={vaccineName}
                                        onChange={(e) => setVaccineName(e.target.value)}
                                        isInvalid={!!errors.vaccineName}
                                        aria-label="Vaccine Name"
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.vaccineName}</Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group as={Col} controlId="formGridOrigin">
                                    <Form.Label>Origin *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Origin"
                                        value={origin}
                                        onChange={(e) => setOrigin(e.target.value)}
                                        isInvalid={!!errors.origin}
                                        aria-label="Origin"
                                    />
                                     <Form.Control.Feedback type="invalid">{errors.origin}</Form.Control.Feedback>
                                </Form.Group>
                            </Row>

                            <Form.Group className="mb-3" controlId="formGridDescription">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Enter Description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    aria-label="Description"
                                />
                            </Form.Group>

                            <Row className="mb-3">
                                <Form.Group as={Col} controlId="formGridInstructions">
                                    <Form.Label>Administration Instructions</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Enter Administration Instructions"
                                        value={instructions}
                                        onChange={(e) => setInstructions(e.target.value)}
                                        aria-label="Administration Instructions"
                                    />
                                </Form.Group>

                                <Form.Group as={Col} controlId="formGridContraindications">
                                    <Form.Label>Contraindications</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Enter Contraindications"
                                        value={contraindications}
                                        onChange={(e) => setContraindications(e.target.value)}
                                        aria-label="Contraindications"
                                    />
                                </Form.Group>
                            </Row>

                            <Row className="mb-3">
                                <Form.Group as={Col} controlId="formGridPrecautions">
                                    <Form.Label>Precautions</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Enter Precautions"
                                        value={precautions}
                                        onChange={(e) => setPrecautions(e.target.value)}
                                        aria-label="Precautions"
                                    />
                                </Form.Group>

                                <Form.Group as={Col} controlId="formGridInteractions">
                                    <Form.Label>Interactions</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Enter Interactions"
                                        value={interactions}
                                        onChange={(e) => setInteractions(e.target.value)}
                                        aria-label="Interactions"
                                    />
                                </Form.Group>
                            </Row>

                            <Row className="mb-3">
                                 <Form.Group as={Col} controlId="formGridSideEffects">
                                    <Form.Label>Side Effects</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Enter Side Effects"
                                        value={sideEffects}
                                        onChange={(e) => setSideEffects(e.target.value)}
                                        aria-label="Side Effects"
                                    />
                                </Form.Group>

                                <Form.Group as={Col} controlId="formGridStorageInstructions">
                                    <Form.Label>Storage Instructions</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Enter Storage Instructions"
                                        value={storageInstructions}
                                        onChange={(e) => setStorageInstructions(e.target.value)}
                                        aria-label="Storage Instructions"
                                    />
                                </Form.Group>
                            </Row>
                            <Row className="mb-3">
                                <Form.Group as={Col} controlId="formGridTargetGroups">
                                        <Form.Label>Target Groups</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Enter Target Groups"
                                            value={targetGroups}
                                            onChange={(e) => setTargetGroups(e.target.value)}
                                            aria-label="Target Groups"
                                        />
                                </Form.Group>

                                <Form.Group as={Col} controlId="formGridSchedule">
                                    <Form.Label>Schedule</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter Schedule"
                                        value={schedule}
                                        onChange={(e) => setSchedule(e.target.value)}
                                        aria-label="Schedule"
                                    />
                                </Form.Group>
                            </Row>
                            <Row className="mb-3">
                                  <Form.Group as={Col} controlId="formGridPostVaccinationReactions">
                                    <Form.Label>Post-Vaccination Reactions</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Enter Post-Vaccination Reactions"
                                        value={postVaccinationReactions}
                                        onChange={(e) => setPostVaccinationReactions(e.target.value)}
                                        aria-label="Post-Vaccination Reactions"
                                    />
                                </Form.Group>

                                <Form.Group as={Col} controlId="formGridProductionDate">
                                    <Form.Label>Production Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={productionDate || ""}
                                        onChange={(e) => setProductionDate(e.target.value)}
                                        aria-label="Production Date"
                                    />
                                </Form.Group>
                            </Row>
                            <Row className="mb-3">
                                <Form.Group as={Col} controlId="formGridExpiryDate">
                                    <Form.Label>Expiry Date *</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={expiryDate || ""}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        isInvalid={!!errors.expiryDate}
                                        aria-label="Expiry Date"
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.expiryDate}</Form.Control.Feedback>
                                </Form.Group>

                                 <Form.Group as={Col} controlId="formGridQuantity">
                                    <Form.Label>Quantity *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Enter Quantity"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        isInvalid={!!errors.quantity}
                                        aria-label="Quantity"
                                    />
                                     <Form.Control.Feedback type="invalid">{errors.quantity}</Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group as={Col} controlId="formGridPrice">
                                    <Form.Label>Price *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        placeholder="Enter Price"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        isInvalid={!!errors.price}
                                        aria-label="Price"
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.price}</Form.Control.Feedback>
                                </Form.Group>
                            </Row>
                            <Row className="mb-3">
                                    <Form.Group as={Col} controlId="formGridStatus">
                                        <Form.Label>Status</Form.Label>
                                        <Form.Select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            aria-label="Status"
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </Form.Select>
                                    </Form.Group>
                                     <Form.Group as={Col} controlId="formGridVaccineType">
                                        <Form.Label>Vaccine Category *</Form.Label>
                                        <div className="d-flex">
                                        <Form.Select
                                            value={vaccineType}
                                            onChange={(e) => setVaccineType(e.target.value)}
                                            isInvalid={!!errors.vaccineType}
                                                aria-label="Vaccine Category"
                                                className="me-2"
                                            >
                                                <option value="">Select a category...</option>
                                                {vaccineCategories.map((category) => (
                                                    <option key={category.categoryId} value={category.categoryName}>
                                                        {category.categoryName}
                                                    </option>
                                                ))}
                                        </Form.Select>
                                            <Button variant="outline-primary" onClick={() => setShowCategoryModal(true)}>
                                                Add New
                                            </Button>
                                        </div>
                                        <Form.Control.Feedback type="invalid">{errors.vaccineType}</Form.Control.Feedback>
                                    </Form.Group>

                            </Row>

                            <Form.Group controlId="formGridImage" className="mb-3">
                                <Form.Label>Vaccine Image</Form.Label>
                                <Form.Control
                                    type="file"
                                    onChange={handleImageChange}
                                    aria-label="Vaccine Image"

                                />
                            </Form.Group>

                            <Row className="mb-3">
                                <Form.Group className="mb-3" controlId="totalDoses">
                                    <Form.Label>Total Doses</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        value={totalDoses}
                                        onChange={handleTotalDosesChange}
                                        isInvalid={!!errors.totalDoses}
                                        placeholder="Enter number of doses"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.totalDoses}
                                    </Form.Control.Feedback>
                                    <Form.Text className="text-muted">
                                        Total number of doses required for this vaccine
                                    </Form.Text>
                                </Form.Group>
                            </Row>

                            {isEditing && hasExistingIntervals && totalDoses > 1 && (
                                <Alert variant="info" className="mt-2">
                                    <strong>Note:</strong> This vaccine already has dose intervals. Changing the number of doses or interval days will update the existing intervals.
                                </Alert>
                            )}

                            {totalDoses > 1 && (
                                <div className="mt-3 mb-3">
                                    <h5>Dose Intervals</h5>
                                    <p className="text-muted">Specify the time between doses</p>
                                    {intervalDays.map((days, index) => {
                                        const unit = intervalUnits[index + 1] || 'days';
                                        const displayValue = unit === 'months' ? Math.round(days / 30) : days;
                                        return (
                                            <Form.Group key={index} className="mb-2">
                                                <Form.Label>Time between dose {index + 1} and dose {index + 2}</Form.Label>
                                                <InputGroup>
                                                    <Form.Control
                                                        type="number"
                                                        min="0"
                                                        value={displayValue}
                                                        onChange={(e) => handleIntervalChange(index, e.target.value)}
                                                        isInvalid={!!errors[`interval_${index}`]}
                                                    />
                                                    <Form.Select
                                                        value={unit}
                                                        onChange={(e) => handleUnitChange(index, e.target.value)}
                                                    >
                                                        <option value="days">Days</option>
                                                        <option value="months">Months</option>
                                                    </Form.Select>
                                                    <Form.Control.Feedback type="invalid">
                                                        {errors[`interval_${index}`]}
                                                    </Form.Control.Feedback>
                                                </InputGroup>
                                            </Form.Group>
                                        );
                                    })}
                                </div>
                            )}
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            Save Changes
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Add Category Modal */}
                <Modal show={showCategoryModal} onHide={() => {
                    setShowCategoryModal(false);
                    setNewCategoryName("");
                    setCategoryError("");
                }}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add New Vaccine Category</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group controlId="formNewCategory">
                            <Form.Label>Category Name *</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter category name"
                                value={newCategoryName || ""}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                isInvalid={!!categoryError}
                            />
                            <Form.Control.Feedback type="invalid">
                                {categoryError}
                            </Form.Control.Feedback>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => {
                            setShowCategoryModal(false);
                            setNewCategoryName("");
                            setCategoryError("");
                        }}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handleAddCategory}>
                            Add Category
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Add this to the render function, inside the return statement, after the other modals */}
                <Modal show={showIntervalModal} onHide={() => setShowIntervalModal(false)} size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>Manage Dose Intervals</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedVaccineId && (
                            <DoseIntervalForm 
                                vaccine={vaccines.find(v => v.id === selectedVaccineId)} 
                                onClose={() => {
                                    setShowIntervalModal(false);
                                    setSelectedVaccineId(null);
                                    fetchVaccines();
                                }} 
                            />
                        )}
                    </Modal.Body>
                </Modal>
            </Container>
        </AdminLayout>
    );
}

export default VaccineManage;