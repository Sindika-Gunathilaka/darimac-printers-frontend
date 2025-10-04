import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
    Snackbar,
    Chip
} from '@mui/material';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import {
    getCustomers,
    getSublimationPrintById,
    createSublimationPrint,
    updateSublimationPrint,
    getSublimationTypes,
    getCurrentSublimationPrice,
    getSublimationPrices
} from '../../services/api';

function SublimationPrintForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [sublimationTypes, setSublimationTypes] = useState([]);
    const [currentPrices, setCurrentPrices] = useState({});
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
        sublimationType: '',
        quantity: '1',
        unitPrice: '',
        profitPercentage: '20',
        otherExpenses: '0',
        otherExpensesDescription: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch all required data in parallel
                const [customersData, typesData, pricesData] = await Promise.all([
                    getCustomers(),
                    getSublimationTypes(),
                    getSublimationPrices()
                ]);

                setCustomers(customersData);
                setSublimationTypes(typesData);

                // Create price map for easy lookup
                const priceMap = {};
                pricesData.forEach(price => {
                    if (price.isActive) {
                        priceMap[price.sublimationType] = price.unitPrice;
                    }
                });
                setCurrentPrices(priceMap);

                // If editing, fetch the print job
                if (isEditMode) {
                    try {
                        const printJob = await getSublimationPrintById(id);

                        setFormData({
                            jobName: printJob.jobName || '',
                            jobDescription: printJob.jobDescription || '',
                            customerId: printJob.customer?.id || '',
                            sublimationType: printJob.sublimationType || '',
                            quantity: String(printJob.quantity || '1'),
                            unitPrice: String(printJob.unitPrice || ''),
                            profitPercentage: String(printJob.profitPercentage || '20'),
                            otherExpenses: String(printJob.otherExpenses || '0'),
                            otherExpensesDescription: printJob.otherExpensesDescription || ''
                        });
                    } catch (error) {
                        console.error('Error fetching sublimation print:', error);
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

        if (!formData.sublimationType) {
            newErrors.sublimationType = 'Sublimation type is required';
        }

        if (!formData.quantity || formData.quantity.toString().trim() === '') {
            newErrors.quantity = 'Quantity is required';
        } else if (isNaN(formData.quantity) || parseInt(formData.quantity) <= 0) {
            newErrors.quantity = 'Quantity must be greater than 0';
        }

        if (!formData.unitPrice || formData.unitPrice.toString().trim() === '') {
            newErrors.unitPrice = 'Unit price is required';
        } else if (isNaN(formData.unitPrice) || parseFloat(formData.unitPrice) <= 0) {
            newErrors.unitPrice = 'Unit price must be greater than 0';
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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSublimationTypeChange = (e) => {
        const selectedType = e.target.value;
        setFormData(prev => ({
            ...prev,
            sublimationType: selectedType,
            unitPrice: currentPrices[selectedType] || ''
        }));
    };

    const handleRefreshPrice = async () => {
        if (formData.sublimationType) {
            try {
                const price = await getCurrentSublimationPrice(formData.sublimationType);
                setFormData(prev => ({
                    ...prev,
                    unitPrice: String(price)
                }));
                setSnackbar({
                    open: true,
                    message: 'Price updated from master data',
                    severity: 'success'
                });
            } catch (error) {
                setSnackbar({
                    open: true,
                    message: 'Failed to refresh price',
                    severity: 'error'
                });
            }
        }
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
                sublimationType: formData.sublimationType,
                quantity: parseInt(formData.quantity),
                unitPrice: parseFloat(formData.unitPrice),
                profitPercentage: parseInt(formData.profitPercentage),
                otherExpenses: parseFloat(formData.otherExpenses) || 0,
                otherExpensesDescription: formData.otherExpensesDescription,
                printType: 'SUBLIMATION'
            };

            if (isEditMode) {
                await updateSublimationPrint(id, printJobData);
                setSnackbar({
                    open: true,
                    message: 'Sublimation print updated successfully',
                    severity: 'success'
                });
            } else {
                await createSublimationPrint(printJobData);
                setSnackbar({
                    open: true,
                    message: 'Sublimation print created successfully',
                    severity: 'success'
                });
            }

            // Navigate after a short delay to allow user to see the success message
            setTimeout(() => {
                navigate('/print-jobs');
            }, 1500);

        } catch (error) {
            console.error('Error saving sublimation print:', error);
            setSnackbar({
                open: true,
                message: 'Failed to save sublimation print. Please try again later.',
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

    // Calculate totals
    const calculateTotals = () => {
        const quantity = parseInt(formData.quantity) || 0;
        const unitPrice = parseFloat(formData.unitPrice) || 0;
        const otherExpenses = parseFloat(formData.otherExpenses) || 0;
        const profitPercentage = parseInt(formData.profitPercentage) || 0;

        const baseCost = quantity * unitPrice;
        const subtotal = baseCost + otherExpenses;
        const profit = subtotal * (profitPercentage / 100);
        const total = subtotal + profit;

        return {
            baseCost,
            subtotal,
            profit,
            total
        };
    };

    const totals = calculateTotals();

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
                    <ColorLensIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h4" component="h1">
                        {isEditMode ? 'Edit Sublimation Print' : 'New Sublimation Print'}
                    </Typography>
                </Stack>
                <Typography variant="body1" color="text.secondary">
                    {isEditMode ? 'Update sublimation print job details below' : 'Fill in the details to create a new sublimation print job'}
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
                                    placeholder="Describe the sublimation print job requirements..."
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Sublimation Details Card */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                                Sublimation Details
                            </Typography>
                            <Button
                                size="small"
                                variant="outlined"
                                component={Link}
                                to="/sublimation-prices"
                                startIcon={<PriceChangeIcon />}
                            >
                                Manage Prices
                            </Button>
                        </Stack>
                    

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required error={!!errors.sublimationType}>
                                    <Select
                                        name="sublimationType"
                                        value={formData.sublimationType}
                                        onChange={handleSublimationTypeChange}
                                        displayEmpty
                                        renderValue={(selected) => {
                                            if (!selected) {
                                                return <span style={{ color: '#9e9e9e' }}>Sublimation Type</span>;
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
                                            <em>Select sublimation type</em>
                                        </MenuItem>
                                        {sublimationTypes.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                                                    <span>{type.replace(/_/g, ' ')}</span>
                                                    {currentPrices[type] && (
                                                        <Chip
                                                            label={`LKR ${currentPrices[type]}`}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </Stack>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {errors.sublimationType && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                            {errors.sublimationType}
                                        </Typography>
                                    )}
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
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
                        </Grid>
                    </CardContent>
                </Card>

                {/* Pricing Card */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                            Pricing Information
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Unit Price"
                                    name="unitPrice"
                                    type="number"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                                        endAdornment: formData.sublimationType && (
                                            <InputAdornment position="end">
                                                <Button
                                                    size="small"
                                                    startIcon={<RefreshIcon />}
                                                    onClick={handleRefreshPrice}
                                                    sx={{ minWidth: 'auto', px: 1 }}
                                                >
                                                    Refresh
                                                </Button>
                                            </InputAdornment>
                                        )
                                    }}
                                    value={formData.unitPrice}
                                    onChange={handleChange}
                                    error={!!errors.unitPrice}
                                    helperText={errors.unitPrice || (formData.sublimationType && currentPrices[formData.sublimationType] ? `Current master price: LKR ${currentPrices[formData.sublimationType]}` : '')}
                                    placeholder="0.00"
                                />
                            </Grid>

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

                            <Grid item xs={12} md={6}>
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

                {/* Cost Breakdown Card */}
                <Card sx={{ mb: 4 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                            Cost Breakdown
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={3}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Base Cost
                                    </Typography>
                                    <Typography variant="h6" color="info.main">
                                        LKR {totals.baseCost.toFixed(2)}
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Subtotal
                                    </Typography>
                                    <Typography variant="h6" color="warning.main">
                                        LKR {totals.subtotal.toFixed(2)}
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Profit ({formData.profitPercentage}%)
                                    </Typography>
                                    <Typography variant="h6" color="success.main">
                                        LKR {totals.profit.toFixed(2)}
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid item xs={12} md={3}>
                                <Box sx={{
                                    textAlign: 'center',
                                    p: 2,
                                    backgroundColor: 'primary.light',
                                    borderRadius: 1
                                }}>
                                    <Typography variant="subtitle2" color="white">
                                        Total Amount
                                    </Typography>
                                    <Typography variant="h5" color="white" sx={{ fontWeight: 'bold' }}>
                                        LKR {totals.total.toFixed(2)}
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
                            {submitting ? 'Saving...' : isEditMode ? 'Update Sublimation Print' : 'Create Sublimation Print'}
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

export default SublimationPrintForm;