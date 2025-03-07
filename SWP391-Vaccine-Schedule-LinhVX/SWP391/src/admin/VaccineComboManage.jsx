import React, { useState, useEffect } from "react";
import { Container, Table, Button, Modal, Form, Alert, Row, Col } from "react-bootstrap";
import { toast } from 'react-toastify';
import vaccineComboService from "../services/vaccineComboService";
import vaccineService from "../services/vaccineService";
import comboCategoryService from "../services/comboCategoryService";
import AdminLayout from './AdminLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

function VaccineComboManage() {
    const [combos, setCombos] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [selectedCombo, setSelectedCombo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        comboName: "",
        description: "",
        price: "0",
        saleOff: 0,
        status: true,
        minAge: 0,
        maxAge: 0,

        categories: [],
        vaccineIds: []
    });
    const [categoryForm, setCategoryForm] = useState({
        comboCategoryName: ""
    });

    // Add state for vaccine prices
    const [vaccinePrices, setVaccinePrices] = useState({});

    useEffect(() => {
        fetchCombos();
        fetchVaccines();
        fetchCategories();
        const token = localStorage.getItem('token');
        console.log('Authentication token:', token ? 'Present' : 'Missing');
        if (!token) {
            toast.error("You are not logged in. Please login to continue.");
        }
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

    const fetchCategories = async () => {
        try {
            const data = await comboCategoryService.getAllCategories();
            console.log("Fetched categories data:", data);
            
            // Ensure categories have the right property structure
            if (data && Array.isArray(data)) {
                // Map the data to ensure it has the right structure
                const processedData = data.map(category => ({
                    id: category.id, // Use the id property
                    categoryId: category.id, // Also keep categoryId for compatibility
                    categoryName: category.comboCategoryName || category.categoryName || "Unknown"
                }));
                
                console.log("Processed categories:", processedData);
                setCategories(processedData);
                return processedData;
            } else {
                console.error("Invalid category data format:", data);
                setCategories([]);
                return [];
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
            toast.error("Failed to fetch combo categories");
            setCategories([]);
            throw err;
        }
    };

    // Calculate total price based on vaccines and combo sale off
    const calculateTotalPrice = (details, saleOff = 0) => {
        const originalPrice = calculateOriginalPrice(details);
        return originalPrice * (1 - (parseFloat(saleOff) || 0) / 100);
    };

    // Calculate original price without discounts
    const calculateOriginalPrice = (vaccineIds) => {
        if (!vaccineIds || !Array.isArray(vaccineIds) || vaccineIds.length === 0) return 0;
        
        // Debug the exact structure of the vaccineIds parameter
        console.log("Calculating price for vaccineIds (raw):", vaccineIds);
        console.log("Type of first item:", vaccineIds[0] !== undefined ? typeof vaccineIds[0] : 'undefined');
        if (typeof vaccineIds[0] === 'object') {
            console.log("Object keys:", vaccineIds[0] ? Object.keys(vaccineIds[0]) : 'null');
        }
        
        // Normalize IDs - extract ID from object if needed
        const normalizedIds = vaccineIds.map(id => {
            if (typeof id === 'object' && id !== null) {
                // If it's an object with vaccineId property, use that
                if (id.vaccineId !== undefined) return Number(id.vaccineId);
                // If it has an 'id' property, use that
                if (id.id !== undefined) return Number(id.id);
                // Otherwise return 0 to avoid NaN issues
                return 0;
            }
            // If it's already a number or string, convert to number
            return Number(id);
        });
        
        console.log("Normalized vaccine IDs:", normalizedIds);
        
        // Calculate total price
        return normalizedIds.reduce((total, vaccineId) => {
            // Skip invalid vaccine IDs
            if (isNaN(vaccineId) || vaccineId === 0) return total;
            
            // Find vaccine by ID
            const vaccine = vaccines.find(v => Number(v.id) === vaccineId);
            
            let price = 0;
            if (vaccine) {
                price = parseFloat(vaccine.price || 0);
            } else if (vaccinePrices[vaccineId]) {
                // Fallback to price map if vaccine object not found
                price = parseFloat(vaccinePrices[vaccineId] || 0);
            }
            
            console.log(`Vaccine ID ${vaccineId}, found: ${!!vaccine}, price: ${price}`);
            
            return total + price;
        }, 0);
    };

    const handleShowModal = (combo = null) => {
        if (combo) {
            console.log("Loading combo for edit:", combo);
            
            // Extract category IDs properly
            let categoryIds = [];
            if (combo.categories && Array.isArray(combo.categories)) {
                categoryIds = combo.categories.map(c => 
                    typeof c === 'object' ? Number(c.categoryId || c.id || 0) : Number(c)
                );
            }
            
            // Extract vaccine IDs properly
            let vaccineIds = [];
            if (combo.vaccines && Array.isArray(combo.vaccines)) {
                vaccineIds = combo.vaccines.map(v => 
                    typeof v === 'object' ? Number(v.vaccineId || v.id || 0) : Number(v)
                );
            }
            
            console.log("Extracted category IDs:", categoryIds);
            console.log("Extracted vaccine IDs:", vaccineIds);
            
            setSelectedCombo(combo);
            setFormData({
                comboName: combo.comboName || "",
                description: combo.description || "",
                price: combo.price?.toString() || "0",
                saleOff: combo.saleOff || 0,
                status: combo.status ?? true,
                minAge: combo.minAge || 0,
                maxAge: combo.maxAge || 0,
                categories: categoryIds,
                vaccineIds: vaccineIds
            });
        } else {
            setSelectedCombo(null);
            setFormData({
                comboName: "",
                description: "",
                price: "0",
                saleOff: 0,
                status: true,
                minAge: 0,
                maxAge: 0,
                categories: [],
                vaccineIds: []
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
            minAge: 0,
            maxAge: 0,
            categories: [],
            vaccineIds: []
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
                { vaccineId: '' }
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
                [field]: field === 'vaccineId' ? parseInt(value) : value // Ensure vaccineId is an integer
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

    const handleShowCategoryModal = () => {
        setCategoryForm({ comboCategoryName: "" });
        setShowCategoryModal(true);
    };

    const handleCloseCategoryModal = () => {
        setShowCategoryModal(false);
        setCategoryForm({ comboCategoryName: "" });
    };

    const handleCategoryInputChange = (e) => {
        const { name, value } = e.target;
        setCategoryForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            console.log('Submitting category:', categoryForm);
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication token is missing');
            }
            
            // The service will handle ID generation now
            const newCategory = await comboCategoryService.createCategory(categoryForm);
            toast.success("Combo category created successfully");
            handleCloseCategoryModal();
            
            // Update categories list and select the newly created category in the combo form
            fetchCategories().then(() => {
                if (newCategory && newCategory.id) {
                    setFormData(prev => ({
                        ...prev,
                        categoryId: newCategory.id
                    }));
                }
            });
        } catch (err) {
            console.error('Error details:', err.response?.data || err);
            setError(err.response?.data?.message || err.message || "An error occurred");
            toast.error(err.response?.data?.message || err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            setError(null);
            
            // Validate categories exist
            if (formData.categories && formData.categories.length > 0) {
                console.log("Validating categories:", formData.categories);
                const validCategoryIds = categories.map(c => c.id);
                console.log("Valid category IDs:", validCategoryIds);
                
                const invalidCategories = formData.categories.filter(id => 
                    !validCategoryIds.includes(id));
                    
                if (invalidCategories.length > 0) {
                    throw new Error(`Invalid category IDs: ${invalidCategories.join(', ')}`);
                }
            }
            
            // Ensure categories and vaccineIds are arrays
            const categoryIds = Array.isArray(formData.categories) ? formData.categories : [];
            const vaccineIds = Array.isArray(formData.vaccineIds) ? formData.vaccineIds : [];
            
            console.log("Category IDs before submission:", categoryIds);
            console.log("Vaccine IDs before submission:", vaccineIds);
            
            // Create a string representation of ids separated by commas
            // This is a workaround for potential array binding issues in Spring Boot
            const categoryIdsString = categoryIds.join(',');
            const vaccineIdsString = vaccineIds.join(',');
            
            console.log("Category IDs as string:", categoryIdsString);
            console.log("Vaccine IDs as string:", vaccineIdsString);
            
            // Construct payload - using the special string format
            const payload = {
                comboName: formData.comboName,
                description: formData.description,
                price: parseFloat(formData.price || 0),
                saleOff: parseFloat(formData.saleOff || 0),
                minAge: parseInt(formData.minAge || 0),
                maxAge: parseInt(formData.maxAge || 0),
                status: formData.status,
                // Use both formats for maximum compatibility
                categories: categoryIds,
                categoryIds: categoryIdsString, // Add as a backup string format
                vaccineIds: vaccineIds,
                vaccineIdString: vaccineIdsString // Add as a backup string format
            };
            
            // Log the exact payload being sent
            console.log('Submitting combo payload:', JSON.stringify(payload, null, 2));
            
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
            console.error('Full error object:', err);
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

    // Update the form to handle multiple category selection
    const handleCategoryChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        console.log("Selected category IDs:", selectedOptions);
        console.log("Available categories:", categories);
        
        setFormData(prev => ({
            ...prev,
            categories: selectedOptions
        }));
    };

    const handleVaccineChange = (e, index) => {
        const vaccineId = parseInt(e.target.value);
        
        console.log(`Adding vaccine ID ${vaccineId} at index ${index}`);
        
        setFormData(prev => {
            // Create a new copy of the vaccineIds array
            let newVaccineIds = [...prev.vaccineIds];
            
            // If index is specified, update at that index, otherwise add to end
            if (index !== undefined && index >= 0) {
                // Ensure we're storing numbers, not objects
                newVaccineIds[index] = vaccineId;
            } else {
                newVaccineIds.push(vaccineId);
            }
            
            // Remove any undefined values (from sparse arrays)
            newVaccineIds = newVaccineIds.filter(id => id !== undefined);
            
            // Make sure all IDs are numbers, not objects
            newVaccineIds = newVaccineIds.map(id => {
                if (typeof id === 'object' && id !== null) {
                    return id.vaccineId || id.id || 0;
                }
                return id;
            });
            
            console.log("New vaccine IDs array:", newVaccineIds);
            
            // Calculate new price
            const originalPrice = calculateOriginalPrice(newVaccineIds);
            console.log(`New original price: ${originalPrice}`);
            const discountRate = parseFloat(prev.saleOff) / 100 || 0;
            console.log(`Discount rate: ${discountRate}`);
            const finalPrice = originalPrice * (1 - discountRate);
            console.log(`Final price: ${finalPrice}`);
            
            return {
                ...prev,
                vaccineIds: newVaccineIds,
                price: finalPrice.toFixed(2)
            };
        });
    };

    return (
        <AdminLayout>
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1>Vaccine Combo Management</h1>
                    <div>
                        <Button variant="success" className="me-2" onClick={handleShowCategoryModal}>
                            Add New Category
                        </Button>
                        <Button variant="primary" onClick={() => handleShowModal()}>
                            Add New Combo
                        </Button>
                    </div>
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
                                <th>Age Range</th>
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
                                    <td>{combo.minAge} - {combo.maxAge} months</td>
                                    <td>${calculateOriginalPrice(combo.vaccines || []).toFixed(2)}</td>
                                    <td>${parseFloat(combo.price || 0).toFixed(2)}</td>
                                    <td>
                                        <span className={`badge bg-${combo.status ? 'success' : 'danger'}`}>
                                            {combo.status ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        {combo.vaccines?.map(vaccine => (
                                            <div key={vaccine.vaccineId}>
                                                {vaccine.vaccineName}
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
                                <Form.Label>Categories</Form.Label>
                                <div className="border p-2 rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {categories.map(category => (
                                        <Form.Check
                                            key={category.id}
                                            type="checkbox"
                                            id={`category-${category.id}`}
                                            label={category.categoryName}
                                            checked={formData.categories.includes(category.id)}
                                            onChange={(e) => {
                                                const categoryId = category.id;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    categories: e.target.checked
                                                        ? [...prev.categories, categoryId]
                                                        : prev.categories.filter(id => id !== categoryId)
                                                }));
                                            }}
                                            className="mb-2"
                                        />
                                    ))}
                                </div>
                                <Button 
                                    variant="outline-success" 
                                    className="mt-2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleShowCategoryModal();
                                    }}
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Add New Category
                                </Button>
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
                                    value={calculateOriginalPrice(formData.vaccineIds).toFixed(2)}
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

                            <Form.Group className="mb-3">
                                <Form.Label>Age Range</Form.Label>
                                <Row>
                                    <Col>
                                        <Form.Label>Minimum Age (months)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="minAge"
                                            value={formData.minAge}
                                            onChange={handleInputChange}
                                            min="0"
                                        />
                                    </Col>
                                    <Col>
                                        <Form.Label>Maximum Age (months)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="maxAge"
                                            value={formData.maxAge}
                                            onChange={handleInputChange}
                                            min="0"
                                        />
                                    </Col>
                                </Row>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Vaccines</Form.Label>
                                <div className="border p-2 rounded" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {formData.vaccineIds.map((vaccineId, index) => (
                                        <Row key={index} className="mb-2 align-items-center">
                                            <Col xs={10}>
                                                <Form.Select
                                                    value={vaccineId}
                                                    onChange={(e) => handleVaccineChange(e, index)}
                                                >
                                                    <option value="">Select Vaccine</option>
                                                    {vaccines.map(vaccine => (
                                                        <option key={vaccine.id} value={vaccine.id}>
                                                            {vaccine.name} (${vaccine.price})
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Col>
                                            <Col xs={2}>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => {
                                                        setFormData(prev => {
                                                            const newVaccineIds = [...prev.vaccineIds];
                                                            newVaccineIds.splice(index, 1);
                                                            
                                                            // Recalculate price
                                                            const originalPrice = calculateOriginalPrice(newVaccineIds);
                                                            const finalPrice = originalPrice * (1 - (prev.saleOff / 100 || 0));
                                                            
                                                            return {
                                                                ...prev,
                                                                vaccineIds: newVaccineIds,
                                                                price: finalPrice.toFixed(2)
                                                            };
                                                        });
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </Button>
                                            </Col>
                                        </Row>
                                    ))}
                                </div>
                                <Button
                                    variant="outline-primary"
                                    className="mt-2 w-100"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setFormData(prev => ({
                                            ...prev,
                                            vaccineIds: [...prev.vaccineIds, '']
                                        }));
                                    }}
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Add Vaccine
                                </Button>
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

                <Modal 
                    show={showCategoryModal} 
                    onHide={handleCloseCategoryModal}
                    backdrop="static"
                    style={{ zIndex: 1060 }}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Create New Combo Category</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleCategorySubmit}>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Category Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="comboCategoryName"
                                    value={categoryForm.comboCategoryName}
                                    onChange={handleCategoryInputChange}
                                    required
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseCategoryModal}>
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