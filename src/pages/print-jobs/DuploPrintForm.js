import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Grid,
  Divider,
  InputAdornment,
  CircularProgress,
  FormControl,
  Select,
  Card,
  CardContent,
  Stack,
  Alert,
  Snackbar
} from '@mui/material';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import {
  getCustomers,
  getDuploPrintById,
  createDuploPrint,
  updateDuploPrint
} from '../../services/api';

function DuploPrintForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const [formData, setFormData] = useState({
    jobName: '',
    jobDescription: '',
    customerId: '',
    quantity: '',
    paperSize: '',
    copies: '1',
    otherExpenses: '0',
    otherExpensesDescription: '',
    baseCost: '',
    profitPercentage: '20'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch customers
        const customersData = await getCustomers();
        setCustomers(customersData);
        
        // If editing, fetch the print job
        if (isEditMode) {
          try {
            const printJob = await getDuploPrintById(id);
            
            setFormData({
              jobName: printJob.jobName || '',
              jobDescription: printJob.jobDescription || '',
              customerId: printJob.customer?.id || '',
              quantity: String(printJob.quantity || ''),
              paperSize: printJob.paperSize || '',
              copies: String(printJob.copies || '1'),
              otherExpenses: String(printJob.otherExpenses || '0'),
              otherExpensesDescription: printJob.otherExpensesDescription || '',
              baseCost: String(printJob.baseCost || ''),
              profitPercentage: String(printJob.profitPercentage || '20')
            });
          } catch (error) {
            console.error('Error fetching Duplo print:', error);
            setSnackbar({
              open: true,
              message: 'Failed to load print job details.',
              severity: 'error'
            });
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load data. Please try again later.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.jobName || !formData.jobName.toString().trim()) {
      newErrors.jobName = 'Job name is required';
    }
    
    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }
    
    if (!formData.quantity || formData.quantity.toString().trim() === '') {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(formData.quantity) || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    if (!formData.baseCost || formData.baseCost.toString().trim() === '') {
      newErrors.baseCost = 'Base cost is required';
    } else if (isNaN(formData.baseCost) || parseFloat(formData.baseCost) <= 0) {
      newErrors.baseCost = 'Base cost must be greater than 0';
    }
    
    if (formData.copies && (isNaN(formData.copies) || parseInt(formData.copies) <= 0)) {
      newErrors.copies = 'Copies must be greater than 0';
    }
    
    if (formData.otherExpenses && isNaN(formData.otherExpenses)) {
      newErrors.otherExpenses = 'Other expenses must be a valid number';
    }
    
    if (formData.profitPercentage && (isNaN(formData.profitPercentage) || parseInt(formData.profitPercentage) < 0)) {
      newErrors.profitPercentage = 'Profit percentage must be 0 or greater';
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Transform form data to match backend expectations
      const printJobData = {
        jobName: formData.jobName,
        jobDescription: formData.jobDescription,
        customer: { id: parseInt(formData.customerId) },
        quantity: parseInt(formData.quantity),
        paperSize: formData.paperSize,
        copies: parseInt(formData.copies || 1),
        otherExpenses: parseFloat(formData.otherExpenses) || 0,
        otherExpensesDescription: formData.otherExpensesDescription,
        baseCost: parseFloat(formData.baseCost),
        profitPercentage: parseInt(formData.profitPercentage),
        printType: 'DUPLO'
      };
      
      if (isEditMode) {
        await updateDuploPrint(id, printJobData);
        setSnackbar({
          open: true,
          message: 'Duplo print updated successfully',
          severity: 'success'
        });
      } else {
        await createDuploPrint(printJobData);
        setSnackbar({
          open: true,
          message: 'Duplo print created successfully',
          severity: 'success'
        });
      }
      
      // Navigate after a short delay to allow user to see the success message
      setTimeout(() => {
        navigate('/print-jobs');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving duplo print:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save duplo print. Please try again later.',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // Calculate estimated cost
  const calculateEstimatedCost = () => {
    const baseCost = parseFloat(formData.baseCost) || 0;
    const otherExpenses = parseFloat(formData.otherExpenses) || 0;
    const profitPercentage = parseInt(formData.profitPercentage) || 0;
    
    const subtotal = baseCost + otherExpenses;
    const profit = subtotal * (profitPercentage / 100);
    
    return subtotal + profit;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          <LocalPrintshopIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Edit Duplo Print' : 'New Duplo Print'}
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          {isEditMode ? 'Update duplo print job details below' : 'Fill in the details to create a new duplo print job'}
        </Typography>
      </Box>
      
      <form onSubmit={handleSubmit}>
        {/* Basic Information Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'medium' }}>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  required
                  label="Job Name"
                  name="jobName"
                  value={formData.jobName}
                  onChange={handleChange}
                  error={!!errors.jobName}
                  helperText={errors.jobName}
                  placeholder="Enter job name"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required error={!!errors.customerId}>
                  <Select
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return <span style={{ color: '#9e9e9e' }}>Customer</span>;
                      }
                      const customer = customers.find(c => c.id === parseInt(selected));
                      return customer ? customer.name : '';
                    }}
                    sx={{
                      '& .MuiSelect-select': {
                        paddingTop: '16.5px',
                        paddingBottom: '16.5px',
                      }
                    }}
                  >
                    <MenuItem value="" disabled>
                      <em>Select a customer</em>
                    </MenuItem>
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.customerId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {errors.customerId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Job Description"
                  name="jobDescription"
                  multiline
                  rows={3}
                  value={formData.jobDescription}
                  onChange={handleChange}
                  placeholder="Describe the duplo print job requirements..."
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Job Specifications Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'medium' }}>
              Job Specifications
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Paper Size"
                  name="paperSize"
                  value={formData.paperSize}
                  onChange={handleChange}
                  placeholder="e.g., A4, A3, Legal"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  error={!!errors.quantity}
                  helperText={errors.quantity}
                  placeholder="Number of items"
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Copies per Original"
                  name="copies"
                  type="number"
                  value={formData.copies}
                  onChange={handleChange}
                  error={!!errors.copies}
                  helperText={errors.copies}
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Cost Information Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'medium' }}>
              Cost Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Base Cost"
                  name="baseCost"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                  }}
                  value={formData.baseCost}
                  onChange={handleChange}
                  error={!!errors.baseCost}
                  helperText={errors.baseCost}
                  placeholder="0.00"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Other Expenses"
                  name="otherExpenses"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                  }}
                  value={formData.otherExpenses}
                  onChange={handleChange}
                  error={!!errors.otherExpenses}
                  helperText={errors.otherExpenses}
                  placeholder="0.00"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Other Expenses Description"
                  name="otherExpensesDescription"
                  value={formData.otherExpensesDescription}
                  onChange={handleChange}
                  placeholder="Describe additional expenses..."
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Pricing Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'medium' }}>
              Pricing & Total
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3} alignItems="end">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Profit Percentage"
                  name="profitPercentage"
                  type="number"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    inputProps: { min: 0, max: 100 }
                  }}
                  value={formData.profitPercentage}
                  onChange={handleChange}
                  error={!!errors.profitPercentage}
                  helperText={errors.profitPercentage}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: 'primary.light', 
                  borderRadius: 1,
                  textAlign: 'center'
                }}>
                  <Typography variant="subtitle2" color="white" gutterBottom>
                    Estimated Total
                  </Typography>
                  <Typography variant="h4" color="white" sx={{ fontWeight: 'bold' }}>
                    LKR {calculateEstimatedCost().toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <Paper sx={{ p: 3, position: 'sticky', bottom: 0, zIndex: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => navigate('/print-jobs')}
              disabled={submitting}
              size="large"
              sx={{ minWidth: 140 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={submitting}
              size="large"
              sx={{ minWidth: 140 }}
            >
              {submitting ? 'Saving...' : isEditMode ? 'Update Duplo Print' : 'Create Duplo Print'}
            </Button>
          </Stack>
        </Paper>
      </form>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DuploPrintForm;