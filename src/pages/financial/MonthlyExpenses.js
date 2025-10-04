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
  Divider,
  FormLabel,
  ButtonGroup,
  Tabs,
  Tab,
  Badge
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
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FilterListIcon from '@mui/icons-material/FilterList';
import SummarizeIcon from '@mui/icons-material/Summarize';
import {
  getAllMonthlyExpenseEntries,
  getMonthlyExpenseEntriesForMonth,
  getUnpaidExpenseEntries,
  getOverdueExpenseEntries,
  getMonthlySummary,
  createMonthlyExpenseEntry,
  updateMonthlyExpenseEntry,
  deleteMonthlyExpenseEntry,
  markExpenseAsPaid,
  markExpenseAsUnpaid,
  autoGenerateCurrentMonth
} from '../../services/api';

function MonthlyExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState({
    recurringExpenseId: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    amount: '',
    paymentStatus: 'UNPAID',
    paymentDate: null,
    notes: '',
    dueDate: null
  });

  // Tab definitions
  const tabs = [
    { label: 'This Month', value: 'current' },
    { label: 'All Entries', value: 'all' },
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Overdue', value: 'overdue' }
  ];

  useEffect(() => {
    fetchData();
  }, [currentTab, selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let expensesData = [];
      
      switch (currentTab) {
        case 0: // This Month
          expensesData = await getMonthlyExpenseEntriesForMonth(selectedYear, selectedMonth);
          const summaryData = await getMonthlySummary(selectedYear, selectedMonth);
          setMonthlySummary(summaryData);
          break;
        case 1: // All Entries
          expensesData = await getAllMonthlyExpenseEntries();
          break;
        case 2: // Unpaid
          expensesData = await getUnpaidExpenseEntries();
          break;
        case 3: // Overdue
          expensesData = await getOverdueExpenseEntries();
          break;
        default:
          expensesData = await getMonthlyExpenseEntriesForMonth(selectedYear, selectedMonth);
      }
      
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load expense data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleMonthYearChange = () => {
    if (currentTab === 0) {
      fetchData();
    }
  };

  const handleOpenDialog = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        recurringExpenseId: expense.recurringExpense?.id || '',
        year: expense.year,
        month: expense.month,
        amount: expense.amount.toString(),
        paymentStatus: expense.paymentStatus,
        paymentDate: expense.paymentDate ? new Date(expense.paymentDate) : null,
        notes: expense.notes || '',
        dueDate: expense.dueDate ? new Date(expense.dueDate) : null
      });
    } else {
      setEditingExpense(null);
      setFormData({
        recurringExpenseId: '',
        year: selectedYear,
        month: selectedMonth,
        amount: '',
        paymentStatus: 'UNPAID',
        paymentDate: null,
        notes: '',
        dueDate: null
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingExpense(null);
  };

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

  const handleSubmit = async () => {
    try {
      // Validation
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setSnackbar({
          open: true,
          message: 'Valid amount is required',
          severity: 'error'
        });
        return;
      }

      const expenseData = {
        recurringExpenseId: formData.recurringExpenseId || null,
        year: parseInt(formData.year),
        month: parseInt(formData.month),
        amount: parseFloat(formData.amount),
        paymentStatus: formData.paymentStatus,
        paymentDate: formData.paymentDate ? formData.paymentDate.toISOString().split('T')[0] : null,
        notes: formData.notes,
        dueDate: formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : null
      };

      if (editingExpense) {
        await updateMonthlyExpenseEntry(editingExpense.id, expenseData);
        setSnackbar({
          open: true,
          message: 'Monthly expense updated successfully',
          severity: 'success'
        });
      } else {
        await createMonthlyExpenseEntry(expenseData);
        setSnackbar({
          open: true,
          message: 'Monthly expense created successfully',
          severity: 'success'
        });
      }

      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving expense:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save expense',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense entry?')) {
      try {
        await deleteMonthlyExpenseEntry(id);
        setSnackbar({
          open: true,
          message: 'Monthly expense deleted successfully',
          severity: 'success'
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting expense:', error);
        setSnackbar({
          open: true,
          message: 'Failed to delete expense',
          severity: 'error'
        });
      }
    }
  };

  const handleMarkAsPaid = async (id, paymentDate = null) => {
    try {
      await markExpenseAsPaid(id, paymentDate);
      setSnackbar({
        open: true,
        message: 'Expense marked as paid',
        severity: 'success'
      });
      fetchData();
    } catch (error) {
      console.error('Error marking expense as paid:', error);
      setSnackbar({
        open: true,
        message: 'Failed to mark expense as paid',
        severity: 'error'
      });
    }
  };

  const handleMarkAsUnpaid = async (id) => {
    try {
      await markExpenseAsUnpaid(id);
      setSnackbar({
        open: true,
        message: 'Expense marked as unpaid',
        severity: 'success'
      });
      fetchData();
    } catch (error) {
      console.error('Error marking expense as unpaid:', error);
      setSnackbar({
        open: true,
        message: 'Failed to mark expense as unpaid',
        severity: 'error'
      });
    }
  };

  const handleAutoGenerate = async () => {
    try {
      await autoGenerateCurrentMonth();
      setSnackbar({
        open: true,
        message: 'Monthly entries generated successfully',
        severity: 'success'
      });
      fetchData();
    } catch (error) {
      console.error('Error generating monthly entries:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate monthly entries',
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
      'PAID': { color: 'success', icon: <CheckCircleIcon />, label: 'Paid' },
      'UNPAID': { color: 'warning', icon: <WarningIcon />, label: 'Unpaid' },
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
    return `LKR ${parseFloat(amount).toFixed(2)}`;
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  // Count badges for tabs
  const unpaidCount = expenses.filter(e => e.paymentStatus === 'UNPAID').length;
  const overdueCount = expenses.filter(e => e.paymentStatus === 'OVERDUE').length;

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
          <ReceiptIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Monthly Expenses
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Track and manage your monthly expense payments
        </Typography>
      </Box>

      {/* Month/Year Selector and Actions */}
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        spacing={2} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', md: 'center' }} 
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              onClose={handleMonthYearChange}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              onClose={handleMonthYearChange}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="outlined"
            startIcon={<CalendarTodayIcon />}
            onClick={handleAutoGenerate}
            size="small"
          >
            Generate This Month
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="small"
          >
            Add Manual Entry
          </Button>
        </Stack>
      </Stack>

      {/* Summary Cards (only for current month view) */}
      {currentTab === 0 && monthlySummary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card elevation={1}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Total Expenses
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                  {formatCurrency(monthlySummary.totalExpenses)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Card elevation={1}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Paid Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                  {formatCurrency(monthlySummary.totalPaid)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Card elevation={1}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Pending Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'warning.main' }}>
                  {formatCurrency(monthlySummary.totalUnpaid)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Card elevation={1}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Total Entries
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'medium', color: 'info.main' }}>
                  {monthlySummary.totalEntries}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper elevation={1} sx={{ mb: 2 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="This Month" />
          <Tab label="All Entries" />
          <Tab 
            label={
              <Badge badgeContent={unpaidCount} color="warning" showZero={false}>
                Unpaid
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={overdueCount} color="error" showZero={false}>
                Overdue
              </Badge>
            } 
          />
        </Tabs>
      </Paper>

      {/* Expenses Table */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Expense</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Period</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Payment Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Notes</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No expense entries found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {expense.recurringExpense?.name || 'Manual Entry'}
                      {expense.recurringExpense?.category && (
                        <Chip 
                          label={expense.recurringExpense.category.replace(/_/g, ' ')}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {getMonthName(expense.month)} {expense.year}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>
                      {expense.dueDate ? new Date(expense.dueDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(expense.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      {expense.paymentDate ? new Date(expense.paymentDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                        {expense.notes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        {expense.paymentStatus !== 'PAID' && (
                          <Tooltip title="Mark as Paid">
                            <IconButton 
                              size="small" 
                              onClick={() => handleMarkAsPaid(expense.id)}
                              color="success"
                            >
                              <PaymentIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {expense.paymentStatus === 'PAID' && (
                          <Tooltip title="Mark as Unpaid">
                            <IconButton 
                              size="small" 
                              onClick={() => handleMarkAsUnpaid(expense.id)}
                              color="warning"
                            >
                              <WarningIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenDialog(expense)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(expense.id)}
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

      {/* Add/Edit Expense Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingExpense ? 'Edit Monthly Expense' : 'Add Manual Monthly Expense'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
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

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <FormLabel>Month</FormLabel>
                  <Select
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    size="small"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <MenuItem key={i + 1} value={i + 1}>
                        {getMonthName(i + 1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <FormLabel>Year</FormLabel>
                  <Select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    size="small"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
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
                    <MenuItem value="UNPAID">Unpaid</MenuItem>
                    <MenuItem value="PAID">Paid</MenuItem>
                    <MenuItem value="OVERDUE">Overdue</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Due Date"
                  value={formData.dueDate}
                  onChange={(date) => handleDateChange('dueDate', date)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>

              {formData.paymentStatus === 'PAID' && (
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Payment Date"
                    value={formData.paymentDate}
                    onChange={(date) => handleDateChange('paymentDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </Grid>
              )}

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
            startIcon={<CheckCircleIcon />}
          >
            {editingExpense ? 'Update' : 'Save'}
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

export default MonthlyExpenses;