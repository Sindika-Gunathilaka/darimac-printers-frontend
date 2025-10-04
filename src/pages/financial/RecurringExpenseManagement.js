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
    Switch,
    FormControlLabel
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import RepeatIcon from '@mui/icons-material/Repeat';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
    getAllRecurringExpenses,
    getActiveRecurringExpenses,
    createRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringExpenseActive,
    getRecurringExpenseCategories,
    getExpenseFrequencies,
    getMonthlyBudget,
    autoGenerateCurrentMonth
} from '../../services/api';

function RecurringExpenseManagement() {
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [frequencies, setFrequencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [monthlyBudget, setMonthlyBudget] = useState(0);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        amount: '',
        frequency: 'MONTHLY',
        startDate: new Date(),
        endDate: null,
        isActive: true,
        autoGenerate: true,
        description: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expensesData, categoriesData, frequenciesData, budgetData] = await Promise.all([
                getAllRecurringExpenses(),
                getRecurringExpenseCategories(),
                getExpenseFrequencies(),
                getMonthlyBudget()
            ]);
            // Add these debug lines:
            console.log('Raw budget data from API:', budgetData);
            console.log('Type of budget data:', typeof budgetData);
            console.log('Budget data parsed:', parseFloat(budgetData));
            setExpenses(expensesData);
            setCategories(categoriesData);
            setFrequencies(frequenciesData);
            setMonthlyBudget(budgetData);

            // Add this to see the state after setting:
            console.log('Monthly budget state will be set to:', budgetData);
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

    const handleOpenDialog = (expense = null) => {
        if (expense) {
            setEditingExpense(expense);
            setFormData({
                name: expense.name || '',
                category: expense.category || '',
                amount: expense.amount.toString(),
                frequency: expense.frequency || 'MONTHLY',
                startDate: expense.startDate ? new Date(expense.startDate) : new Date(),
                endDate: expense.endDate ? new Date(expense.endDate) : null,
                isActive: expense.isActive,
                autoGenerate: expense.autoGenerate,
                description: expense.description || ''
            });
        } else {
            setEditingExpense(null);
            setFormData({
                name: '',
                category: '',
                amount: '',
                frequency: 'MONTHLY',
                startDate: new Date(),
                endDate: null,
                isActive: true,
                autoGenerate: true,
                description: ''
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingExpense(null);
        setFormData({
            name: '',
            category: '',
            amount: '',
            frequency: 'MONTHLY',
            startDate: new Date(),
            endDate: null,
            isActive: true,
            autoGenerate: true,
            description: ''
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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
            if (!formData.name.trim()) {
                setSnackbar({
                    open: true,
                    message: 'Name is required',
                    severity: 'error'
                });
                return;
            }

            if (!formData.category) {
                setSnackbar({
                    open: true,
                    message: 'Category is required',
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

            const expenseData = {
                name: formData.name,
                category: formData.category,
                amount: parseFloat(formData.amount),
                frequency: formData.frequency,
                startDate: formData.startDate.toISOString().split('T')[0],
                endDate: formData.endDate ? formData.endDate.toISOString().split('T')[0] : null,
                isActive: formData.isActive,
                autoGenerate: formData.autoGenerate,
                description: formData.description
            };

            if (editingExpense) {
                await updateRecurringExpense(editingExpense.id, expenseData);
                setSnackbar({
                    open: true,
                    message: 'Recurring expense updated successfully',
                    severity: 'success'
                });
            } else {
                await createRecurringExpense(expenseData);
                setSnackbar({
                    open: true,
                    message: 'Recurring expense created successfully',
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
        if (window.confirm('Are you sure you want to delete this recurring expense?')) {
            try {
                await deleteRecurringExpense(id);
                setSnackbar({
                    open: true,
                    message: 'Recurring expense deleted successfully',
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

    const handleToggleActive = async (id) => {
        try {
            await toggleRecurringExpenseActive(id);
            setSnackbar({
                open: true,
                message: 'Expense status updated successfully',
                severity: 'success'
            });
            fetchData();
        } catch (error) {
            console.error('Error toggling expense status:', error);
            setSnackbar({
                open: true,
                message: 'Failed to update expense status',
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

    // Calculate summary data
    const activeExpenses = expenses.filter(e => e.isActive);
    const totalActiveAmount = activeExpenses
        .filter(e => e.frequency === 'MONTHLY')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                    <RepeatIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h4" component="h1">
                        Recurring Expenses Management
                    </Typography>
                </Stack>
                <Typography variant="body1" color="text.secondary">
                    Manage your monthly, quarterly, and yearly recurring expenses
                </Typography>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card elevation={2}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Active Recurring Expenses
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                                {activeExpenses.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card elevation={2}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Monthly Budget
                            </Typography>
                            {/* <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                                LKR {totalActiveAmount.toFixed(2)}
                            </Typography> */}
                            <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                                LKR {parseFloat(monthlyBudget || 0).toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card elevation={2}>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Total Recurring Expenses
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 'medium', color: 'info.main' }}>
                                {expenses.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Actions */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 3 }}>
                <Typography variant="h6">
                    Recurring Expense Templates
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<CalendarTodayIcon />}
                        onClick={handleAutoGenerate}
                    >
                        Generate This Month
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        Add Recurring Expense
                    </Button>
                </Stack>
            </Stack>

            {/* Expenses Table */}
            <Paper elevation={2}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ backgroundColor: 'grey.50' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Frequency</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Next Due</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Auto Generate</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {expenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            No recurring expenses configured yet.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                expenses.map((expense) => (
                                    <TableRow key={expense.id} hover>
                                        <TableCell sx={{ fontWeight: 'medium' }}>
                                            {expense.name}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={expense.category.replace(/_/g, ' ')}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'medium' }}>
                                            LKR {parseFloat(expense.amount).toFixed(2)}
                                        </TableCell>
                                        <TableCell>{expense.frequency.replace(/_/g, ' ')}</TableCell>
                                        <TableCell>
                                            {expense.nextDueDate ? new Date(expense.nextDueDate).toLocaleDateString() : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={expense.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                                                label={expense.isActive ? 'Active' : 'Inactive'}
                                                color={expense.isActive ? 'success' : 'default'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={expense.autoGenerate ? 'Yes' : 'No'}
                                                color={expense.autoGenerate ? 'primary' : 'default'}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={() => handleOpenDialog(expense)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title={expense.isActive ? 'Deactivate' : 'Activate'}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleToggleActive(expense.id)}
                                                        color={expense.isActive ? 'warning' : 'success'}
                                                    >
                                                        {expense.isActive ? <CancelIcon /> : <CheckCircleIcon />}
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
                    {editingExpense ? 'Edit Recurring Expense' : 'Add New Recurring Expense'}
                </DialogTitle>
                <DialogContent>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Expense Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Office Rent"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <Select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        displayEmpty
                                        renderValue={(selected) => {
                                            if (!selected) {
                                                return <span style={{ color: '#9e9e9e' }}>Select Category</span>;
                                            }
                                            return selected.replace(/_/g, ' ');
                                        }}
                                    >
                                        <MenuItem value="" disabled>
                                            <em>Select category</em>
                                        </MenuItem>
                                        {categories.map((category) => (
                                            <MenuItem key={category} value={category}>
                                                {category.replace(/_/g, ' ')}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
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
                                <FormControl fullWidth>
                                    <Select
                                        name="frequency"
                                        value={formData.frequency}
                                        onChange={handleChange}
                                        displayEmpty
                                    >
                                        {frequencies.map((frequency) => (
                                            <MenuItem key={frequency} value={frequency}>
                                                {frequency.replace(/_/g, ' ')}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <DatePicker
                                    label="Start Date"
                                    value={formData.startDate}
                                    onChange={(date) => handleDateChange('startDate', date)}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <DatePicker
                                    label="End Date (Optional)"
                                    value={formData.endDate}
                                    onChange={(date) => handleDateChange('endDate', date)}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
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

                            <Grid item xs={12} md={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isActive}
                                            onChange={handleChange}
                                            name="isActive"
                                        />
                                    }
                                    label="Active"
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.autoGenerate}
                                            onChange={handleChange}
                                            name="autoGenerate"
                                        />
                                    }
                                    label="Auto Generate Monthly Entries"
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

export default RecurringExpenseManagement;