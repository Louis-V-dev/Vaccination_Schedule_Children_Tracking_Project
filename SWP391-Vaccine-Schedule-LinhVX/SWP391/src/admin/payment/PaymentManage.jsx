import React, { useState } from 'react';
import {
    Box,
    Paper,
    Tabs,
    Tab,
    Typography,
    Container
} from '@mui/material';
import PaymentList from './PaymentList';
import PaymentStatistics from './PaymentStatistics';
import PaymentMethods from './PaymentMethods';
import AdminLayout from '../AdminLayout';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`payment-tabpanel-${index}`}
            aria-labelledby={`payment-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const PaymentManage = () => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <AdminLayout>
            <Container maxWidth="xl">
                <Paper sx={{ width: '100%', mb: 2 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Typography variant="h4" sx={{ p: 2 }}>
                            Payment Management
                        </Typography>
                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            aria-label="payment management tabs"
                            sx={{ px: 2 }}
                        >
                            <Tab label="Payment List" />
                            <Tab label="Payment Methods" />
                            <Tab label="Statistics" />
                        </Tabs>
                    </Box>

                    <TabPanel value={activeTab} index={0}>
                        <PaymentList />
                    </TabPanel>
                    <TabPanel value={activeTab} index={1}>
                        <PaymentMethods />
                    </TabPanel>
                    <TabPanel value={activeTab} index={2}>
                        <PaymentStatistics />
                    </TabPanel>
                </Paper>
            </Container>
        </AdminLayout>
    );
};

export default PaymentManage; 