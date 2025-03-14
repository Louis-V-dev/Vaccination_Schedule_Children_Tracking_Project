import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Chip,
    Divider,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Receipt as ReceiptIcon,
    History as HistoryIcon,
    Edit as EditIcon,
    Payment as PaymentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import PaymentService from '../../services/PaymentService';
import { PaymentStatusLabels, PaymentStatusColors } from '../../constants/PaymentStatus';

const PaymentDetails = ({ paymentId, onClose }) => {
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
    const [editForm, setEditForm] = useState({
        status: '',
        notes: '',
    });
    const { enqueueSnackbar } = useSnackbar();

    const statusColors = {
        PENDING: 'warning',
        PROCESSING: 'info',
        COMPLETED: 'success',
        DECLINED: 'error',
        CANCELLED: 'default',
        REFUNDED: 'secondary',
        PARTIALLY_REFUNDED: 'secondary',
        FAILED: 'error',
        EXPIRED: 'default',
        ON_HOLD: 'warning',
        DISPUTED: 'error'
    };

    useEffect(() => {
        loadPaymentDetails();
    }, [paymentId]);

    const loadPaymentDetails = async () => {
        try {
            const response = await PaymentService.getPaymentById(paymentId);
            setPayment(response.data);
            setEditForm({
                status: response.data.status,
                notes: response.data.notes || '',
            });
        } catch (error) {
            enqueueSnackbar('Failed to load payment details', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async () => {
        try {
            await PaymentService.updatePaymentStatus(
                paymentId,
                editForm.status,
                editForm.notes
            );
            loadPaymentDetails();
            setOpenEditDialog(false);
            enqueueSnackbar('Payment status updated successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to update payment status', { variant: 'error' });
        }
    };

    const handleDownloadReceipt = async () => {
        try {
            const response = await PaymentService.getPaymentReceipt(paymentId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt-${payment.transactionId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            enqueueSnackbar('Failed to download receipt', { variant: 'error' });
        }
    };

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    if (!payment) {
        return <Typography>Payment not found</Typography>;
    }

    return (
        <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogContent>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Payment ID
                        </Typography>
                        <Typography variant="body1">{payment.id}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Status
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                            <Chip
                                label={PaymentStatusLabels[payment.status]}
                                color={PaymentStatusColors[payment.status]}
                                size="small"
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Amount
                        </Typography>
                        <Typography variant="body1">${payment.amount.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Payment Method
                        </Typography>
                        <Typography variant="body1">{payment.paymentMethod?.name}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Created At
                        </Typography>
                        <Typography variant="body1">
                            {new Date(payment.createdAt).toLocaleString()}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Updated At
                        </Typography>
                        <Typography variant="body1">
                            {new Date(payment.updatedAt).toLocaleString()}
                        </Typography>
                    </Grid>
                    {payment.transactionId && (
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Transaction ID
                            </Typography>
                            <Typography variant="body1">{payment.transactionId}</Typography>
                        </Grid>
                    )}
                    {payment.description && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Description
                            </Typography>
                            <Typography variant="body1">{payment.description}</Typography>
                        </Grid>
                    )}
                    {payment.notes && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary">
                                Notes
                            </Typography>
                            <Typography variant="body1">{payment.notes}</Typography>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default PaymentDetails; 