import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  Stack,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  FormLabel
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SaveIcon from '@mui/icons-material/Save';
import PaymentIcon from '@mui/icons-material/Payment';
import {
  getAllLoans,
  getLoansByUserId,
  createLoan,
  updateLoan,
  deleteLoan,
  getLoanTypes,
  getLoanStatuses
} from '../services/api';

function LoanManagement() {
  const [loans, setLoans] = useState([]);
  const [loanTypes, setLoanTypes] = useState([]);
  const [loanStatuses, setLoanStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [currentUserId] = useState(1); // Hardcoded for demo - replace with actual user context
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState({
    loanName: '',
    principalAmount: '',
    interestRate: '',
    loanTermMonths: '',
    startDate: new Date(),
    loanType: 'PERSONAL',
    status: 'ACTIVE',
    description: '',
    lender: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [loansData, typesData, statusesData] = await Promise.all([
        getLoansByUserId(currentUserId),
        getLoanTypes(),
        getLoanStatuses()
      ]);
      setLoans(loansData);
      setLoanTypes(typesData);
      setLoanStatuses(statusesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load loan data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (loan = null) => {
    if (loan) {
      setEditingLoan(loan);
      setFormData({
        loanName: loan.loanName || '',
        principalAmount: loan.principalAmount ? loan.principalAmount.toString() : '',
        interestRate: loan.interestRate ? loan.interestRate.toString() : '',
        loanTermMonths: loan.loanTermMonths ? loan.loanTermMonths.toString() : '',
        startDate: loan.startDate ? new Date(loan.startDate) : new Date(),
        loanType: loan.loanType || 'PERSONAL',
        status: loan.status || 'ACTIVE',
        description: loan.description || '',
        lender: loan.lender || ''
      });
    } else {
      setEditingLoan(null);
      setFormData({
        loanName: '',
        principalAmount: '',
        interestRate: '',
        loanTermMonths: '',
        startDate: new Date(),
        loanType: 'PERSONAL',
        status: 'ACTIVE',
        description: '',
        lender: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLoan(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      startDate: date
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.loanName.trim()) {
        setSnackbar({
          open: true,
          message: 'Loan name is required',
          severity: 'error'
        });
        return;
      }
      
      if (!formData.principalAmount || parseFloat(formData.principalAmount) <= 0) {
        setSnackbar({
          open: true,
          message: 'Valid principal amount is required',
          severity: 'error'
        });
        return;
      }

      if (!formData.interestRate || parseFloat(formData.interestRate) < 0) {
        setSnackbar({
          open: true,
          message: 'Valid interest rate is required',
          severity: 'error'
        });
        return;
      }

      if (!formData.loanTermMonths || parseInt(formData.loanTermMonths) <= 0) {
        setSnackbar({
          open: true,
          message: 'Valid loan term is required',
          severity: 'error'
        });
        return;
      }

      const loanData = {
        user: { id: currentUserId }, // Setting user relationship
        loanName: formData.loanName,
        principalAmount: parseFloat(formData.principalAmount),
        interestRate: parseFloat(formData.interestRate),
        loanTermMonths: parseInt(formData.loanTermMonths),
        startDate: formData.startDate.toISOString().split('T')[0],
        loanType: formData.loanType,
        status: formData.status,
        description: formData.description,
        lender: formData.lender
      };

      if (editingLoan) {
        await updateLoan(editingLoan.id, loanData);
        setSnackbar({
          open: true,
          message: 'Loan updated successfully',
          severity: 'success'
        });
      } else {
        await createLoan(loanData);
        setSnackbar({
          open: true,
          message: 'Loan created successfully',
          severity: 'success'
        });
      }

      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving loan:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save loan',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this loan?')) {
      try {
        await deleteLoan(id);
        setSnackbar({
          open: true,
          message: 'Loan deleted successfully',
          severity: 'success'
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting loan:', error);
        setSnackbar({
          open: true,
          message: 'Failed to delete loan',
          severity: 'error'
        });
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      'ACTIVE': { color: 'success', label: 'Active' },
      'COMPLETED': { color: 'info', label: 'Completed' },
      'DEFAULTED': { color: 'error', label: 'Defaulted' },
      'SUSPENDED': { color: 'warning', label: 'Suspended' }
    };

    const config = statusConfig[status] || statusConfig['ACTIVE'];
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
      />
    );
  };

  const formatCurrency = (amount) => {
    return `LKR ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateMonthlyPayment = (principal, rate, months) => {
    if (!principal || !rate || !months) return 0;
    
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) {
      return principal / months;
    }
    
    const emi = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                (Math.pow(1 + monthlyRate, months) - 1);
    return emi;
  };

  // Calculate summary data
  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const totalPrincipal = activeLoans.reduce((sum, l) => sum + parseFloat(l.principalAmount || 0), 0);
  const totalMonthlyPayments = activeLoans.reduce((sum, l) => {
    return sum + calculateMonthlyPayment(l.principalAmount, l.interestRate, l.loanTermMonths);
  }, 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
          <AccountBalanceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Loan Management
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Manage your personal loans and track payments
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Loans
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                {loans.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Principal
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                {formatCurrency(totalPrincipal)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Monthly Payments
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'warning.main' }}>
                {formatCurrency(totalMonthlyPayments)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 3 }}>
        <Typography variant="h6">
          Your Loans
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Loan
        </Button>
      </Stack>

      {/* Loans Table */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Loan Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Principal</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Interest Rate</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Term</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Monthly Payment</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Lender</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No loans found. Click "Add New Loan" to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                loans.map((loan) => (
                  <TableRow key={loan.id} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {loan.loanName}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={loan.loanType?.replace(/_/g, ' ')} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(loan.principalAmount)}
                    </TableCell>
                    <TableCell>{loan.interestRate}%</TableCell>
                    <TableCell>{loan.loanTermMonths} months</TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(calculateMonthlyPayment(loan.principalAmount, loan.interestRate, loan.loanTermMonths))}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(loan.status)}
                    </TableCell>
                    <TableCell>{loan.lender || 'N/A'}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenDialog(loan)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="View Payments">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => window.location.href = `/loan-payments?loanId=${loan.id}`}
                          >
                            <PaymentIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(loan.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Loan Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLoan ? 'Edit Loan' : 'Add New Loan'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Loan Name"
                  name="loanName"
                  value={formData.loanName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Home Loan"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <FormLabel>Loan Type</FormLabel>
                  <Select
                    name="loanType"
                    value={formData.loanType}
                    onChange={handleChange}
                    size="small"
                  >
                    {loanTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Principal Amount"
                  name="principalAmount"
                  type="number"
                  value={formData.principalAmount}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Interest Rate"
                  name="interestRate"
                  type="number"
                  value={formData.interestRate}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Loan Term"
                  name="loanTermMonths"
                  type="number"
                  value={formData.loanTermMonths}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">months</InputAdornment>,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Lender"
                  name="lender"
                  value={formData.lender}
                  onChange={handleChange}
                  placeholder="Bank or institution name"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <FormLabel>Status</FormLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    size="small"
                  >
                    {loanStatuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  placeholder="Optional description..."
                />
              </Grid>

              {/* Show calculated monthly payment */}
              {formData.principalAmount && formData.interestRate && formData.loanTermMonths && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="subtitle2">
                      Estimated Monthly Payment: {formatCurrency(calculateMonthlyPayment(
                        parseFloat(formData.principalAmount),
                        parseFloat(formData.interestRate),
                        parseInt(formData.loanTermMonths)
                      ))}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            startIcon={<SaveIcon />}
          >
            {editingLoan ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default LoanManagement;