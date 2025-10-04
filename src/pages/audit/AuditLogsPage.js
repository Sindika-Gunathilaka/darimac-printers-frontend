import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Collapse,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  TablePagination
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import { getAuditLogs, getAllUsers } from '../../services/api';

const ENTITY_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'DigitalPrint', label: 'Digital Print' },
  { value: 'SublimationPrint', label: 'Sublimation Print' },
  { value: 'DuploPrint', label: 'Duplo Print' },
  { value: 'OffsetPrint', label: 'Offset Print' },
  { value: 'OtherPrint', label: 'Other Print' }
];

const ACTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' }
];

const AuditLogsPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    entityType: '',
    userId: '',
    action: '',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
    endDate: new Date(),
    entityId: '',
    searchTerm: ''
  });

  // Load users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await getAllUsers();
        setUsers(usersData);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  // Load audit logs when filters change
  useEffect(() => {
    fetchAuditLogs();
  }, [page, rowsPerPage]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = {
        page: page,
        size: rowsPerPage,
        ...filters,
        startDate: filters.startDate ? format(filters.startDate, "yyyy-MM-dd'T'HH:mm:ss") : '',
        endDate: filters.endDate ? format(filters.endDate, "yyyy-MM-dd'T'HH:mm:ss") : ''
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await getAuditLogs(params);
      setAuditLogs(response.content);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to fetch audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    setPage(0); // Reset to first page
    fetchAuditLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      entityType: '',
      userId: '',
      action: '',
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: new Date(),
      entityId: '',
      searchTerm: ''
    });
    setPage(0);
  };

  const toggleRowExpansion = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatTimestamp = (timestamp) => {
    if (Array.isArray(timestamp)) {
      // Convert array format [2025, 8, 2, 12, 51, 29, 893905000] to Date
      const [year, month, day, hour, minute, second, nano] = timestamp;
      const date = new Date(year, month - 1, day, hour, minute, second, Math.floor(nano / 1000000));
      return format(date, 'MMM dd, yyyy HH:mm:ss');
    }
    return format(parseISO(timestamp), 'MMM dd, yyyy HH:mm:ss');
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'warning';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  const getEntityTypeColor = (entityType) => {
    const colors = {
      'DigitalPrint': 'primary',
      'SublimationPrint': 'secondary',
      'DuploPrint': 'info',
      'OffsetPrint': 'warning',
      'OtherPrint': 'default'
    };
    return colors[entityType] || 'default';
  };

  const formatJsonString = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Typography variant="h4" gutterBottom>
            Audit Logs
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Track all system activities and changes made to print jobs
          </Typography>

          {/* Filters Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filters
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Entity Type</InputLabel>
                    <Select
                      value={filters.entityType}
                      label="Entity Type"
                      onChange={(e) => handleFilterChange('entityType', e.target.value)}
                    >
                      {ENTITY_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Action</InputLabel>
                    <Select
                      value={filters.action}
                      label="Action"
                      onChange={(e) => handleFilterChange('action', e.target.value)}
                    >
                      {ACTIONS.map((action) => (
                        <MenuItem key={action.value} value={action.value}>
                          {action.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>User</InputLabel>
                    <Select
                      value={filters.userId}
                      label="User"
                      onChange={(e) => handleFilterChange('userId', e.target.value)}
                    >
                      <MenuItem value="">All Users</MenuItem>
                      {users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.fullName || `${user.firstName} ${user.lastName}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Print Job ID"
                    value={filters.entityId}
                    onChange={(e) => handleFilterChange('entityId', e.target.value)}
                    placeholder="Enter print job ID"
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <DateTimePicker
                    label="Start Date"
                    value={filters.startDate}
                    onChange={(date) => handleFilterChange('startDate', date)}
                    renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <DateTimePicker
                    label="End Date"
                    value={filters.endDate}
                    onChange={(date) => handleFilterChange('endDate', date)}
                    renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search"
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    placeholder="Search in changes..."
                    InputProps={{
                      endAdornment: (
                        <IconButton size="small" onClick={handleSearch}>
                          <SearchIcon />
                        </IconButton>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleSearch}
                      disabled={loading}
                      startIcon={<SearchIcon />}
                      fullWidth
                    >
                      Search
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleClearFilters}
                      startIcon={<ClearIcon />}
                    >
                      Clear
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Results Table */}
          <Paper elevation={3}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="50">#</TableCell>
                    <TableCell>Entity Type</TableCell>
                    <TableCell>Print Job ID</TableCell>
                    <TableCell>Customer Name</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Changes</TableCell>
                    <TableCell width="100">Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No audit logs found for the selected criteria
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log, index) => (
                      <React.Fragment key={log.id}>
                        <TableRow hover>
                          <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                          <TableCell>
                            <Chip
                              label={log.entityType}
                              color={getEntityTypeColor(log.entityType)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{log.entityId}</TableCell>
                          <TableCell>{log.customerName || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={log.action}
                              color={getActionColor(log.action)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{log.userName}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatTimestamp(log.timestamp)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {log.changes}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => toggleRowExpansion(log.id)}
                            >
                              {expandedRows.has(log.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                            <Collapse in={expandedRows.has(log.id)} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 2 }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="h6" gutterBottom>
                                      Request Details
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      <strong>IP Address:</strong> {log.ipAddress}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                      <strong>User Agent:</strong> {log.userAgent}
                                    </Typography>
                                  </Grid>
                                  {log.oldValues && (
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="h6" gutterBottom>
                                        Old Values
                                      </Typography>
                                      <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                                        <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>
                                          {formatJsonString(log.oldValues)}
                                        </pre>
                                      </Paper>
                                    </Grid>
                                  )}
                                  {log.newValues && (
                                    <Grid item xs={12} md={log.oldValues ? 6 : 12}>
                                      <Typography variant="h6" gutterBottom>
                                        {log.oldValues ? 'New Values' : 'Data'}
                                      </Typography>
                                      <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                                        <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>
                                          {formatJsonString(log.newValues)}
                                        </pre>
                                      </Paper>
                                    </Grid>
                                  )}
                                </Grid>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[10, 20, 50, 100]}
              component="div"
              count={totalElements}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default AuditLogsPage;