import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Alert,
  Snackbar,
  Card,
  CardContent
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ReceiptIcon from '@mui/icons-material/Receipt';
import {
  getExpenseById,
  createExpense,
  updateExpense,
  getAllSuppliers,
  getExpenseTypes,
  getPaymentStatuses
} from '../../services/api';
import { format } from 'date-fns';

function ExpenseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const [formData, setFormData] = useState({
    description: '',
    expenseType: '',
    amount: '',
    grnNumber: '',
    expenseDate: new Date(),
    invoiceNumber: '',
    supplierId: '',
    paymentStatus: 'UNPAID',
    paymentDueDate: null,
    paymentDate: null,
    notes: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all required reference data in parallel
        const [suppliersData, typesData, statusesData] = await Promise.all([
          getAllSuppliers(),
          getExpenseTypes(),
          getPaymentStatuses()
        ]);
        
        setSuppliers(suppliersData);
        setExpenseTypes(typesData);
        setPaymentStatuses(statusesData);
        
        // If editing, fetch the expense
        if (isEditMode) {
          const expense = await getExpenseById(id);
          
          setFormData({
            description: expense.description || '',
            expenseType: expense.expenseType || '',
            amount: expense.amount || '',
            grnNumber: expense.grnNumber || '',
            expenseDate: expense.expenseDate ? new Date(expense.expenseDate) : new Date(),
            invoiceNumber: expense.invoiceNumber || '',
            supplierId: expense.supplier ? expense.supplier.id : '',
            paymentStatus: expense.paymentStatus || 'UNPAID',
            paymentDueDate: expense.paymentDueDate ? new Date(expense.paymentDueDate) : null,
            paymentDate: expense.paymentDate ? new Date(expense.paymentDate) : null,
            notes: expense.notes || ''
          });
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description || !formData.description.toString().trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.expenseType) {
      newErrors.expenseType = 'Expense type is required';
    }
    
    if (!formData.amount || formData.amount.toString().trim() === '') {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!formData.supplierId) {
      newErrors.supplierId = 'Supplier is required';
    }
    
    if (!formData.expenseDate) {
      newErrors.expenseDate = 'Expense date is required';
    }
    
    // If payment status is PAID, payment date is required
    if (formData.paymentStatus === 'PAID' && !formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required for paid expenses';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Format dates for API
      const expenseData = {
        description: formData.description,
        expenseType: formData.expenseType,
        amount: parseFloat(formData.amount),
        grnNumber: formData.grnNumber,
        expenseDate: format(formData.expenseDate, 'yyyy-MM-dd'),
        invoiceNumber: formData.invoiceNumber,
        supplier: { id: formData.supplierId },
        paymentStatus: formData.paymentStatus,
        paymentDueDate: formData.paymentDueDate ? format(formData.paymentDueDate, 'yyyy-MM-dd') : null,
        paymentDate: formData.paymentDate ? format(formData.paymentDate, 'yyyy-MM-dd') : null,
        notes: formData.notes
      };
      
      if (isEditMode) {
        await updateExpense(id, expenseData);
        setSnackbar({
          open: true,
          message: 'Expense updated successfully',
          severity: 'success'
        });
      } else {
        await createExpense(expenseData);
        setSnackbar({
          open: true,
          message: 'Expense created successfully',
          severity: 'success'
        });
      }
      
      // Navigate after a short delay to allow user to see the success message
      setTimeout(() => {
        navigate('/expenses');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving expense:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save expense. Please try again later.',
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
          <ReceiptIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Edit Expense' : 'New Expense'}
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          {isEditMode ? 'Update expense details below' : 'Fill in the details to create a new expense record'}
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
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  error={!!errors.description}
                  helperText={errors.description}
                  placeholder="Enter expense description"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth required error={!!errors.expenseType}>
                  <Select
                    name="expenseType"
                    value={formData.expenseType}
                    onChange={handleChange}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return <span style={{ color: '#9e9e9e' }}>Expense Type</span>;
                      }
                      return selected.replace(/_/g, ' ');
                    }}
                    sx={{
                      '& .MuiSelect-select': {
                        paddingTop: '16.5px',
                        paddingBottom: '16.5px',
                      }
                    }}
                  >
                    <MenuItem value="" disabled>
                      <em>Select expense type</em>
                    </MenuItem>
                    {expenseTypes.map(type => (
                      <MenuItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.expenseType && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {errors.expenseType}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Amount"
                  name="amount"
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                  }}
                  value={formData.amount}
                  onChange={handleChange}
                  error={!!errors.amount}
                  helperText={errors.amount}
                  placeholder="0.00"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.supplierId}>
                  <Select
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleChange}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return <span style={{ color: '#9e9e9e' }}>Supplier</span>;
                      }
                      const supplier = suppliers.find(s => s.id === selected);
                      return supplier ? supplier.name : '';
                    }}
                    sx={{
                      '& .MuiSelect-select': {
                        paddingTop: '16.5px',
                        paddingBottom: '16.5px',
                      }
                    }}
                  >
                    <MenuItem value="" disabled>
                      <em>Select a supplier</em>
                    </MenuItem>
                    {suppliers.map(supplier => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.supplierId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {errors.supplierId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Document Information Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'medium' }}>
              Document Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="GRN Number"
                  name="grnNumber"
                  value={formData.grnNumber}
                  onChange={handleChange}
                  placeholder="Goods Received Note number"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleChange}
                  placeholder="Supplier invoice number"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Expense Date"
                    value={formData.expenseDate}
                    onChange={(date) => handleDateChange('expenseDate', date)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth
                        required
                        error={!!errors.expenseDate}
                        helperText={errors.expenseDate}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Payment Information Card */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'medium' }}>
              Payment Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    label="Payment Status"
                  >
                    {paymentStatuses.map(status => (
                      <MenuItem key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Payment Due Date"
                    value={formData.paymentDueDate}
                    onChange={(date) => handleDateChange('paymentDueDate', date)}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Payment Date"
                    value={formData.paymentDate}
                    onChange={(date) => handleDateChange('paymentDate', date)}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        fullWidth
                        error={!!errors.paymentDate}
                        helperText={errors.paymentDate}
                        disabled={formData.paymentStatus !== 'PAID'}
                      />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Notes Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'medium' }}>
              Additional Notes
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              multiline
              rows={4}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes or comments about this expense..."
            />
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <Paper sx={{ p: 3, position: 'sticky', bottom: 0, zIndex: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => navigate('/expenses')}
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
              {submitting ? 'Saving...' : isEditMode ? 'Update Expense' : 'Save Expense'}
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

export default ExpenseForm;