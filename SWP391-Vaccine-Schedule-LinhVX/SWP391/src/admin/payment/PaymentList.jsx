import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    IconButton,
    Tooltip,
    Chip,
    TextField,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress
} from '@mui/material';
import {
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Receipt as ReceiptIcon,
    History as HistoryIcon,
    Payment as PaymentIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import PaymentService from '../../services/PaymentService';
import { PaymentStatus, PaymentStatusLabels, PaymentStatusColors } from '../../constants/PaymentStatus';
import PaymentDetails from './PaymentDetails';
import PaymentHistory from './PaymentHistory';

const PaymentList = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState(''); // 'details', 'history', 'edit'
    const [filterStatus, setFilterStatus] = useState('all');
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadPayments();
    }, [filterStatus]);

    const loadPayments = async () => {
        try {
            setLoading(true);
            const response = filterStatus === 'all'
                ? await PaymentService.getAllPayments()
                : await PaymentService.getAllPayments(filterStatus);
            
            // Check for Spring Data JPA Page format that has a content array
            if (response && response.content) {
                setPayments(response.content);
            } else if (Array.isArray(response)) {
                setPayments(response);
            } else {
                console.warn('Unexpected payments response format:', response);
                setPayments([]);
            }
        } catch (error) {
            console.error('Failed to load payments:', error);
            enqueueSnackbar('Failed to load payments: ' + (error.message || 'Unknown error'), { 
                variant: 'error',
                autoHideDuration: 5000
            });
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (payment) => {
        setSelectedPayment(payment);
        setDialogType('details');
        setDialogOpen(true);
    };

    const handleViewHistory = (payment) => {
        setSelectedPayment(payment);
        setDialogType('history');
        setDialogOpen(true);
    };

    const handleEdit = (payment) => {
        setSelectedPayment(payment);
        setDialogType('edit');
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedPayment(null);
        setDialogType('');
    };

    const handleStatusChange = async (paymentId, newStatus) => {
        try {
            await PaymentService.updatePaymentStatus(paymentId, newStatus);
            enqueueSnackbar('Payment status updated successfully', { variant: 'success' });
            loadPayments();
            handleCloseDialog();
        } catch (error) {
            enqueueSnackbar('Failed to update payment status', { variant: 'error' });
        }
    };

    const renderDialogContent = () => {
        if (!selectedPayment) return null;

        switch (dialogType) {
            case 'details':
                return <PaymentDetails payment={selectedPayment} onClose={handleCloseDialog} />;
            case 'history':
                return <PaymentHistory payment={selectedPayment} onClose={handleCloseDialog} />;
            case 'edit':
                return (
                    <>
                        <DialogTitle>Edit Payment Status</DialogTitle>
                        <DialogContent>
                            <TextField
                                select
                                fullWidth
                                label="Status"
                                value={selectedPayment.status}
                                onChange={(e) => handleStatusChange(selectedPayment.id, e.target.value)}
                                margin="normal"
                            >
                                {Object.entries(PaymentStatusLabels).map(([value, label]) => (
                                    <MenuItem key={value} value={value}>
                                        {label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Cancel</Button>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={() => handleStatusChange(selectedPayment.id, selectedPayment.status)}
                            >
                                Save Changes
                            </Button>
                        </DialogActions>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <PaymentIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h4" component="h1">
                    Payment Management
                </Typography>
            </Box>

            <Paper sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <TextField
                        select
                        label="Filter by Status"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        sx={{ minWidth: 200 }}
                    >
                        <MenuItem value="all">All Payments</MenuItem>
                        {Object.entries(PaymentStatusLabels).map(([value, label]) => (
                            <MenuItem key={value} value={value}>
                                {label}
                            </MenuItem>
                        ))}
                    </TextField>
                    <IconButton onClick={loadPayments}>
                        <RefreshIcon />
                    </IconButton>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Payment Method</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>{payment.id}</TableCell>
                                        <TableCell>${payment.amount?.toFixed(2) || '0.00'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={PaymentStatusLabels[payment.status]}
                                                color={PaymentStatusColors[payment.status]}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {payment.createdAt && format(new Date(payment.createdAt), 'PPP')}
                                        </TableCell>
                                        <TableCell>{payment.paymentMethod?.name || '-'}</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="View Details">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleViewDetails(payment)}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="View History">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleViewHistory(payment)}
                                                >
                                                    <HistoryIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit Status">
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => handleEdit(payment)}
                                                    disabled={payment.status === PaymentStatus.COMPLETED}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Download Receipt">
                                                <IconButton 
                                                    size="small" 
                                                    disabled={payment.status !== PaymentStatus.COMPLETED}
                                                >
                                                    <ReceiptIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Dialog 
                open={dialogOpen} 
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth={dialogType === 'details' || dialogType === 'history'}
            >
                {renderDialogContent()}
            </Dialog>
        </Container>
    );
};

export default PaymentList; 