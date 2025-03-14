import React from 'react';
import {
    Box,
    Typography,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Divider
} from '@mui/material';
import { useSnackbar } from 'notistack';
import PaymentService from '../../services/PaymentService';
import { PaymentStatusLabels, PaymentStatusColors } from '../../constants/PaymentStatus';

const PaymentHistory = ({ payment, onClose }) => {
    if (!payment || !payment.history) return null;

    return (
        <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Payment History</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    {payment.history.map((entry) => (
                        <Box key={entry.id} sx={{ mb: 2 }}>
                            <Typography variant="subtitle2">
                                {new Date(entry.timestamp).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Status changed from{' '}
                                <Chip
                                    label={PaymentStatusLabels[entry.previousStatus]}
                                    color={PaymentStatusColors[entry.previousStatus]}
                                    size="small"
                                    sx={{ mx: 0.5 }}
                                />
                                {' to '}
                                <Chip
                                    label={PaymentStatusLabels[entry.newStatus]}
                                    color={PaymentStatusColors[entry.newStatus]}
                                    size="small"
                                    sx={{ mx: 0.5 }}
                                />
                            </Typography>
                            {entry.notes && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Notes: {entry.notes}
                                </Typography>
                            )}
                            <Divider sx={{ mt: 1 }} />
                        </Box>
                    ))}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default PaymentHistory;
