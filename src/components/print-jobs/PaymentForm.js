import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Divider,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import { getPrintJobById, recordPayment } from '../../services/apiService';

function PaymentForm() {
  const { printJobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [printJob, setPrintJob] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    reference: '',
    type: 'PARTIAL'
  });

  useEffect(() => {
    const fetchPrintJob = async () => {
      try {
        const data = await getPrintJobById(printJobId);
        setPrintJob(data);
        
        // If balance is available, set it as default amount
        if (data.balance) {
          setFormData({
            ...formData,
            amount: data.balance.toString(),
            type: data.balance === data.totalCost ? 'FULL' : 'PARTIAL'
          });
        }
      } catch (error) {
        console.error('Error fetching print job:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrintJob();
  }, [printJobId]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount.trim()) {
      newErrors.amount = 'Payment amount is required';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Payment amount must be greater than 0';
    } else if (printJob && parseFloat(formData.amount) > printJob.balance) {
      newErrors.amount = 'Payment amount cannot exceed the balance';
    }
    
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Update payment type based on amount
    if (name === 'amount' && printJob) {
      const amount = parseFloat(value) || 0;
      const type = amount >= printJob.balance ? 'FULL' : 'PARTIAL';
      setFormData(prev => ({ ...prev, type }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const paymentData = {
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        reference: formData.reference,
        type: formData.type
      };
      
      await recordPayment(printJobId, paymentData);
      navigate('/print-jobs');
    } catch (error) {
      console.error('Error recording payment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Record Payment
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              Job Name:
            </Typography>
            <Typography variant="body1" gutterBottom>
              {printJob.jobName}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              Customer:
            </Typography>
            <Typography variant="body1" gutterBottom>
              {printJob.customer?.name || 'N/A'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1">
              Total Cost:
            </Typography>
            <Typography variant="body1" gutterBottom>
              ${printJob.totalCost?.toFixed(2) || '0.00'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1">
              Amount Paid:
            </Typography>
            <Typography variant="body1" gutterBottom>
              ${printJob.amountPaid?.toFixed(2) || '0.00'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="subtitle1">
              Balance:
            </Typography>
            <Typography variant="body1" gutterBottom>
              ${printJob.balance?.toFixed(2) || '0.00'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Payment Details
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payment Amount"
                name="amount"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                value={formData.amount}
                onChange={handleChange}
                error={!!errors.amount}
                helperText={errors.amount}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Payment Method"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                error={!!errors.paymentMethod}
                helperText={errors.paymentMethod}
                required
              >
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
                <MenuItem value="DEBIT_CARD">Debit Card</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                <MenuItem value="CHECK">Check</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reference / Notes"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
              />
            </Grid>
            
            {parseFloat(formData.amount) >= printJob.balance && (
              <Grid item xs={12}>
                <Alert severity="info">
                  This payment will fully settle the outstanding balance.
                </Alert>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/print-jobs')}
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                >
                  {submitting ? (
                    <CircularProgress size={24} />
                  ) : (
                    'Record Payment'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}

export default PaymentForm;