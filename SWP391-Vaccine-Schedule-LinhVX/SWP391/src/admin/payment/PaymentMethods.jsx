import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    IconButton,
    Chip,
    CircularProgress
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import PaymentService from '../../services/PaymentService';

const PaymentMethods = () => {
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState(null);
    const { enqueueSnackbar } = useSnackbar();
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        type: 'CREDIT_CARD',
        description: '',
        logoUrl: '',
        apiEndpoint: '',
        merchantId: '',
        publicKey: '',
        isActive: true,
        isOnline: true,
        displayOrder: 0,
        displayInstructions: ''
    });

    useEffect(() => {
        loadPaymentMethods();
    }, []);

    const loadPaymentMethods = async () => {
        try {
            setLoading(true);
            const methods = await PaymentService.getPaymentMethods();
            setMethods(Array.isArray(methods) ? methods : []);
        } catch (error) {
            console.error('Failed to load payment methods:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to load payment methods', { 
                variant: 'error',
                autoHideDuration: 5000
            });
            setMethods([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (method = null) => {
        if (method) {
            setSelectedMethod(method);
            setFormData({
                name: method.name,
                code: method.code,
                type: method.type,
                description: method.description || '',
                logoUrl: method.logoUrl || '',
                apiEndpoint: method.apiEndpoint || '',
                merchantId: method.merchantId || '',
                publicKey: method.publicKey || '',
                isActive: method.isActive,
                isOnline: method.isOnline,
                displayOrder: method.displayOrder || 0,
                displayInstructions: method.displayInstructions || ''
            });
        } else {
            setSelectedMethod(null);
            setFormData({
                name: '',
                code: '',
                type: 'CREDIT_CARD',
                description: '',
                logoUrl: '',
                apiEndpoint: '',
                merchantId: '',
                publicKey: '',
                isActive: true,
                isOnline: true,
                displayOrder: 0,
                displayInstructions: ''
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedMethod(null);
    };

    const handleInputChange = (e) => {
        const { name, value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'isActive' || name === 'isOnline' ? checked : value
        }));
    };

    const handleSubmit = async () => {
        try {
            if (!formData.name || !formData.code || !formData.type) {
                enqueueSnackbar('Please fill in all required fields', { variant: 'error' });
                return;
            }

            if (selectedMethod) {
                await PaymentService.updatePaymentMethod(selectedMethod.id, formData);
                enqueueSnackbar('Payment method updated successfully', { variant: 'success' });
            } else {
                await PaymentService.createPaymentMethod(formData);
                enqueueSnackbar('Payment method created successfully', { variant: 'success' });
            }
            handleCloseDialog();
            loadPaymentMethods();
        } catch (error) {
            console.error('Failed to save payment method:', error);
            enqueueSnackbar(error.response?.data?.message || 'Failed to save payment method', { 
                variant: 'error',
                autoHideDuration: 5000
            });
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this payment method?')) {
            try {
                await PaymentService.deletePaymentMethod(id);
                enqueueSnackbar('Payment method deleted successfully', { variant: 'success' });
                loadPaymentMethods();
            } catch (error) {
                console.error('Failed to delete payment method:', error);
                enqueueSnackbar(error.response?.data?.message || 'Failed to delete payment method', { 
                    variant: 'error',
                    autoHideDuration: 5000
                });
            }
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">Payment Methods</Typography>
                <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
                    Add Payment Method
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Online</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : methods && methods.length > 0 ? (
                            methods.map((method) => (
                                <TableRow key={method.id}>
                                    <TableCell>{method.name}</TableCell>
                                    <TableCell>{method.code}</TableCell>
                                    <TableCell>{method.type}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={method.isActive ? 'Active' : 'Inactive'}
                                            color={method.isActive ? 'success' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={method.isOnline ? 'Online' : 'Offline'}
                                            color={method.isOnline ? 'primary' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleOpenDialog(method)} color="primary">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton onClick={() => handleDelete(method.id)} color="error">
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="body1">No payment methods found</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'grid', gap: 2, pt: 2 }}>
                        <TextField
                            name="name"
                            label="Name"
                            value={formData.name}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />
                        <TextField
                            name="code"
                            label="Code"
                            value={formData.code}
                            onChange={handleInputChange}
                            fullWidth
                            required
                        />
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                label="Type"
                            >
                                <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                                <MenuItem value="DEBIT_CARD">Debit Card</MenuItem>
                                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                                <MenuItem value="E_WALLET">E-Wallet</MenuItem>
                                <MenuItem value="CASH">Cash</MenuItem>
                                <MenuItem value="MOBILE_PAYMENT">Mobile Payment</MenuItem>
                                <MenuItem value="QR_CODE">QR Code</MenuItem>
                                <MenuItem value="INSURANCE">Insurance</MenuItem>
                                <MenuItem value="VOUCHER">Voucher</MenuItem>
                                <MenuItem value="MOMO">MoMo</MenuItem>
                                <MenuItem value="VISA">Visa</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            name="description"
                            label="Description"
                            value={formData.description}
                            onChange={handleInputChange}
                            fullWidth
                            multiline
                            rows={2}
                        />
                        <TextField
                            name="logoUrl"
                            label="Logo URL"
                            value={formData.logoUrl}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <TextField
                            name="apiEndpoint"
                            label="API Endpoint"
                            value={formData.apiEndpoint}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <TextField
                            name="merchantId"
                            label="Merchant ID"
                            value={formData.merchantId}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <TextField
                            name="publicKey"
                            label="Public Key"
                            value={formData.publicKey}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <TextField
                            name="displayOrder"
                            label="Display Order"
                            type="number"
                            value={formData.displayOrder}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <TextField
                            name="displayInstructions"
                            label="Display Instructions"
                            value={formData.displayInstructions}
                            onChange={handleInputChange}
                            fullWidth
                            multiline
                            rows={3}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                />
                            }
                            label="Active"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    name="isOnline"
                                    checked={formData.isOnline}
                                    onChange={handleInputChange}
                                />
                            }
                            label="Online Payment"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        {selectedMethod ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PaymentMethods; 