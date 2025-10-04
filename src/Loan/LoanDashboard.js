import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentIcon from '@mui/icons-material/Payment';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  getLoansByUserId,
  getPaymentsByUserId
} from '../services/api';

function LoanDashboard() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId] = useState(1); // Hardcoded for demo - replace with actual user context
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [loansData, paymentsData] = await Promise.all([
        getLoansByUserId(currentUserId),
        getPaymentsByUserId(currentUserId)
      ]);
      setLoans(loansData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load dashboard data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const formatCurrency = (amount) => {
    return `LKR ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateMonthlyPayment = (principal, rate, months) => {
    if (!principal || !rate || !months) return 0;
    
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) {
      return principal / months;
    }
    
    const emi = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                (Math.pow(1 + monthlyRate, months) - 1);
    return emi;
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      'ACTIVE': { color: 'success', label: 'Active' },
      'COMPLETED': { color: 'info', label: 'Completed' },
      'DEFAULTED': { color: 'error', label: 'Defaulted' },
      'SUSPENDED': { color: 'warning', label: 'Suspended' }
    };

    const config = statusConfig[status] || statusConfig['ACTIVE'];
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
      />
    );
  };

  // Calculate summary statistics
  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const totalPrincipal = activeLoans.reduce((sum, l) => sum + parseFloat(l.principalAmount || 0), 0);
  const totalMonthlyPayments = activeLoans.reduce((sum, l) => {
    return sum + calculateMonthlyPayment(l.principalAmount, l.interestRate, l.loanTermMonths);
  }, 0);

  const pendingPayments = payments.filter(p => p.paymentStatus === 'UNPAID').length;
  const overduePayments = payments.filter(p => p.paymentStatus === 'OVERDUE').length;
  const totalPaidAmount = payments
    .filter(p => p.paymentStatus === 'PAID')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  // Get recent payments (last 5)
  const recentPayments = payments
    .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
    .slice(0, 5);

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
          <AccountBalanceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Loan Dashboard
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Overview of your loans and payment status
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/loans')}
          size="large"
        >
          Manage Loans
        </Button>
        <Button
          variant="outlined"
          startIcon={<PaymentIcon />}
          onClick={() => navigate('/loan-payments')}
          size="large"
        >
          View Payments
        </Button>
      </Stack>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccountBalanceIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Active Loans
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                {activeLoans.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Principal
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                {formatCurrency(totalPrincipal)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PaymentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Monthly Payments
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'medium', color: 'warning.main' }}>
                {formatCurrency(totalMonthlyPayments)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Total Paid
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 'medium', color: 'info.main' }}>
                {formatCurrency(totalPaidAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Active Loans */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                Active Loans
              </Typography>
              <Button 
                size="small" 
                onClick={() => navigate('/loans')}
              >
                View All
              </Button>
            </Stack>
            
            {activeLoans.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No active loans. Click "Manage Loans" to add your first loan.
              </Typography>
            ) : (
              <List>
                {activeLoans.slice(0, 3).map((loan, index) => (
                  <React.Fragment key={loan.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <AccountBalanceIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={loan.loanName}
                        secondary={
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {formatCurrency(loan.principalAmount)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              • {loan.interestRate}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              • {loan.loanTermMonths}m
                            </Typography>
                          </Stack>
                        }
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        {getStatusChip(loan.status)}
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {formatCurrency(calculateMonthlyPayment(loan.principalAmount, loan.interestRate, loan.loanTermMonths))}/mo
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < Math.min(activeLoans.length - 1, 2) && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Payment Status */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                Payment Status
              </Typography>
              <Button 
                size="small" 
                onClick={() => navigate('/loan-payments')}
              >
                View All
              </Button>
            </Stack>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="warning.main">
                    {pendingPayments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="error.main">
                    {overduePayments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overdue
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card variant="outlined" sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" color="success.main">
                    {payments.filter(p => p.paymentStatus === 'PAID').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Paid
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            {/* Recent Payments */}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
              Recent Payments
            </Typography>
            
            {recentPayments.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No payment records found.
              </Typography>
            ) : (
              <List dense>
                {recentPayments.map((payment, index) => (
                  <React.Fragment key={payment.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        {payment.paymentStatus === 'PAID' ? (
                          <CheckCircleIcon color="success" />
                        ) : payment.paymentStatus === 'OVERDUE' ? (
                          <WarningIcon color="error" />
                        ) : (
                          <PaymentIcon color="warning" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            Payment #{payment.paymentNumber || 'N/A'}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            Due: {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'N/A'}
                          </Typography>
                        }
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {formatCurrency(payment.amount)}
                        </Typography>
                        <Chip
                          label={payment.paymentStatus?.replace('_', ' ') || 'PENDING'}
                          size="small"
                          color={
                            payment.paymentStatus === 'PAID' ? 'success' :
                            payment.paymentStatus === 'OVERDUE' ? 'error' : 'warning'
                          }
                        />
                      </Box>
                    </ListItem>
                    {index < recentPayments.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Alert for overdue payments */}
      {overduePayments > 0 && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="subtitle2">
            You have {overduePayments} overdue payment{overduePayments > 1 ? 's' : ''}!
          </Typography>
          <Typography variant="body2">
            Please review your payment schedule and make the necessary payments to avoid late fees.
          </Typography>
        </Alert>
      )}

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

export default LoanDashboard;