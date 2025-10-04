import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Toolbar,
  Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PaymentIcon from '@mui/icons-material/Payment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getPrintJobs } from '../../services/apiService';

function PrintJobList() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const [printJobs, setPrintJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchPrintJobs = async () => {
    try {
      setLoading(true);
      const data = await getPrintJobs();
      setPrintJobs(data);
    } catch (error) {
      console.error('Error fetching print jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrintJobs();
  }, []);

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

  // Filter print jobs based on selected filters
  const filteredPrintJobs = printJobs.filter(job => {
    if (statusFilter !== 'ALL' && job.paymentStatus !== statusFilter) {
      return false;
    }
    if (typeFilter !== 'ALL' && job.printType !== typeFilter) {
      return false;
    }
    return true;
  });

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleTypeFilterChange = (event) => {
    setTypeFilter(event.target.value);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Print Jobs
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={handleStatusFilterChange}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="PARTIALLY_PAID">Partially Paid</MenuItem>
                <MenuItem value="UNPAID">Unpaid</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Type Filter</InputLabel>
              <Select
                value={typeFilter}
                label="Type Filter"
                onChange={handleTypeFilterChange}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="DIGITAL">Digital Print</MenuItem>
                <MenuItem value="OFFSET">Offset Print</MenuItem>
                <MenuItem value="DUPLO">Duplo Print</MenuItem>
                <MenuItem value="OTHER">Other Print</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component={Link}
              to="/digital-prints/new"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Digital
            </Button>
            <Button
              component={Link}
              to="/offset-prints/new"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Offset
            </Button>
            <Button
              component={Link}
              to="/duplo-prints/new"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Duplo
            </Button>
            <Button
              component={Link}
              to="/other-prints/new"
              variant="contained"
              startIcon={<AddIcon />}
            >
              Other
            </Button>
          </Box>
        </Toolbar>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Job Name</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Total Cost</TableCell>
              <TableCell>Amount Paid</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Loading print jobs...
                </TableCell>
              </TableRow>
            ) : filteredPrintJobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No print jobs found
                </TableCell>
              </TableRow>
            ) : (
              filteredPrintJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>{job.jobName}</TableCell>
                  <TableCell>{job.customer?.name || 'N/A'}</TableCell>
                  <TableCell>{getPrintTypeLabel(job.printType)}</TableCell>
                  <TableCell>${job.totalCost?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>${job.amountPaid?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>${job.balance?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={job.paymentStatus} 
                      color={getStatusColor(job.paymentStatus)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => navigate(`/${job.printType.toLowerCase()}-prints/edit/${job.id}`)}
                    >
                      <EditIcon />
                    </IconButton>
                    {(job.paymentStatus === 'UNPAID' || job.paymentStatus === 'PARTIALLY_PAID') && (
                      <IconButton
                        color="success"
                        onClick={() => navigate(`/payments/new/${job.id}`)}
                      >
                        <PaymentIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default PrintJobList;