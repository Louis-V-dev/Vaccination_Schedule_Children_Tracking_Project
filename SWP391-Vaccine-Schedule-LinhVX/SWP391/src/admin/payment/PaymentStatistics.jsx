import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    CircularProgress,
    TextField
} from '@mui/material';
import { useSnackbar } from 'notistack';
import PaymentService from '../../services/PaymentService';
import { PaymentStatusLabels } from '../../constants/PaymentStatus';

const PaymentStatistics = () => {
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [statistics, setStatistics] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        loadStatistics();
    }, [startDate, endDate]);

    const loadStatistics = async () => {
        try {
            setLoading(true);
            const response = await PaymentService.getPaymentStatistics(
                new Date(startDate).toISOString(),
                new Date(endDate).toISOString()
            );
            setStatistics(response.data);
        } catch (error) {
            enqueueSnackbar('Failed to load payment statistics', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Payment Statistics
                </Typography>

                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Start Date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            fullWidth
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="End Date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            fullWidth
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </Grid>
                </Grid>

                {statistics && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="h6" gutterBottom>
                                    Total Revenue
                                </Typography>
                                <Typography variant="h4" color="primary">
                                    ${statistics.totalRevenue.toFixed(2)}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="h6" gutterBottom>
                                    Total Transactions
                                </Typography>
                                <Typography variant="h4" color="primary">
                                    {statistics.totalTransactions}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="h6" gutterBottom>
                                    Average Transaction
                                </Typography>
                                <Typography variant="h4" color="primary">
                                    ${statistics.averageTransaction.toFixed(2)}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Status Distribution
                                </Typography>
                                <Grid container spacing={2}>
                                    {Object.entries(statistics.statusDistribution).map(([status, count]) => (
                                        <Grid item xs={12} sm={6} md={4} key={status}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2">
                                                    {PaymentStatusLabels[status]}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {count}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        </Grid>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Payment Methods Distribution
                                </Typography>
                                <Grid container spacing={2}>
                                    {Object.entries(statistics.paymentMethodDistribution).map(([method, count]) => (
                                        <Grid item xs={12} sm={6} md={4} key={method}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2">
                                                    {method}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {count}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </Paper>
        </Box>
    );
};

export default PaymentStatistics; 