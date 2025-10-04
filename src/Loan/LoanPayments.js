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
  FormLabel,
  Divider
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import SaveIcon from '@mui/icons-material/Save';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import {
  getAllPayments,
  getPaymentsByLoanId,
  getPaymentsByUserId,
  createPayment,
  updatePayment,
  deletePayment,
  markPaymentAsPaid,
  getPaymentMethods,
  getPaymentStatuses,
  getLoansByUserId
} from '../services/api';

function LoanPayments() {
  const [payments, setPayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [currentUserId] = useState(1); // Hardcoded for demo - replace with actual user context
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState({
    loanId: '',
    paymentNumber: '',
    amount: '',
    dueDate: new Date(),
    paymentStatus: 'PENDING',
    paymentMethod: '',
    transactionReference: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedLoanId) {
      fetchPaymentsByLoan(selectedLoanId);
    } else {
      fetchPaymentsByUser();
    }
  }, [selectedLoanId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [loansData, methodsData, statusesData] = await Promise.all([
        getLoansByUserId(currentUserId),
        getPaymentMethods(),
        getPaymentStatuses()
      ]);
      setLoans(loansData);
      setPaymentMethods(methodsData);
      setPaymentStatuses(statusesData);
      
      // Load all user payments initially
      await fetchPaymentsByUser();
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load payment data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentsByUser = async () => {
    try {
      const paymentsData = await getPaymentsByUserId(currentUserId);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching user payments:', error);
    }
  };

  const fetchPaymentsByLoan = async (loanId) => {
    try {
      const paymentsData = await getPaymentsByLoanId(loanId);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching loan payments:', error);
    }
  };

  const handleLoanFilter = (loanId) => {
    setSelectedLoanId(loanId);
  };

  const handleOpenDialog = (payment = null) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        loanId: payment.loan?.id || '',
        paymentNumber: payment.paymentNumber || '',
        amount: payment.amount ? payment.amount.toString() : '',
        dueDate: payment.dueDate ? new Date(payment.dueDate) : new Date(),
        paymentStatus: payment.paymentStatus || 'PENDING',
        paymentMethod: payment.paymentMethod || '',
        transactionReference: payment.transactionReference || '',
        notes: payment.notes || ''
      });
    } else {
      setEditingPayment(null);
      setFormData({
        loanId: selectedLoanId || '',
        paymentNumber: '',
        amount: '',
        dueDate: new Date(),
        paymentStatus: 'PENDING',
        paymentMethod: '',
        transactionReference: '',
        notes: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPayment(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for payment number to prevent overflow
    if (name === 'paymentNumber') {
      const numValue = parseInt(value);
      if (value === '' || (numValue >= 1 && numValue <= 2147483647)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dueDate: date
    }));
  };

  // Updated handleSubmit function in your React component
const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.loanId) {
        setSnackbar({
          open: true,
          message: 'Please select a loan',
          severity: 'error'
        });
        return;
      }
  
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setSnackbar({
          open: true,
          message: 'Valid amount is required',
          severity: 'error'
        });
        return;
      }
  
      const paymentData = {
        loan: { 
          id: formData.loanId,
          user: { id: currentUserId } // Add user ID here
        },
        paymentNumber: formData.paymentNumber ? Math.min(parseInt(formData.paymentNumber), 2147483647) : 1,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate.toISOString().split('T')[0],
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod || null,
        transactionReference: formData.transactionReference || null,
        notes: formData.notes || null
      };
  
      if (editingPayment) {
        await updatePayment(editingPayment.id, paymentData);
        setSnackbar({
          open: true,
          message: 'Payment updated successfully',
          severity: 'success'
        });
      } else {
        await createPayment(paymentData);
        setSnackbar({
          open: true,
          message: 'Payment created successfully',
          severity: 'success'
        });
      }
  
      handleCloseDialog();
      // Refresh payments based on current filter
      if (selectedLoanId) {
        fetchPaymentsByLoan(selectedLoanId);
      } else {
        fetchPaymentsByUser();
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save payment',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await deletePayment(id);
        setSnackbar({
          open: true,
          message: 'Payment deleted successfully',
          severity: 'success'
        });
        // Refresh payments based on current filter
        if (selectedLoanId) {
          fetchPaymentsByLoan(selectedLoanId);
        } else {
          fetchPaymentsByUser();
        }
      } catch (error) {
        console.error('Error deleting payment:', error);
        setSnackbar({
          open: true,
          message: 'Failed to delete payment',
          severity: 'error'
        });
      }
    }
  };

  const handleMarkAsPaid = async (paymentId) => {
    try {
      await markPaymentAsPaid(paymentId, new Date().toISOString().split('T')[0], 'BANK_TRANSFER', null);
      setSnackbar({
        open: true,
        message: 'Payment marked as paid',
        severity: 'success'
      });
      // Refresh payments based on current filter
      if (selectedLoanId) {
        fetchPaymentsByLoan(selectedLoanId);
      } else {
        fetchPaymentsByUser();
      }
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      setSnackbar({
        open: true,
        message: 'Failed to mark payment as paid',
        severity: 'error'
      });
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
      'PAID': { color: 'success', icon: <CheckCircleIcon />, label: 'Completed' },
      'UNPAID': { color: 'warning', icon: <WarningIcon />, label: 'Pending' },
      'OVERDUE': { color: 'error', icon: <ErrorIcon />, label: 'Overdue' },
      'PARTIALLY_PAID': { color: 'info', icon: <WarningIcon />, label: 'Partial' }
    };

    const config = statusConfig[status] || statusConfig['UNPAID'];
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
      />
    );
  };

  const formatCurrency = (amount) => {
    return `LKR ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getLoanName = (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    return loan ? loan.loanName : 'Unknown Loan';
  };

  // Calculate summary data
  const totalPayments = payments.length;
  const paidPayments = payments.filter(p => p.paymentStatus === 'PAID').length;
  const pendingPayments = payments.filter(p => p.paymentStatus === 'UNPAID').length;
  const overduePayments = payments.filter(p => p.paymentStatus === 'OVERDUE').length;
  const totalPaidAmount = payments
    .filter(p => p.paymentStatus === 'PAID')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

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
          <ReceiptLongIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Loan Payments
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Track and manage your loan payment schedule
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Payments
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                {totalPayments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                {paidPayments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'warning.main' }}>
                {pendingPayments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Paid Amount
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'info.main' }}>
                {formatCurrency(totalPaidAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Typography variant="h6">
            Payment History
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={selectedLoanId}
              onChange={(e) => handleLoanFilter(e.target.value)}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return 'All Loans';
                }
                return getLoanName(selected);
              }}
            >
              <MenuItem value="">
                <em>All Loans</em>
              </MenuItem>
              {loans.map((loan) => (
                <MenuItem key={loan.id} value={loan.id}>
                  {loan.loanName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Manual Payment
        </Button>
      </Stack>

      {/* Payments Table */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Loan</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Payment #</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Method</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Reference</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No payments found. Add a manual payment or set up automatic payment scheduling.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {getLoanName(payment.loan?.id)}
                    </TableCell>
                    <TableCell>{payment.paymentNumber || 'N/A'}</TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(payment.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      {payment.paymentMethod ? (
                        <Chip 
                          label={payment.paymentMethod.replace(/_/g, ' ')}
                          size="small"
                          variant="outlined"
                        />
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                        {payment.transactionReference || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {payment.notes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        {payment.paymentStatus !== 'PAID' && (
                          <Tooltip title="Mark as Paid">
                            <IconButton 
                              size="small" 
                              onClick={() => handleMarkAsPaid(payment.id)}
                              color="success"
                            >
                              <PaymentIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenDialog(payment)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(payment.id)}
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

      {/* Add/Edit Payment Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPayment ? 'Edit Payment' : 'Add Manual Payment'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <FormLabel>Loan</FormLabel>
                  <Select
                    name="loanId"
                    value={formData.loanId}
                    onChange={handleChange}
                    size="small"
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      <em>Select a loan</em>
                    </MenuItem>
                    {loans.map((loan) => (
                      <MenuItem key={loan.id} value={loan.id}>
                        {loan.loanName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Payment Number"
                  name="paymentNumber"
                  type="number"
                  value={formData.paymentNumber}
                  onChange={handleChange}
                  placeholder="1, 2, 3..."
                  inputProps={{
                    min: 1,
                    max: 2147483647
                  }}
                  helperText="Maximum value: 2,147,483,647"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Due Date"
                  value={formData.dueDate}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <FormLabel>Payment Status</FormLabel>
                  <Select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleChange}
                    size="small"
                  >
                    {paymentStatuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    size="small"
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Select method (optional)</em>
                    </MenuItem>
                    {paymentMethods.map((method) => (
                      <MenuItem key={method} value={method}>
                        {method.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Transaction Reference"
                  name="transactionReference"
                  value={formData.transactionReference}
                  onChange={handleChange}
                  placeholder="Reference number or transaction ID"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  placeholder="Optional notes..."
                />
              </Grid>
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
            {editingPayment ? 'Update' : 'Save'}
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

export default LoanPayments;