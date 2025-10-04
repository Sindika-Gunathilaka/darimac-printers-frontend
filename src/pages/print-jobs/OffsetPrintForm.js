import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Divider,
  InputAdornment,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  getCustomers,
  getOffsetPrintById,
  createOffsetPrint,
  updateOffsetPrint,
  getSuppliers
} from '../../services/api';

function OffsetPrintForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [errors, setErrors] = useState({});
  
  // Multiple expenses
  const [expenses, setExpenses] = useState([]);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0 });
  const [editingExpenseIndex, setEditingExpenseIndex] = useState(-1);
  
  const [formData, setFormData] = useState({
    jobName: '',
    jobDescription: '',
    customerId: '',
    supplierId: '',
    jobType: '',
    quantity: '',
    supplierJobAmount: '',
    profitPercentage: '25', // Default profit percentage
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all required data in parallel
        const [customersData, suppliersData] = await Promise.all([
          getCustomers(),
          getSuppliers()
        ]);

        console.log('Customers data fetched:', customersData); // Add this for debugging
        console.log('Suppliers data fetched:', suppliersData); 
        
        setCustomers(Array.isArray(customersData) ? customersData : []);
        setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
        
        // If editing, fetch the print job
        if (id) {
          const printJob = await getOffsetPrintById(id);
          
          setFormData({
            jobName: printJob.jobName || '',
            jobDescription: printJob.jobDescription || '',
            customerId: printJob.customer?.id || '',
            supplierId: printJob.supplier?.id || '',
            jobType: printJob.jobType || '',
            quantity: String(printJob.quantity || ''),
            supplierJobAmount: String(printJob.supplierJobAmount || ''),
            profitPercentage: String(printJob.profitPercentage || 25),
          });
          
          // Handle expenses if they exist
          if (printJob.expenses && Array.isArray(printJob.expenses)) {
            setExpenses(printJob.expenses);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.jobName.trim()) {
      newErrors.jobName = 'Job name is required';
    }
    
    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }
    
    if (!formData.supplierId) {
      newErrors.supplierId = 'Supplier is required';
    }
    
    if (!formData.jobType.trim()) {
      newErrors.jobType = 'Job type is required';
    }
    
    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else if (parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    if (!formData.supplierJobAmount.trim()) {
      newErrors.supplierJobAmount = 'Supplier job amount is required';
    } else if (parseFloat(formData.supplierJobAmount) <= 0) {
      newErrors.supplierJobAmount = 'Supplier job amount must be greater than 0';
    }
    
    if (!formData.profitPercentage.trim()) {
      newErrors.profitPercentage = 'Profit percentage is required';
    } else if (parseInt(formData.profitPercentage) < 0) {
      newErrors.profitPercentage = 'Profit percentage cannot be negative';
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
  
  // Expense management
  const openAddExpenseDialog = () => {
    setNewExpense({ description: '', amount: 0 });
    setEditingExpenseIndex(-1);
    setExpenseDialogOpen(true);
  };
  
  const openEditExpenseDialog = (index) => {
    setNewExpense({ ...expenses[index] });
    setEditingExpenseIndex(index);
    setExpenseDialogOpen(true);
  };
  
  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value
    }));
  };
  
  const handleSaveExpense = () => {
    if (editingExpenseIndex >= 0) {
      // Edit existing expense
      const updatedExpenses = [...expenses];
      updatedExpenses[editingExpenseIndex] = newExpense;
      setExpenses(updatedExpenses);
    } else {
      // Add new expense
      setExpenses([...expenses, newExpense]);
    }
    setExpenseDialogOpen(false);
  };
  
  const handleDeleteExpense = (index) => {
    const updatedExpenses = expenses.filter((_, i) => i !== index);
    setExpenses(updatedExpenses);
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
        jobNumber: formData.jobNumber,
        jobDescription: formData.jobDescription,
        printType: 'OFFSET',
        customer: { id: parseInt(formData.customerId) },
        supplier: { id: parseInt(formData.supplierId) },
        jobType: formData.jobType,
        quantity: parseInt(formData.quantity),
        supplierJobAmount: parseFloat(formData.supplierJobAmount),
        profitPercentage: parseInt(formData.profitPercentage),
        totalAmount: estimates.total,
        expenses: expenses.map(expense => ({
          description: expense.description,
          amount: parseFloat(expense.amount)
        }))
      };
      
      if (id) {
        await updateOffsetPrint(id, printJobData);
      } else {
        await createOffsetPrint(printJobData);
      }
      
      navigate('/print-jobs');
    } catch (error) {
      console.error('Error saving offset print:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Calculate estimated cost and profit
  const calculateEstimates = () => {
    const supplierJobAmount = parseFloat(formData.supplierJobAmount) || 0;
    const profitPercentage = parseInt(formData.profitPercentage) || 0;
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + (parseFloat(expense.amount) || 0), 
      0
    );
    
    const totalCost = supplierJobAmount + totalExpenses;
    const profitMultiplier = profitPercentage / 100;
    const profit = totalCost * profitMultiplier;
    const totalAmount = totalCost + profit;
    
    return {
      cost: totalCost,
      profit: profit,
      total: totalAmount
    };
  };

  // Calculate total expenses
  const calculateTotalExpenses = () => {
    return expenses.reduce(
      (sum, expense) => sum + (parseFloat(expense.amount) || 0), 
      0
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const estimates = calculateEstimates();

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        {id ? 'Edit Offset Print' : 'New Offset Print'}
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Basic Job Information */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Job Name"
                name="jobName"
                value={formData.jobName}
                onChange={handleChange}
                error={!!errors.jobName}
                helperText={errors.jobName}
                required
              />

              <TextField
                fullWidth
                label="Job Number"
                name="jobNumber"
                value={formData.jobNumber}
                onChange={handleChange}
                error={!!errors.jobNumber}
                helperText={errors.jobNumber}
                required
              />
              
              <TextField
                fullWidth
                select
                label="Customer"
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                error={!!errors.customerId}
                helperText={errors.customerId || " "}
                required
              >
                <MenuItem value="">
                  <em>Select a customer</em>
                </MenuItem>
                {Array.isArray(customers) && customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            
            <TextField
              fullWidth
              label="Job Description"
              name="jobDescription"
              multiline
              rows={3}
              value={formData.jobDescription}
              onChange={handleChange}
            />
            
            <Divider />
            <Typography variant="h6">Offset Print Details</Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                select
                label="Supplier"
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                error={!!errors.supplierId}
                helperText={errors.supplierId || " "}
                required
              >
                <MenuItem value="">
                  <em>Select a supplier</em>
                </MenuItem>
                {Array.isArray(suppliers) && suppliers.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                fullWidth
                label="Job Type"
                name="jobType"
                value={formData.jobType}
                onChange={handleChange}
                error={!!errors.jobType}
                helperText={errors.jobType}
                required
                placeholder="e.g. Flyer, Brochure, Business Card"
              />
            </Stack>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange}
                error={!!errors.quantity}
                helperText={errors.quantity}
                required
              />
              
              <TextField
                fullWidth
                label="Supplier Job Amount"
                name="supplierJobAmount"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                }}
                value={formData.supplierJobAmount}
                onChange={handleChange}
                error={!!errors.supplierJobAmount}
                helperText={errors.supplierJobAmount}
                required
              />
            </Stack>
            
            <Divider />
            <Typography variant="h6">Pricing</Typography>
            
            {/* Multiple Expenses Section */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1">
                  Other Expenses (Total: LKR {calculateTotalExpenses().toFixed(2)})
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />} 
                  onClick={openAddExpenseDialog}
                  size="small"
                >
                  Add Expense
                </Button>
              </Stack>
              
              {expenses.length > 0 ? (
                <List sx={{ bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
                  {expenses.map((expense, index) => (
                    <ListItem 
                      key={index}
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                          <IconButton edge="end" onClick={() => openEditExpenseDialog(index)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton edge="end" onClick={() => handleDeleteExpense(index)}>
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      }
                      sx={{ 
                        borderBottom: index < expenses.length - 1 ? '1px solid #eee' : 'none'
                      }}
                    >
                      <ListItemText
                        primary={expense.description || 'No description'}
                        secondary={`LKR ${parseFloat(expense.amount).toFixed(2)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" align="center">
                      No expenses added yet
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Profit Percentage"
                name="profitPercentage"
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                value={formData.profitPercentage}
                onChange={handleChange}
                error={!!errors.profitPercentage}
                helperText={errors.profitPercentage}
                required
              />
              
              <TextField
                fullWidth
                label="Estimated Cost"
                InputProps={{
                  startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                  readOnly: true,
                }}
                value={estimates.cost.toFixed(2)}
                disabled
              />
            </Stack>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Estimated Profit"
                InputProps={{
                  startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                  readOnly: true,
                }}
                value={estimates.profit.toFixed(2)}
                disabled
              />
              
              <TextField
                fullWidth
                label="Estimated Total"
                InputProps={{
                  startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                  readOnly: true,
                }}
                value={estimates.total.toFixed(2)}
                disabled
              />
            </Stack>
            
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/print-jobs')}
                size="large"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                size="large"
              >
                {submitting ? (
                  <CircularProgress size={24} />
                ) : id ? (
                  'Update Offset Print'
                ) : (
                  'Create Offset Print'
                )}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
      
      {/* Add/Edit Expense Dialog */}
      <Dialog open={expenseDialogOpen} onClose={() => setExpenseDialogOpen(false)}>
        <DialogTitle>
          {editingExpenseIndex >= 0 ? 'Edit Expense' : 'Add Expense'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1, minWidth: 300 }}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={newExpense.description}
              onChange={handleExpenseChange}
              required
            />
            <TextField
              fullWidth
              label="Amount"
              name="amount"
              type="number"
              value={newExpense.amount}
              onChange={handleExpenseChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
              }}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpenseDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveExpense} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default OffsetPrintForm;