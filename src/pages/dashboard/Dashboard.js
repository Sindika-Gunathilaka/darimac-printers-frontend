import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PrintIcon from '@mui/icons-material/Print';
import PaymentIcon from '@mui/icons-material/Payment';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { getPrintJobs, getCustomers } from '../../services/api';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RepeatIcon from '@mui/icons-material/Repeat'; 
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

function Dashboard() {
  const [printJobs, setPrintJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobsData, customersData] = await Promise.all([
          getPrintJobs(),
          getCustomers()
        ]);
        setPrintJobs(jobsData);
        setCustomers(customersData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate summary data
  const pendingPayments = printJobs.filter(job =>
    job.paymentStatus === 'UNPAID' || job.paymentStatus === 'PARTIALLY_PAID'
  );

  const totalOutstanding = pendingPayments.reduce(
    (total, job) => total + (job.balance || 0),
    0
  );

  const recentJobs = [...printJobs]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIALLY_PAID':
        return 'warning';
      case 'UNPAID':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPrintTypeLabel = (type) => {
    switch (type) {
      case 'DIGITAL':
        return 'Digital Print';
      case 'OFFSET':
        return 'Offset Print';
      case 'DUPLO':
        return 'Duplo Print';
      case 'OTHER':
        return 'Other Print';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
                <Typography variant="h6" component="div" color="text.secondary">
                  Customers
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'medium' }}>
                {customers.length}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component={Link} to="/customers">
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PrintIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
                <Typography variant="h6" component="div" color="text.secondary">
                  Print Jobs
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'medium' }}>
                {printJobs.length}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component={Link} to="/print-jobs">
                View All
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PaymentIcon sx={{ color: 'warning.main', mr: 1, fontSize: 28 }} />
                <Typography variant="h6" component="div" color="text.secondary">
                  Pending Payments
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'medium' }}>
                {pendingPayments.length}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component={Link} to="/print-jobs?status=PARTIALLY_PAID">
                View Pending
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoneyIcon sx={{ color: 'error.main', mr: 1, fontSize: 28 }} />
                <Typography variant="h6" component="div" color="text.secondary">
                  Outstanding
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'medium' }}>
                LKR {totalOutstanding.toFixed(2)}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" component={Link} to="/print-jobs?status=UNPAID">
                View Unpaid
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Jobs */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Recent Print Jobs
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Job Name</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Total Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.jobName}</TableCell>
                    <TableCell>{job.customerName || 'N/A'}</TableCell>
                    <TableCell>{getPrintTypeLabel(job.printType)}</TableCell>
                    <TableCell>LKR {job.totalAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Chip
                        label={job.paymentStatus}
                        color={getStatusColor(job.paymentStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        component={Link}
                        to={`/${job.printType.toLowerCase()}-prints/edit/${job.id}`}
                      >
                        View
                      </Button>
                      {(job.paymentStatus === 'UNPAID' || job.paymentStatus === 'PARTIALLY_PAID') && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          component={Link}
                          to={`/payments/new/LKR {job.id}`}
                          sx={{ ml: 1 }}
                        >
                          Pay
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No recent print jobs
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            component={Link}
            to="/print-jobs"
          >
            View All Jobs
          </Button>
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              component={Link}
              to="/digital-prints/new"
              startIcon={<PrintIcon />}
              sx={{ py: 2 }}
            >
              New Digital Print
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              component={Link}
              to="/offset-prints/new"
              startIcon={<PrintIcon />}
              sx={{ py: 2 }}
            >
              New Offset Print
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              component={Link}
              to="/customers/new"
              startIcon={<PeopleIcon />}
              sx={{ py: 2 }}
            >
              New Customer
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              component={Link}
              to="/expenses"
              startIcon={<ReceiptIcon />}
              sx={{ py: 2 }}
            >Expenses</Button>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              component={Link}
              to="/print-jobs?status=UNPAID"
              startIcon={<PaymentIcon />}
              sx={{ py: 2 }}
            >
              Manage Payments
            </Button>
          </Grid>


          <Grid item xs={12} sm={6} md={3}>
            <Button 
              fullWidth
              variant="contained" 
              component={Link}
              to="/recurring-expenses"
              startIcon={<RepeatIcon />}
              sx={{ py: 2 }}
            >
              Recurring Expenses
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              fullWidth
              variant="contained" 
              component={Link}
              to="/monthly-expenses"
              startIcon={<CalendarTodayIcon />}
              sx={{ py: 2 }}
            >
              Monthly Tracker
            </Button>
          </Grid>

        </Grid>
      </Paper>
    </Box>
  );
}

export default Dashboard;