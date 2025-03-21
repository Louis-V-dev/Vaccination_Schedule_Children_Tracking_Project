import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import PaymentMethodSelector from './PaymentMethodSelector';
import appointmentService from '../services/appointmentService';

const PaymentModal = ({ 
  open, 
  onClose, 
  appointmentId, 
  amount, 
  onSuccess, 
  onFailure,
  redirectUrl,
  cancelUrl,
  failureUrl
}) => {
  const [paymentMethod, setPaymentMethod] = useState('captureWallet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);

  // Reset state when modal is opened
  useEffect(() => {
    if (open) {
      setPaymentMethod('captureWallet');
      setError(null);
      setLoading(false);
      setPaymentUrl(null);
    }
  }, [open]);

  const handleProceedToPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const paymentOptions = {
        requestType: paymentMethod,
        amount: amount || 0
      };
      
      // Add redirect URLs if provided
      if (redirectUrl) {
        paymentOptions.redirectUrl = redirectUrl;
      }
      
      console.log('Proceeding to payment with options:', paymentOptions);
      
      const response = await appointmentService.createPayment(appointmentId, paymentOptions);
      
      if (response && response.payUrl) {
        console.log('Payment URL received:', response.payUrl);
        setPaymentUrl(response.payUrl);
        
        // For MoMo App payment, we should just show the QR code in the modal
        if (paymentMethod === 'payWithMoMo') {
          // Don't redirect, just show QR in the modal (handled in render)
        } else {
          // For other payment methods, redirect to the payment URL
          // Store appointment state in sessionStorage before redirecting
          sessionStorage.setItem('pendingPayment', JSON.stringify({
            appointmentId,
            paymentMethod,
            amount,
            transactionId: response.transactionId || response.orderId
          }));
          
          // Open the payment URL in the same window for better redirect handling
          window.location.href = response.payUrl;
        }
        
        // Call success handler with payment details
        if (onSuccess) {
          onSuccess({
            appointmentId: appointmentId,
            paymentMethod: paymentMethod,
            amount: amount,
            paymentUrl: response.payUrl,
            transactionId: response.transactionId || response.orderId
          });
        }
      } else {
        throw new Error('No payment URL received from the server');
      }
    } catch (err) {
      console.error('Payment creation failed:', err);
      setError(err.message || 'Failed to create payment. Please try again.');
      
      if (onFailure) {
        onFailure(err);
      }
    } finally {
      setLoading(false);
    }
  };

  // Determine if we should show QR code display
  const showQrCode = paymentMethod === 'payWithMoMo' && paymentUrl;

  return (
    <Dialog 
      open={open} 
      onClose={loading ? null : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Typography variant="h5" component="div" fontWeight="bold">
          Payment Method
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {paymentUrl && !showQrCode && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Payment link has been opened. If the payment page did not open, 
            <Button 
              color="info" 
              onClick={() => window.location.href = paymentUrl}
              sx={{ ml: 1 }}
            >
              click here
            </Button>
          </Alert>
        )}
        
        {showQrCode && (
          <Box sx={{ mt: 2, mb: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1" gutterBottom>
              Scan this QR code with your MoMo app
            </Typography>
            <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', display: 'inline-block' }}>
              <img 
                src={paymentUrl} 
                alt="MoMo QR Code" 
                style={{ maxWidth: '250px', maxHeight: '250px' }} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg';
                  setError('Could not load QR code. Please try a different payment method.');
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Once payment is complete, click "Check Payment Status" to proceed.
            </Typography>
            <Button 
              variant="outlined" 
              color="primary" 
              sx={{ mt: 1 }}
              onClick={async () => {
                try {
                  setLoading(true);
                  const result = await appointmentService.checkPaymentStatus(response?.orderId);
                  if (result && result.success) {
                    onSuccess({ 
                      appointmentId, 
                      paymentMethod,
                      status: 'success'
                    });
                  } else {
                    setError('Payment not completed yet. Please complete the payment in your MoMo app.');
                  }
                } catch (err) {
                  setError('Could not verify payment status. Please try again.');
                } finally {
                  setLoading(false);
                }
              }}
            >
              Check Payment Status
            </Button>
          </Box>
        )}
        
        {!showQrCode && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Appointment ID: #{appointmentId}
              </Typography>
              <Typography variant="h6" color="primary" fontWeight="bold">
                Amount: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0)}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <PaymentMethodSelector 
              value={paymentMethod} 
              onChange={setPaymentMethod}
            />
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                By clicking "Proceed to Payment", you will be redirected to the MoMo payment gateway to complete your transaction.
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={loading}
        >
          Cancel
        </Button>
        {!showQrCode && (
          <Button
            onClick={handleProceedToPayment}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModal; 