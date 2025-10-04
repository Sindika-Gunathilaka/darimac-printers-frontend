import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  CircularProgress,
  Grid,
  Stack,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { 
  getAllExpenses, 
  searchExpenses,
  getExpenseTypes,
  getPaymentStatuses,
  getAllSuppliers,
  updatePaymentStatus,
  deleteExpense
} from '../../services/api';
import { format } from 'date-fns';

function ExpenseList() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [paymentStatuses, setPaymentStatuses] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    grnNumber: '',
    supplierName: '',
    expenseType: '',
    paymentStatus: '',
    startDate: null,
    endDate: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch expenses and reference data in parallel
        const [expensesData, suppliersData, typesData, statusesData] = await Promise.all([
          getAllExpenses(),
          getAllSuppliers(),
          getExpenseTypes(),
          getPaymentStatuses()
        ]);
        
        setExpenses(expensesData);
        setSearchResults(expensesData);
        setTotalExpenses(expensesData.reduce((sum, expense) => sum + parseFloat(expense.amount), 0));
        setSuppliers(suppliersData);
        setExpenseTypes(typesData);
        setPaymentStatuses(statusesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  const handleDateChange = (name, date) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: date
    }));
  };

  const clearFilters = () => {
    setFilters({
      grnNumber: '',
      supplierName: '',
      expenseType: '',
      paymentStatus: '',
      startDate: null,
      endDate: null
    });
    
    // Reset to all expenses
    setSearchResults(expenses);
    setIsSearching(false);
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setIsSearching(true);
      
      // Format dates for API call
      const searchParams = {
        ...filters,
        startDate: filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : null,
        endDate: filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : null
      };
      
      const results = await searchExpenses(searchParams);
      setSearchResults(results);
      setTotalExpenses(results.reduce((sum, expense) => sum + parseFloat(expense.amount), 0));
      setPage(0);
    } catch (error) {
      console.error('Error searching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const dataToExport = isSearching ? searchResults : expenses;
    
    // Convert data to CSV format
    const headers = ['Expense Number', 'Description', 'Supplier', 'Amount', 'GRN Number', 'Date', 'Type', 'Status'];
    const csvData = dataToExport.map(expense => [
      expense.expenseNumber,
      expense.description,
      expense.supplier?.name || 'N/A',
      expense.amount,
      expense.grnNumber || 'N/A',
      expense.expenseDate,
      expense.expenseType,
      expense.paymentStatus
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `expenses_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleViewExpense = (id) => {
    navigate(`/expenses/${id}`);
  };

  const handleEditExpense = (id) => {
    navigate(`/expenses/edit/${id}`);
  };

  const handleDeleteExpense = async (id) => {
    // Implement delete confirmation dialog
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
        
        // Update the UI after successful deletion
        setExpenses(expenses.filter(exp => exp.id !== id));
        setSearchResults(searchResults.filter(exp => exp.id !== id));
        
        // Recalculate totals
        const updatedData = isSearching ? 
          searchResults.filter(exp => exp.id !== id) : 
          expenses.filter(exp => exp.id !== id);
          
        setTotalExpenses(updatedData.reduce((sum, expense) => sum + parseFloat(expense.amount), 0));
        
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense. Please try again later.');
      }
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await updatePaymentStatus(id, 'PAID', format(new Date(), 'yyyy-MM-dd'));
      
      // Refresh the expense in the list
      const updatedExpenses = expenses.map(exp => 
        exp.id === id ? { ...exp, paymentStatus: 'PAID' } : exp
      );
      setExpenses(updatedExpenses);
      
      const updatedSearchResults = searchResults.map(exp => 
        exp.id === id ? { ...exp, paymentStatus: 'PAID' } : exp
      );
      setSearchResults(updatedSearchResults);
      
    } catch (error) {
      console.error('Error marking expense as paid:', error);
      alert('Failed to update payment status. Please try again later.');
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'PAID':
        return <Chip icon={<CheckCircleIcon />} color="success" label="Paid" />;
      case 'UNPAID':
        return <Chip icon={<ErrorIcon />} color="error" label="Unpaid" />;
      case 'PARTIALLY_PAID':
        return <Chip icon={<PendingIcon />} color="warning" label="Partially Paid" />;
      case 'OVERDUE':
        return <Chip icon={<ErrorIcon />} color="error" label="Overdue" variant="outlined" />;
      default:
        return <Chip label={status} />;
    }
  };

  const displayedExpenses = isSearching ? searchResults : expenses;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <ReceiptIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Expense Tracker
          </Typography>
        </Stack>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Box /> {/* Spacer */}
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button 
              variant="outlined" 
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            <Button 
              variant="outlined" 
              startIcon={<FileDownloadIcon />}
              onClick={exportToCSV}
            >
              Export to CSV
            </Button>
            
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => navigate('/expenses/new')}
            >
              Add Expense
            </Button>
          </Stack>
        </Stack>
      </Box>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                LKR {totalExpenses.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Expenses Count
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'info.main' }}>
                {displayedExpenses.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Unpaid Expenses
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'error.main' }}>
                {displayedExpenses.filter(e => e.paymentStatus === 'UNPAID' || e.paymentStatus === 'OVERDUE').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Filter Panel */}
      {showFilters && (
        <Card sx={{ mb: 3 }} elevation={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'medium' }}>
              Search & Filter
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="GRN Number"
                  name="grnNumber"
                  value={filters.grnNumber}
                  onChange={handleFilterChange}
                  placeholder="Search by GRN number"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <Select
                    name="supplierName"
                    value={filters.supplierName}
                    onChange={handleFilterChange}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return <span style={{ color: '#9e9e9e' }}>Supplier</span>;
                      }
                      return selected;
                    }}
                    sx={{
                      '& .MuiSelect-select': {
                        paddingTop: '16.5px',
                        paddingBottom: '16.5px',
                      }
                    }}
                  >
                    <MenuItem value="" disabled>
                      <em>All Suppliers</em>
                    </MenuItem>
                    {suppliers.map(supplier => (
                      <MenuItem key={supplier.id} value={supplier.name}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <Select
                    name="expenseType"
                    value={filters.expenseType}
                    onChange={handleFilterChange}
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
                      <em>All Types</em>
                    </MenuItem>
                    {expenseTypes.map(type => (
                      <MenuItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <Select
                    name="paymentStatus"
                    value={filters.paymentStatus}
                    onChange={handleFilterChange}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) {
                        return <span style={{ color: '#9e9e9e' }}>Payment Status</span>;
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
                      <em>All Statuses</em>
                    </MenuItem>
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
                    label="Start Date"
                    value={filters.startDate}
                    onChange={(date) => handleDateChange('startDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={filters.endDate}
                    onChange={(date) => handleDateChange('endDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button 
                variant="contained" 
                startIcon={<SearchIcon />}
                onClick={handleSearch}
              >
                Search
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
      
      {/* Expenses Table */}
      <Card elevation={2}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Expense Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>GRN Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : displayedExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No expenses found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayedExpenses
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((expense) => (
                    <TableRow key={expense.id} hover>
                      <TableCell sx={{ fontWeight: 'medium' }}>{expense.expenseNumber}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.supplier?.name || 'N/A'}</TableCell>
                      <TableCell>{expense.grnNumber || 'N/A'}</TableCell>
                      <TableCell>{expense.expenseDate}</TableCell>
                      <TableCell sx={{ fontWeight: 'medium' }}>
                        LKR {parseFloat(expense.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>{expense.expenseType?.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{getStatusChip(expense.paymentStatus)}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewExpense(expense.id)}>
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEditExpense(expense.id)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          
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
                          
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteExpense(expense.id)}
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
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={displayedExpenses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </Box>
  );
}

export default ExpenseList;