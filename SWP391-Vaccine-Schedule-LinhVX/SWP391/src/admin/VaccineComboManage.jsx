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
        vaccineIds: [],
        vaccineDoses: {}
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
    const calculateTotalPrice = (vaccineIds, saleOff = 0) => {
        const originalPrice = calculateOriginalPrice(vaccineIds);
        return originalPrice * (1 - (parseFloat(saleOff) || 0) / 100);
    };

    // Calculate original price without discounts
    const calculateOriginalPrice = (vaccineIds, customDoses) => {
        if (!vaccineIds || !Array.isArray(vaccineIds) || vaccineIds.length === 0) return 0;
        
        // Debug the exact structure of the vaccineIds parameter
        console.log("Calculating price for vaccineIds (raw):", vaccineIds);
        console.log("Type of first item:", vaccineIds[0] !== undefined ? typeof vaccineIds[0] : 'undefined');
        
        // If we're receiving actual vaccine objects (from the combo list)
        if (typeof vaccineIds[0] === 'object' && vaccineIds[0]?.vaccineId && vaccineIds[0]?.price !== undefined) {
            return vaccineIds.reduce((total, vaccine) => {
                const price = parseFloat(vaccine.price || 0);
                const totalDose = vaccine.totalDose || 1;
                return total + (price * totalDose);
            }, 0);
        }
        
        // Otherwise process as IDs (from the form)
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
            
            // Get the total dose - use custom doses if provided, otherwise use from formData
            let totalDose = 1;
            if (customDoses && customDoses[vaccineId]) {
                totalDose = customDoses[vaccineId];
            } else if (formData.vaccineDoses && formData.vaccineDoses[vaccineId]) {
                totalDose = formData.vaccineDoses[vaccineId];
            }
            
            console.log(`Vaccine ID ${vaccineId}, found: ${!!vaccine}, price: ${price}, totalDose: ${totalDose}`);
            
            return total + (price * totalDose);
        }, 0);
    };

    const handleShowModal = (combo = null) => {
        if (combo) {
            setSelectedCombo(combo);
            
            // Initialize vaccineIds from combo
            const vaccineIds = combo.vaccines.map(v => v.vaccineId);
            
            // Initialize vaccineDoses from combo
            const vaccineDoses = {};
            combo.vaccines.forEach(v => {
                vaccineDoses[v.vaccineId] = v.totalDose || 1;
            });
            
            setFormData({
                comboName: combo.comboName,
                description: combo.description || "",
                price: combo.price?.toString() || "0",
                saleOff: combo.saleOff || 0,
                minAge: combo.minAge || 0,
                maxAge: combo.maxAge || 0,
                status: combo.status,
                categories: combo.categories?.map(c => c.categoryId) || [],
                vaccineIds: vaccineIds,
                vaccineDoses: vaccineDoses
            });
        } else {
            setFormData({
                comboName: "",
                description: "",
                price: "0",
                saleOff: 0,
                status: true,
                minAge: 0,
                maxAge: 0,
                categories: [],
                vaccineIds: [],
                vaccineDoses: {}
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
            vaccineIds: [],
            vaccineDoses: {}
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
                const totalPrice = calculateTotalPrice(prev.vaccineIds, Number(value));
                newData.price = totalPrice.toFixed(2);
            }
            
            return newData;
        });
    };

    const handleAddVaccine = () => {
        setFormData(prev => ({
            ...prev,
            vaccineIds: [...prev.vaccineIds, '']
        }));
    };

    const handleRemoveVaccine = (index) => {
        setFormData(prev => {
            const newVaccineIds = [...prev.vaccineIds];
            const removedId = newVaccineIds[index];
            newVaccineIds.splice(index, 1);
            
            const newVaccineDoses = { ...prev.vaccineDoses };
            if (removedId && newVaccineDoses[removedId]) {
                delete newVaccineDoses[removedId];
            }
            
            // Recalculate price
            const newPrice = calculateTotalPrice(newVaccineIds, prev.saleOff);
            
            return {
                ...prev,
                vaccineIds: newVaccineIds,
                vaccineDoses: newVaccineDoses,
                price: newPrice.toFixed(2)
            };
        });
    };

    const handleVaccineChange = (e, index) => {
        const vaccineId = parseInt(e.target.value);
        
        console.log(`Adding vaccine ID ${vaccineId} at index ${index}`);
        
        setFormData(prev => {
            // Create a new copy of the vaccineIds array
            let newVaccineIds = [...prev.vaccineIds];
            
            // Get the old vaccineId at this index to remove it from doses
            const oldVaccineId = newVaccineIds[index];
            
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
            
            // Create a new vaccineDoses with the updated vaccineId
            const newVaccineDoses = { ...prev.vaccineDoses };
            
            // Remove old vaccineId dose if it exists
            if (oldVaccineId && newVaccineDoses[oldVaccineId]) {
                delete newVaccineDoses[oldVaccineId];
            }
            
            // Set default dose of 1 for new vaccineId if not already set
            if (vaccineId && !newVaccineDoses[vaccineId]) {
                newVaccineDoses[vaccineId] = 1;
            }
            
            console.log("New vaccine IDs array:", newVaccineIds);
            console.log("New vaccine doses:", newVaccineDoses);
            
            // Calculate new price
            const finalPrice = calculateTotalPrice(newVaccineIds, parseFloat(prev.saleOff));
            console.log(`Final price: ${finalPrice}`);
            
            return {
                ...prev,
                vaccineIds: newVaccineIds,
                vaccineDoses: newVaccineDoses,
                price: finalPrice.toFixed(2)
            };
        });
    };
    
    const handleVaccineDoseChange = (e, vaccineId) => {
        const totalDose = parseInt(e.target.value) || 1;
        
        setFormData(prev => {
            const newVaccineDoses = { ...prev.vaccineDoses };
            newVaccineDoses[vaccineId] = totalDose;
            
            // Recalculate original price with new doses
            const originalPrice = calculateOriginalPrice(prev.vaccineIds, newVaccineDoses);
            
            // Recalculate final price with new doses and current discount
            const finalPrice = calculateTotalPrice(prev.vaccineIds, parseFloat(prev.saleOff));
            
            return {
                ...prev,
                vaccineDoses: newVaccineDoses,
                price: finalPrice.toFixed(2)
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
        
        if (!formData.comboName || formData.vaccineIds.length === 0) {
            toast.error("Please provide a combo name and select at least one vaccine");
            return;
        }

        // Filter out any empty vaccine IDs
        const filteredVaccineIds = formData.vaccineIds.filter(id => id);
        
        if (filteredVaccineIds.length === 0) {
            toast.error("Please select at least one valid vaccine");
            return;
        }

        // Prepare the data to send to the server
        const submitData = {
            ...formData,
            vaccineIds: filteredVaccineIds,
            // Make sure price is a double
            price: parseFloat(formData.price),
            // Make sure saleOff is a double
            saleOff: parseFloat(formData.saleOff || 0)
        };

        // Validate vaccineDoses make sure all vaccineIds have a dose
        filteredVaccineIds.forEach(id => {
            if (!submitData.vaccineDoses[id]) {
                submitData.vaccineDoses[id] = 1;
            }
        });

        console.log("Submitting data:", submitData);

        try {
            setLoading(true);
            if (selectedCombo) {
                await vaccineComboService.updateCombo(selectedCombo.comboId, submitData);
                toast.success("Vaccine combo updated successfully");
            } else {
                await vaccineComboService.createCombo(submitData);
                toast.success("Vaccine combo created successfully");
            }
            handleCloseModal();
            fetchCombos();
        } catch (err) {
            console.error("Error saving combo:", err);
            const errorMessage = err.response?.data?.message || "An error occurred";
            toast.error(`Failed to save combo: ${errorMessage}`);
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
                                    <td>${calculateOriginalPrice(combo.vaccines || [], combo.vaccines?.map(v => v.totalDose) || {}).toFixed(2)}</td>
                                    <td>${parseFloat(combo.price || 0).toFixed(2)}</td>
                                    <td>
                                        <span className={`badge bg-${combo.status ? 'success' : 'danger'}`}>
                                            {combo.status ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        {combo.vaccines?.map(vaccine => (
                                            <div key={vaccine.vaccineId}>
                                                {vaccine.vaccineName} ({vaccine.totalDose || 1} dose{(vaccine.totalDose || 1) > 1 ? 's' : ''})
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

                            <Row>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Min Age (months)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="minAge"
                                            min="0"
                                            value={formData.minAge}
                                            onChange={handleInputChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Max Age (months)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="maxAge"
                                            min="0"
                                            value={formData.maxAge}
                                            onChange={handleInputChange}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label>Status</Form.Label>
                                <Form.Select
                                    name="status"
                                    value={formData.status ? "true" : "false"}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        status: e.target.value === "true"
                                    })}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Categories</Form.Label>
                                <div className="border p-2 rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {categories.map(category => (
                                        <Form.Check
                                            key={category.id}
                                            type="checkbox"
                                            id={`category-${category.id}`}
                                            label={category.comboCategoryName || category.categoryName}
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
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <Form.Label>Vaccines</Form.Label>
                                    <Button 
                                        variant="primary" 
                                        size="sm" 
                                        onClick={handleAddVaccine}
                                    >
                                        <FontAwesomeIcon icon={faPlus} /> Add Vaccine
                                    </Button>
                                </div>
                                <div className="border p-2 rounded" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {formData.vaccineIds.map((vaccineId, index) => (
                                        <Row key={index} className="mb-2 align-items-center">
                                            <Col xs={6}>
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
                                            <Col xs={4}>
                                                <Form.Control
                                                    type="number"
                                                    min="1"
                                                    placeholder="Total Doses"
                                                    value={formData.vaccineDoses[vaccineId] || 1}
                                                    onChange={(e) => handleVaccineDoseChange(e, vaccineId)}
                                                    disabled={!vaccineId}
                                                />
                                            </Col>
                                            <Col xs={2}>
                                                <Button 
                                                    variant="outline-danger" 
                                                    size="sm"
                                                    onClick={() => handleRemoveVaccine(index)}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </Button>
                                            </Col>
                                        </Row>
                                    ))}
                                    {formData.vaccineIds.length === 0 && (
                                        <div className="text-center text-muted p-3">
                                            No vaccines added yet. Click "Add Vaccine" to begin.
                                        </div>
                                    )}
                                </div>
                            </Form.Group>

                            <Row className="mt-4">
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Original Price ($)</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={calculateOriginalPrice(formData.vaccineIds, formData.vaccineDoses).toFixed(2)}
                                            disabled
                                        />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Discount (%)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="saleOff"
                                            min="0"
                                            max="100"
                                            value={formData.saleOff}
                                            onChange={handleInputChange}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Final Price ($)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="price"
                                            step="0.01"
                                            min="0"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            disabled
                                        />
                                        <small className="text-muted">
                                            Price is calculated automatically based on the selected vaccines and discount rate
                                        </small>
                                    </Form.Group>
                                </Col>
                            </Row>
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

                <Modal show={showCategoryModal} onHide={handleCloseCategoryModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add New Category</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleCategorySubmit}>
                        <Modal.Body>
                            <Form.Group>
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