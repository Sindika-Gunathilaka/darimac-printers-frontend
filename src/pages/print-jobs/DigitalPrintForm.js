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
  getDigitalPrintById,
  createDigitalPrint,
  updateDigitalPrint,
  getMaterials,
  getQualities
} from '../../services/api';

function DigitalPrintForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [errors, setErrors] = useState({});
  
  // Map IDs to enum values
  const materialIdToEnum = {
    1: "FLEX",
    2: "MATTE_STICKER",
    3: "GLOSS_STICKER",
    4: "FABRIC",
    5: "LUMINOUS",
    6: "BACKLIT",
    7: "OTHER"
  };
  
  // Updated to match backend enum values
  const qualityIdToEnum = {
    1: "PASS_4",
    2: "PASS_6",
    3: "PASS_8"
  };
  
  // Material and quality cost mapping (updated with correct quality enum values)
  const materialQualityCostMap = {
    "FLEX": {
      "PASS_4": 100,
      "PASS_6": 140,
      "PASS_8": 280
    },
    "MATTE_STICKER": {
      "PASS_4": 150,
      "PASS_6": 200,
      "PASS_8": 280
    },
    "GLOSS_STICKER": {
      "PASS_4": 150,
      "PASS_6": 200,
      "PASS_8": 280
    },
    "FABRIC": {
      "PASS_4": 100,
      "PASS_6": 140,
      "PASS_8": 450
    },
    "LUMINOUS": {
      "PASS_4": 100,
      "PASS_6": 140,
      "PASS_8": 350
    },
    "BACKLIT": {
      "PASS_4": 100,
      "PASS_6": 140,
      "PASS_8": 350
    },
    "OTHER": {
      "PASS_4": 100,
      "PASS_6": 140,
      "PASS_8": 280
    }
  };
  
  // Format display names for enums
  const formatEnumDisplay = (enumValue) => {
    if (!enumValue) return '';
    // Make sure enumValue is a string
    const strValue = String(enumValue);
    return strValue.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };
  
  // Multiple expenses
  const [expenses, setExpenses] = useState([]);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0 });
  const [editingExpenseIndex, setEditingExpenseIndex] = useState(-1);
  
  const [formData, setFormData] = useState({
    jobName: '',
    jobDescription: '',
    jobNumber: '',
    customerId: '',
    material: '',
    quality: '',
    costPerSqFt: '',
    squareFeet: '',
    totalMaterialCost: '',
    totalAmount: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all required data in parallel
        const [customersData, materialsData, qualitiesData] = await Promise.all([
          getCustomers(),
          getMaterials(),
          getQualities()
        ]);
        
        setCustomers(Array.isArray(customersData) ? customersData : []);
        
        // If materials and qualities are now enum strings, convert them to objects to maintain dropdown compatibility
        if (Array.isArray(materialsData) && materialsData.length > 0 && typeof materialsData[0] === 'string') {
          const materialObjects = materialsData.map((material, index) => ({
            id: index + 1,
            name: formatEnumDisplay(material)
          }));
          setMaterials(materialObjects);
        } else {
          setMaterials(Array.isArray(materialsData) ? materialsData : []);
        }
        
        if (Array.isArray(qualitiesData) && qualitiesData.length > 0 && typeof qualitiesData[0] === 'string') {
          const qualityObjects = qualitiesData.map((quality, index) => ({
            id: index + 1,
            name: formatEnumDisplay(quality)
          }));
          setQualities(qualityObjects);
        } else {
          setQualities(Array.isArray(qualitiesData) ? qualitiesData : []);
        }
        
        // If editing, fetch the print job
        if (id) {
          const printJob = await getDigitalPrintById(id);
          
          let materialId = '';
          if (typeof printJob.material === 'string') {
            // If material is an enum string, find the corresponding ID
            const materialObj = Object.entries(materialIdToEnum).find(([id, value]) => value === printJob.material);
            if (materialObj) {
              materialId = materialObj[0];
            }
          } else if (printJob.material?.id) {
            materialId = printJob.material.id;
          }
          
          let qualityId = '';
          if (typeof printJob.quality === 'string') {
            // If quality is an enum string, find the corresponding ID
            const qualityObj = Object.entries(qualityIdToEnum).find(([id, value]) => value === printJob.quality);
            if (qualityObj) {
              qualityId = qualityObj[0];
            }
          } else if (printJob.quality?.id) {
            qualityId = printJob.quality.id;
          }
          
          const newFormData = {
            jobName: printJob.jobName || '',
            jobDescription: printJob.jobDescription || '',
            jobNumber: printJob.jobNumber || '',
            customerId: printJob.customer?.id || '',
            material: materialId,
            quality: qualityId,
            squareFeet: String(printJob.squareFeet || ''),
            totalAmount: String(printJob.totalAmount || ''),
            costPerSqFt: String(printJob.costPerSqFt || ''),
            totalMaterialCost: String(printJob.totalMaterialCost || '')
          };
          
          setFormData(newFormData);
          
          // Update cost per sq ft and total material cost based on selected material and quality
          updateMaterialCosts(materialId, qualityId, newFormData.squareFeet);
          
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

  // Calculate and update material costs
  const updateMaterialCosts = (materialId, qualityId, squareFeet) => {
    const materialEnum = materialIdToEnum[materialId];
    const qualityEnum = qualityIdToEnum[qualityId];
    
    if (materialEnum && qualityEnum) {
      // Get cost per square foot
      const costPerSqFt = materialQualityCostMap[materialEnum][qualityEnum] || 0;
      
      // Calculate total material cost
      const sqFtValue = parseFloat(squareFeet) || 0;
      const totalMaterialCost = costPerSqFt * sqFtValue;
      
      setFormData(prevData => ({
        ...prevData,
        costPerSqFt: String(costPerSqFt),
        totalMaterialCost: String(totalMaterialCost)
      }));
    }
  };

  // Effect to update cost calculations when material, quality, or square feet changes
  useEffect(() => {
    const { material, quality, squareFeet } = formData;
    if (material && quality) {
      updateMaterialCosts(material, quality, squareFeet);
    }
  }, [formData.material, formData.quality, formData.squareFeet]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.jobName.trim()) {
      newErrors.jobName = 'Job name is required';
    }
    
    if (!formData.jobNumber.trim()) {
      newErrors.jobNumber = 'Job number is required';
    }
    
    if (!formData.customerId) {
      newErrors.customerId = 'Customer is required';
    }
    
    if (!formData.material) {
      newErrors.material = 'Material is required';
    }
    
    if (!formData.quality) {
      newErrors.quality = 'Quality is required';
    }
    
    if (!formData.squareFeet.trim()) {
      newErrors.squareFeet = 'Square feet is required';
    } else if (parseFloat(formData.squareFeet) <= 0) {
      newErrors.squareFeet = 'Square feet must be greater than 0';
    }
    
    if (!formData.costPerSqFt.trim()) {
      newErrors.costPerSqFt = 'Cost per square foot is required';
    } else if (parseFloat(formData.costPerSqFt) < 0) {
      newErrors.costPerSqFt = 'Cost per square foot cannot be negative';
    }
    
    if (!formData.totalAmount.trim()) {
      newErrors.totalAmount = 'Total amount is required';
    } else if (parseFloat(formData.totalAmount) < 0) {
      newErrors.totalAmount = 'Total amount cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
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

  // Add material expense automatically
  const addMaterialExpenseAutomatically = () => {
    // Check if we already have a material expense
    const existingMaterialExpense = expenses.findIndex(e => e.description === "Print Material Cost");
    
    if (existingMaterialExpense !== -1) {
      // Update existing material expense
      const updatedExpenses = [...expenses];
      updatedExpenses[existingMaterialExpense] = {
        description: "Print Material Cost",
        amount: parseFloat(formData.totalMaterialCost) || 0
      };
      setExpenses(updatedExpenses);
    } else {
      // Add new material expense
      setExpenses([
        ...expenses,
        {
          description: "Print Material Cost",
          amount: parseFloat(formData.totalMaterialCost) || 0
        }
      ]);
    }
  };

  // Calculate total expense amount (sum of expenses)
  const calculateExpensesTotal = () => {
    return expenses.reduce(
      (sum, expense) => sum + (parseFloat(expense.amount) || 0), 
      0
    );
  };
  
  // Calculate total amount (expenses + material cost)
  const calculateTotalAmount = () => {
    const expensesTotal = calculateExpensesTotal();
    const materialCost = parseFloat(formData.totalMaterialCost) || 0;
    return expensesTotal + materialCost;
  };

  // Effect to update total amount suggestion when expenses change or material cost changes
  useEffect(() => {
    const grandTotal = calculateTotalAmount();
    if (grandTotal > 0 && !formData.totalAmount) {
      setFormData(prevData => ({
        ...prevData,
        totalAmount: String(grandTotal)
      }));
    }
  }, [expenses, formData.totalMaterialCost]);

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
        customer: { id: parseInt(formData.customerId) },
        material: materialIdToEnum[formData.material],
        quality: qualityIdToEnum[formData.quality],
        squareFeet: parseFloat(formData.squareFeet),
        totalAmount: parseFloat(formData.totalAmount),
        expensesCost: calculateTotalAmount(),
        expenses: expenses.map(expense => ({
          ...expense,
          amount: parseFloat(expense.amount)
        }))
      };
      
      if (id) {
        await updateDigitalPrint(id, printJobData);
      } else {
        await createDigitalPrint(printJobData);
      }
      
      navigate('/print-jobs');
    } catch (error) {
      console.error('Error saving digital print:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        {id ? 'Edit Digital Print' : 'New Digital Print'}
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
            <Typography variant="h6">Print Details</Typography>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {/* Material Selection */}
              <TextField
                fullWidth
                select
                label="Material"
                name="material"
                value={formData.material}
                onChange={handleChange}
                error={!!errors.material}
                helperText={errors.material || " "}
                required
              >
                <MenuItem value="">
                  <em>Select a material</em>
                </MenuItem>
                {Array.isArray(materials) && materials.map((material) => (
                  <MenuItem key={material.id} value={material.id}>
                    {material.name}
                  </MenuItem>
                ))}
              </TextField>
              
              {/* Quality Selection */}
              <TextField
                fullWidth
                select
                label="Print Quality"
                name="quality"
                value={formData.quality}
                onChange={handleChange}
                error={!!errors.quality}
                helperText={errors.quality || " "}
                required
              >
                <MenuItem value="">
                  <em>Select a quality</em>
                </MenuItem>
                {Array.isArray(qualities) && qualities.map((quality) => (
                  <MenuItem key={quality.id} value={quality.id}>
                    {quality.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Cost per Square Foot"
                name="costPerSqFt"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                }}
                value={formData.costPerSqFt}
                onChange={handleChange}
                error={!!errors.costPerSqFt}
                helperText={errors.costPerSqFt}
                required
              />
              
              <TextField
                fullWidth
                label="Square Feet"
                name="squareFeet"
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">sq ft</InputAdornment>,
                }}
                value={formData.squareFeet}
                onChange={handleChange}
                error={!!errors.squareFeet}
                helperText={errors.squareFeet}
                required
              />
              
              <TextField
                fullWidth
                label="Total Material Cost"
                name="totalMaterialCost"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                  readOnly: true,
                }}
                value={formData.totalMaterialCost}
                disabled
              />
            </Stack>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                onClick={addMaterialExpenseAutomatically}
                size="small"
              >
                Add Material Cost to Expenses
              </Button>
            </Box>
            
            <Divider />
            <Typography variant="h6">Expenses</Typography>
            
            {/* Expenses Section */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle1">
                  Expenses (Total: LKR {calculateExpensesTotal().toFixed(2)})
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
                label="Expenses Total"
                InputProps={{
                  startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                  readOnly: true,
                }}
                value={calculateExpensesTotal().toFixed(2)}
                disabled
              />
              
              <TextField
                fullWidth
                label="Total (Expenses + Material Cost)"
                InputProps={{
                  startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                  readOnly: true,
                }}
                value={calculateTotalAmount().toFixed(2)}
                disabled
              />
              
              <TextField
                fullWidth
                label="Customer Total Amount"
                name="totalAmount"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                }}
                value={formData.totalAmount}
                onChange={handleChange}
                error={!!errors.totalAmount}
                helperText={errors.totalAmount || "Amount customer will pay"}
                required
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
                  'Update Digital Print'
                ) : (
                  'Create Digital Print'
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

export default DigitalPrintForm;