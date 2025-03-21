import React, { useState } from 'react';
import { 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  FormControl, 
  FormLabel, 
  Box, 
  Typography, 
  Paper, 
  Grid 
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import PaymentIcon from '@mui/icons-material/Payment';

const PaymentMethodSelector = ({ value, onChange }) => {
  const paymentMethods = [
    { 
      value: 'captureWallet', 
      label: 'MoMo QR Code', 
      description: 'Pay using QR code within MoMo e-wallet',
      icon: <PhoneIphoneIcon style={{ color: '#ae2070' }} fontSize="large" />
    },
    { 
      value: 'payWithATM', 
      label: 'ATM Card', 
      description: 'Pay using domestic ATM card',
      icon: <AccountBalanceIcon style={{ color: '#2070ae' }} fontSize="large" />
    },
    { 
      value: 'payWithCC', 
      label: 'Credit Card', 
      description: 'Pay using international credit/debit card',
      icon: <CreditCardIcon style={{ color: '#20ae70' }} fontSize="large" />  
    },
    { 
      value: 'payWithMoMo', 
      label: 'MoMo App', 
      description: 'Scan QR using the MoMo app',
      icon: <PaymentIcon style={{ color: '#ae2070' }} fontSize="large" />
    }
  ];

  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (
    <FormControl component="fieldset" fullWidth>
      <FormLabel component="legend">
        <Typography variant="subtitle1" fontWeight="bold">
          Select Payment Method
        </Typography>
      </FormLabel>
      
      <RadioGroup
        aria-label="payment-method"
        name="payment-method"
        value={value}
        onChange={handleChange}
      >
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {paymentMethods.map((method) => (
            <Grid item xs={12} sm={6} key={method.value}>
              <Paper 
                elevation={value === method.value ? 3 : 1}
                sx={{
                  p: 2,
                  border: value === method.value ? '2px solid #4caf50' : '1px solid #e0e0e0',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    borderColor: '#4caf50'
                  }
                }}
                onClick={() => onChange(method.value)}
              >
                <Box display="flex" alignItems="center">
                  <Radio
                    checked={value === method.value}
                    onChange={handleChange}
                    value={method.value}
                    name="payment-method-radio"
                    sx={{ mr: 1 }}
                  />
                  <Box display="flex" flexDirection="column" flexGrow={1}>
                    <Box display="flex" alignItems="center">
                      {method.icon}
                      <Typography variant="subtitle1" fontWeight="medium" sx={{ ml: 1 }}>
                        {method.label}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {method.description}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </RadioGroup>
    </FormControl>
  );
};

export default PaymentMethodSelector; 