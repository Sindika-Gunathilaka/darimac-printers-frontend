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
  InputLabel
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
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

function OtherPrints() {
  const [prints, setPrints] = useState([]);
  const [filteredPrints, setFilteredPrints] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingPrint, setEditingPrint] = useState(null);
  const [selectedPrint, setSelectedPrint] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState({
    description: '',
    printDate: new Date(),
    totalCost: '',
    totalAmount: '',
    paymentStatus: 'UNPAID',
    customerRemark: '',
    amountPaid: ''
  });

  const [paymentData, setPaymentData] = useState({
    amountPaid: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterPrints();
  }, [prints, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [printsResponse, statusesResponse, summaryResponse] = await Promise.all([
        fetch('/api/other-prints'),
        fetch('/api/other-prints/payment-statuses'),
        fetch('/api/other-prints/summary')
      ]);

      const printsData = await printsResponse.json();
      const statusesData = await statusesResponse.json();
      const summaryData = await summaryResponse.json();

      setPrints(printsData);
      setPaymentStatuses(statusesData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPrints = () => {
    let filtered = prints;

    // Filter by search term (customer remark or description)
    if (searchTerm) {
      filtered = filtered.filter(print => 
        print.customerRemark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        print.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(print => print.paymentStatus === statusFilter);
    }

    setFilteredPrints(filtered);
  };

  const handleOpenDialog = (print = null) => {
    if (print) {
      setEditingPrint(print);
      setFormData({
        description: print.description || '',
        printDate: print.printDate ? new Date(print.printDate) : new Date(),
        totalCost: print.totalCost ? print.totalCost.toString() : '',
        totalAmount: print.totalAmount ? print.totalAmount.toString() : '',
        paymentStatus: print.paymentStatus || 'UNPAID',
        customerRemark: print.customerRemark || '',
        amountPaid: print.amountPaid ? print.amountPaid.toString() : ''
      });
    } else {
      setEditingPrint(null);
      setFormData({
        description: '',
        printDate: new Date(),
        totalCost: '',
        totalAmount: '',
        paymentStatus: 'UNPAID',
        customerRemark: '',
        amountPaid: ''
      });
    }
    setDialogOpen(true);
  };

  const handleOpenPaymentDialog = (print) => {
    setSelectedPrint(print);
    setPaymentData({
      amountPaid: print.amountPaid ? print.amountPaid.toString() : ''
    });
    setPaymentDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPrint(null);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedPrint(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      printDate: date
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.description.trim()) {
        setSnackbar({
          open: true,
          message: 'Description is required',
          severity: 'error'
        });
        return;
      }

      if (!formData.totalCost || parseFloat(formData.totalCost) < 0) {
        setSnackbar({
          open: true,
          message: 'Valid total cost is required',
          severity: 'error'
        });
        return;
      }

      if (!formData.totalAmount || parseFloat(formData.totalAmount) < 0) {
        setSnackbar({
          open: true,
          message: 'Valid total amount is required',
          severity: 'error'
        });
        return;
      }

      const printData = {
        description: formData.description.trim(),
        printDate: formData.printDate.toISOString().split('T')[0],
        totalCost: parseFloat(formData.totalCost),
        totalAmount: parseFloat(formData.totalAmount),
        paymentStatus: formData.paymentStatus,
        customerRemark: formData.customerRemark.trim() || null,
        amountPaid: formData.amountPaid ? parseFloat(formData.amountPaid) : 0
      };

      const url = editingPrint ? `/api/other-prints/${editingPrint.id}` : '/api/other-prints';
      const method = editingPrint ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(printData)
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: editingPrint ? 'Print updated successfully' : 'Print created successfully',
          severity: 'success'
        });
        handleCloseDialog();
        fetchData();
      } else {
        throw new Error('Failed to save print');
      }
    } catch (error) {
      console.error('Error saving print:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save print',
        severity: 'error'
      });
    }
  };

  const handleUpdatePayment = async () => {
    try {
      if (!paymentData.amountPaid || parseFloat(paymentData.amountPaid) < 0) {
        setSnackbar({
          open: true,
          message: 'Valid amount is required',
          severity: 'error'
        });
        return;
      }

      const response = await fetch(`/api/other-prints/${selectedPrint.id}/payment?amountPaid=${parseFloat(paymentData.amountPaid)}`, {
        method: 'PUT'
      });

      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'Payment updated successfully',
          severity: 'success'
        });
        handleClosePaymentDialog();
        fetchData();
      } else {
        throw new Error('Failed to update payment');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update payment',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this print record?')) {
      try {
        const response = await fetch(`/api/other-prints/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setSnackbar({
            open: true,
            message: 'Print deleted successfully',
            severity: 'success'
          });
          fetchData();
        } else {
          throw new Error('Failed to delete print');
        }
      } catch (error) {
        console.error('Error deleting print:', error);
        setSnackbar({
          open: true,
          message: 'Failed to delete print',
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
      'PAID': { color: 'success', icon: <CheckCircleIcon />, label: 'Paid' },
      'UNPAID': { color: 'warning', icon: <WarningIcon />, label: 'Unpaid' },
      'PARTIALLY_PAID': { color: 'info', icon: <WarningIcon />, label: 'Partially Paid' },
      'OVERDUE': { color: 'error', icon: <ErrorIcon />, label: 'Overdue' }
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
    return `LKR ${parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateProfit = (totalAmount, totalCost) => {
    return parseFloat(totalAmount || 0) - parseFloat(totalCost || 0);
  };

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
          <PrintIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Other Prints
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Manage miscellaneous printing jobs and track payments
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Jobs
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                {summary.totalCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                {formatCurrency(summary.totalRevenue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Profit
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'info.main' }}>
                {formatCurrency(summary.totalProfit)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Outstanding
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'warning.main' }}>
                {formatCurrency(summary.totalOutstanding)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by customer or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            }}
            sx={{ minWidth: 250 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status Filter"
              startAdornment={<FilterListIcon />}
            >
              <MenuItem value="">All</MenuItem>
              {paymentStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.replace(/_/g, ' ')}
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
          Add New Print
        </Button>
      </Stack>

      {/* Prints Table */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Cost</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Profit</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Paid</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Balance</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPrints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {prints.length === 0 ? 'No print records found. Add your first print job.' : 'No prints match your search criteria.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrints.map((print) => (
                  <TableRow key={print.id} hover>
                    <TableCell>
                      {print.printDate ? new Date(print.printDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }} noWrap>
                        {print.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 150 }} noWrap>
                        {print.customerRemark || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(print.totalCost)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(print.totalAmount)}
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'medium',
                      color: calculateProfit(print.totalAmount, print.totalCost) >= 0 ? 'success.main' : 'error.main'
                    }}>
                      {formatCurrency(calculateProfit(print.totalAmount, print.totalCost))}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(print.amountPaid)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(print.balance)}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(print.paymentStatus)}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        {print.paymentStatus !== 'PAID' && (
                          <Tooltip title="Update Payment">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenPaymentDialog(print)}
                              color="success"
                            >
                              <PaymentIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenDialog(print)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(print.id)}
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

      {/* Add/Edit Print Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPrint ? 'Edit Print Job' : 'Add New Print Job'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  required
                  placeholder="Describe the print job..."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Print Date"
                  value={formData.printDate}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Customer Remark"
                  name="customerRemark"
                  value={formData.customerRemark}
                  onChange={handleChange}
                  placeholder="Customer name and remarks..."
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Total Cost"
                  name="totalCost"
                  type="number"
                  value={formData.totalCost}
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
                  label="Total Amount"
                  name="totalAmount"
                  type="number"
                  value={formData.totalAmount}
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
                  label="Amount Paid"
                  name="amountPaid"
                  type="number"
                  value={formData.amountPaid}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                  }}
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
            {editingPrint ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Update Dialog */}
      <Dialog open={paymentDialogOpen} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Update Payment
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Amount: {selectedPrint && formatCurrency(selectedPrint.totalAmount)}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Balance: {selectedPrint && formatCurrency(selectedPrint.balance)}
            </Typography>
            <TextField
              fullWidth
              label="Amount Paid"
              name="amountPaid"
              type="number"
              value={paymentData.amountPaid}
              onChange={handlePaymentChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
              }}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdatePayment} 
            variant="contained"
            startIcon={<PaymentIcon />}
          >
            Update Payment
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

export default OtherPrints;