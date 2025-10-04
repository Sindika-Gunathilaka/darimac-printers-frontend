import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Divider,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import { getExpenseById, updatePaymentStatus, deleteExpense } from '../../services/api';
import { format } from 'date-fns';

function ExpenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setLoading(true);
        const data = await getExpenseById(id);
        setExpense(data);
      } catch (error) {
        console.error('Error fetching expense:', error);
        setError('Failed to load expense details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpense();
  }, [id]);

  const handleMarkAsPaid = async () => {
    try {
      const formattedDate = format(paymentDate, 'yyyy-MM-dd');
      await updatePaymentStatus(id, 'PAID', formattedDate);
      
      // Update the local expense object
      setExpense({
        ...expense,
        paymentStatus: 'PAID',
        paymentDate: formattedDate
      });
      
      setPaymentDialog(false);
    } catch (error) {
      console.error('Error updating payment status:', error);
      setError('Failed to update payment status. Please try again later.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteExpense(id);
      setConfirmDelete(false);
      navigate('/expenses');
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Failed to delete expense. Please try again later.');
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/expenses')}
        >
          Back to Expenses
        </Button>
      </Box>
    );
  }

  if (!expense) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        <Alert severity="warning">
          Expense not found.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/expenses')}
          sx={{ mt: 2 }}
        >
          Back to Expenses
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/expenses')}
        >
          Back to Expenses
        </Button>
        
        <Stack direction="row" spacing={2}>
          {expense.paymentStatus !== 'PAID' && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<PaymentIcon />}
              onClick={() => setPaymentDialog(true)}
            >
              Mark as Paid
            </Button>
          )}
          
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/expenses/edit/${id}`)}
          >
            Edit
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setConfirmDelete(true)}
          >
            Delete
          </Button>
        </Stack>
      </Stack>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h4">
                {expense.description}
              </Typography>
              
              {getStatusChip(expense.paymentStatus)}
            </Stack>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {expense.expenseNumber}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <List>
              <ListItem>
                <ListItemText
                  primary="Amount"
                  secondary={`LKR ${parseFloat(expense.amount).toFixed(2)}`}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'h6' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Expense Type"
                  secondary={expense.expenseType?.replace(/_/g, ' ')}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Supplier"
                  secondary={expense.supplier?.name || 'N/A'}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="GRN Number"
                  secondary={expense.grnNumber || 'N/A'}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Invoice Number"
                  secondary={expense.invoiceNumber || 'N/A'}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                />
              </ListItem>
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <List>
              <ListItem>
                <ListItemText
                  primary="Expense Date"
                  secondary={expense.expenseDate || 'N/A'}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Payment Due Date"
                  secondary={expense.paymentDueDate || 'N/A'}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Payment Date"
                  secondary={expense.paymentDate || 'N/A'}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Created At"
                  secondary={expense.createdAt ? new Date(expense.createdAt).toLocaleString() : 'N/A'}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                />
              </ListItem>
              
              <ListItem>
                <ListItemText
                  primary="Last Updated"
                  secondary={expense.updatedAt ? new Date(expense.updatedAt).toLocaleString() : 'N/A'}
                  primaryTypographyProps={{ variant: 'subtitle2', color: 'text.secondary' }}
                />
              </ListItem>
            </List>
          </Grid>
          
          {expense.notes && (
            <>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {expense.notes}
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>
      
      {/* Mark as Paid Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)}>
        <DialogTitle>Mark Expense as Paid</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body1" gutterBottom>
              Please select the payment date:
            </Typography>
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Payment Date"
                value={paymentDate}
                onChange={(date) => setPaymentDate(date)}
                renderInput={(params) => (
                  <TextField {...params} fullWidth sx={{ mt: 2 }} />
                )}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button onClick={handleMarkAsPaid} color="success" variant="contained">
            Mark as Paid
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this expense? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ExpenseDetail;