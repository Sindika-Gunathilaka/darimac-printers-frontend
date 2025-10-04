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
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import {
  getAllSublimationPrices,
  getSublimationTypes,
  createSublimationPrice,
  updateSublimationPrice,
  deleteSublimationPrice,
  activateSublimationPrice,
  deactivateSublimationPrice
} from '../../services/api';

function SublimationPriceManagement() {
  const [prices, setPrices] = useState([]);
  const [sublimationTypes, setSublimationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [formData, setFormData] = useState({
    sublimationType: '',
    unitPrice: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pricesData, typesData] = await Promise.all([
        getAllSublimationPrices(),
        getSublimationTypes()
      ]);
      setPrices(pricesData);
      setSublimationTypes(typesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load price data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (price = null) => {
    if (price) {
      setEditingPrice(price);
      setFormData({
        sublimationType: price.sublimationType,
        unitPrice: price.unitPrice.toString(),
        description: price.description || '',
        isActive: price.isActive
      });
    } else {
      setEditingPrice(null);
      setFormData({
        sublimationType: '',
        unitPrice: '',
        description: '',
        isActive: true
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPrice(null);
    setFormData({
      sublimationType: '',
      unitPrice: '',
      description: '',
      isActive: true
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const priceData = {
        sublimationType: formData.sublimationType,
        unitPrice: parseFloat(formData.unitPrice),
        description: formData.description,
        isActive: formData.isActive
      };

      if (editingPrice) {
        await updateSublimationPrice(editingPrice.id, priceData);
        setSnackbar({
          open: true,
          message: 'Price updated successfully',
          severity: 'success'
        });
      } else {
        await createSublimationPrice(priceData);
        setSnackbar({
          open: true,
          message: 'Price created successfully',
          severity: 'success'
        });
      }

      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving price:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save price',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this price?')) {
      try {
        await deleteSublimationPrice(id);
        setSnackbar({
          open: true,
          message: 'Price deleted successfully',
          severity: 'success'
        });
        fetchData();
      } catch (error) {
        console.error('Error deleting price:', error);
        setSnackbar({
          open: true,
          message: 'Failed to delete price',
          severity: 'error'
        });
      }
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      if (isActive) {
        await deactivateSublimationPrice(id);
      } else {
        await activateSublimationPrice(id);
      }
      setSnackbar({
        open: true,
        message: `Price ${isActive ? 'deactivated' : 'activated'} successfully`,
        severity: 'success'
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling price status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update price status',
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

  // Group prices by type for summary
  const pricesByType = prices.reduce((acc, price) => {
    if (!acc[price.sublimationType]) {
      acc[price.sublimationType] = [];
    }
    acc[price.sublimationType].push(price);
    return acc;
  }, {});

  const activePrices = prices.filter(p => p.isActive);

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
          <PriceChangeIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Sublimation Price Management
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Manage pricing for different sublimation types
        </Typography>
      </Box>

      {/* Current Active Prices Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'medium' }}>
            Current Active Prices
          </Typography>
          <Grid container spacing={2}>
            {sublimationTypes.map(type => {
              const activePrice = activePrices.find(p => p.sublimationType === type);
              return (
                <Grid item xs={12} sm={6} md={4} lg={2.4} key={type}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center', 
                      backgroundColor: activePrice ? 'success.light' : 'grey.100',
                      color: activePrice ? 'white' : 'text.secondary',
                      borderRadius: 1,
                      minHeight: 80,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                      {type.replace(/_/g, ' ')}
                    </Typography>
                    <Typography variant="h6">
                      {activePrice ? `LKR ${activePrice.unitPrice}` : 'No Price Set'}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Actions */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6">
          Price History & Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Price
        </Button>
      </Stack>

      {/* Prices Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Sublimation Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Unit Price</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Created Date</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No prices configured yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                prices.map((price) => (
                  <TableRow key={price.id} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {price.sublimationType.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      LKR {price.unitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell>{price.description || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        icon={price.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                        label={price.isActive ? 'Active' : 'Inactive'}
                        color={price.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(price.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenDialog(price)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={price.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleToggleActive(price.id, price.isActive)}
                            color={price.isActive ? 'warning' : 'success'}
                          >
                            {price.isActive ? <CancelIcon /> : <CheckCircleIcon />}
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDelete(price.id)}
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

      {/* Add/Edit Price Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPrice ? 'Edit Price' : 'Add New Price'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <Select
                name="sublimationType"
                value={formData.sublimationType}
                onChange={handleChange}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return <span style={{ color: '#9e9e9e' }}>Select Sublimation Type</span>;
                  }
                  return selected.replace(/_/g, ' ');
                }}
              >
                <MenuItem value="" disabled>
                  <em>Select sublimation type</em>
                </MenuItem>
                {sublimationTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Unit Price"
              name="unitPrice"
              type="number"
              value={formData.unitPrice}
              onChange={handleChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
              }}
              required
            />

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={2}
              placeholder="Optional description for this price..."
            />

            <FormControl fullWidth>
              <Select
                name="isActive"
                value={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value }))}
              >
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!formData.sublimationType || !formData.unitPrice}
          >
            {editingPrice ? 'Update' : 'Save'}
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

export default SublimationPriceManagement;