import axios from 'axios';

const API_BASE_URL = 'https://darimac-printers-backend-production.up.railway.app/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token expiration and refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await refreshAccessToken(refreshToken);
          const { accessToken, refreshToken: newRefreshToken } = response;

          // Update stored tokens
          localStorage.setItem('token', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Refresh token - matches POST /api/auth/refresh-token
export const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post('/auth/refresh-token', {
      refreshToken,
    });
    return response.data;
  } catch (error) {
    throw error; // Don't use handleError here to avoid recursion
  }
};

// Error handler
const handleError = (error, message) => {
  console.error(message, error);
  throw error;
};

// ===== AUTH API FUNCTIONS =====

// Login user - matches POST /api/auth/login
export const loginUser = async (usernameOrEmail, password) => {
  try {
    const response = await axios.post('/auth/login', {
      usernameOrEmail,
      password
    });
    return response.data; // Returns { accessToken, refreshToken, user, message }
  } catch (error) {
    return handleError(error, 'Error logging in user:');
  }
};

// Register user - matches POST /api/auth/register
export const registerUser = async (userData) => {
  try {
    const response = await axios.post('/auth/register', userData);
    return response.data; // Returns { token, user, message }
  } catch (error) {
    return handleError(error, 'Error registering user:');
  }
};

// Get current user - matches GET /api/auth/me
export const getCurrentUser = async () => {
  try {
    const response = await axios.get('/auth/me');
    return response.data; // Returns User object
  } catch (error) {
    return handleError(error, 'Error fetching current user:');
  }
};

// Logout user - matches POST /api/auth/logout
export const logoutUser = async (refreshToken) => {
  try {
    const response = await axios.post('/auth/logout', {
      refreshToken,
    });
    return response.data; // Returns { message: "Logout successful" }
  } catch (error) {
    return handleError(error, 'Error logging out user:');
  }
};

// ===== CUSTOMER API FUNCTIONS =====

export const getCustomers = async () => {
  try {
    const response = await axios.get('/customers');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching customers:');
  }
};

export const getCustomerById = async (id) => {
  try {
    const response = await axios.get(`/customers/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching customer with id ${id}:`);
  }
};

export const createCustomer = async (customerData) => {
  try {
    const response = await axios.post('/customers', customerData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error creating customer:');
  }
};

export const updateCustomer = async (id, customerData) => {
  try {
    const response = await axios.put(`/customers/${id}`, customerData);
    return response.data;
  } catch (error) {
    return handleError(error, `Error updating customer with id ${id}:`);
  }
};

export const deleteCustomer = async (id) => {
  try {
    const response = await axios.delete(`/customers/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error deleting customer with id ${id}:`);
  }
};

export const searchCustomers = async (name) => {
  try {
    const response = await axios.get(`/customers/search?name=${name}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error searching customers with name ${name}:`);
  }
};

// ===== PRINT JOB API FUNCTIONS =====

export const getPrintJobs = async () => {
  try {
    const response = await axios.get('/print-jobs');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching print jobs:');
  }
};

export const getPrintJobById = async (id) => {
  try {
    const response = await axios.get(`/print-jobs/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching print job with id ${id}:`);
  }
};

export const recordPayment = async (printJobId, paymentData) => {
  try {
    const response = await axios.post(`/print-jobs/${printJobId}/payments`, paymentData);
    return response.data;
  } catch (error) {
    return handleError(error, `Error recording payment for print job with id ${printJobId}:`);
  }
};

export const getUserPrintJobs = async () => {
  try {
    const response = await axios.get('/print-jobs');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching user print jobs:');
  }
};

export const createPrintJob = async (printJobData) => {
  try {
    const response = await axios.post('/print-jobs', printJobData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error creating print job:');
  }
};

// ===== DIGITAL PRINT API FUNCTIONS =====

export const getDigitalPrints = async () => {
  try {
    const response = await axios.get('/digital-prints');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching digital prints:');
  }
};

export const getDigitalPrintById = async (id) => {
  try {
    const response = await axios.get(`/digital-prints/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching digital print with id ${id}:`);
  }
};

export const createDigitalPrint = async (printData) => {
  try {
    const response = await axios.post('/digital-prints', printData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error creating digital print:');
  }
};

export const updateDigitalPrint = async (id, printData) => {
  try {
    const response = await axios.put(`/digital-prints/${id}`, printData);
    return response.data;
  } catch (error) {
    return handleError(error, `Error updating digital print with id ${id}:`);
  }
};

export const getMaterials = async () => {
  try {
    const response = await axios.get('/digital-prints/materials');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching materials:');
  }
};

export const getQualities = async () => {
  try {
    const response = await axios.get('/digital-prints/qualities');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching qualities:');
  }
};

// ===== OFFSET PRINT API FUNCTIONS =====

export const getSuppliers = async () => {
  try {
    const response = await axios.get('/suppliers');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching suppliers:');
  }
};

export const getOffsetPrintById = async (id) => {
  try {
    const response = await axios.get(`/offset-prints/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching offset print:');
  }
};

export const createOffsetPrint = async (offsetPrintData) => {
  try {
    const response = await axios.post('/offset-prints', offsetPrintData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error creating offset print:');
  }
};

export const updateOffsetPrint = async (id, offsetPrintData) => {
  try {
    const response = await axios.put(`/offset-prints/${id}`, offsetPrintData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error updating offset print:');
  }
};

// ===== DUPLO PRINT API FUNCTIONS =====

export const getDuploPrints = async () => {
  try {
    const response = await axios.get('/duplo-prints');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching duplo prints:');
  }
};

export const getDuploPrintById = async (id) => {
  try {
    const response = await axios.get(`/duplo-prints/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching duplo print with id ${id}:`);
  }
};

export const createDuploPrint = async (printData) => {
  try {
    const response = await axios.post('/duplo-prints', printData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error creating duplo print:');
  }
};

export const updateDuploPrint = async (id, printData) => {
  try {
    const response = await axios.put(`/duplo-prints/${id}`, printData);
    return response.data;
  } catch (error) {
    return handleError(error, `Error updating duplo print with id ${id}:`);
  }
};

// ===== EXPENSE API FUNCTIONS =====

export const getAllExpenses = async () => {
  try {
    const response = await axios.get('/expenses');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching expenses:');
  }
};

export const getExpenseById = async (id) => {
  try {
    const response = await axios.get(`/expenses/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching expense with ID ${id}:`);
  }
};

export const createExpense = async (expenseData) => {
  try {
    const response = await axios.post('/expenses', expenseData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error creating expense:');
  }
};

export const updateExpense = async (id, expenseData) => {
  try {
    const response = await axios.put(`/expenses/${id}`, expenseData);
    return response.data;
  } catch (error) {
    return handleError(error, `Error updating expense with ID ${id}:`);
  }
};

export const deleteExpense = async (id) => {
  try {
    await axios.delete(`/expenses/${id}`);
    return true;
  } catch (error) {
    return handleError(error, `Error deleting expense with ID ${id}:`);
  }
};

export const updatePaymentStatus = async (id, paymentStatus, paymentDate) => {
  try {
    const response = await axios.patch(`/expenses/${id}/payment-status`, {
      paymentStatus,
      paymentDate
    });
    return response.data;
  } catch (error) {
    return handleError(error, `Error updating payment status for expense with ID ${id}:`);
  }
};

export const searchExpenses = async (searchParams) => {
  try {
    const response = await axios.get('/expenses/search', { params: searchParams });
    return response.data;
  } catch (error) {
    return handleError(error, 'Error searching expenses:');
  }
};

export const getExpensesBySupplier = async (supplierId) => {
  try {
    const response = await axios.get(`/expenses/supplier/${supplierId}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching expenses for supplier ${supplierId}:`);
  }
};

export const getExpensesByStatus = async (status) => {
  try {
    const response = await axios.get(`/expenses/status/${status}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching expenses with status ${status}:`);
  }
};

export const getExpensesByType = async (type) => {
  try {
    const response = await axios.get(`/expenses/type/${type}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching expenses of type ${type}:`);
  }
};

export const getExpensesByDateRange = async (startDate, endDate) => {
  try {
    const response = await axios.get('/expenses/date-range', {
      params: { startDate, endDate }
    });
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching expenses between ${startDate} and ${endDate}:`);
  }
};

export const getExpensesByGrn = async (grnNumber) => {
  try {
    const response = await axios.get(`/expenses/grn/${grnNumber}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching expenses for GRN ${grnNumber}:`);
  }
};

export const getAllSuppliers = async () => {
  try {
    const response = await axios.get('/expenses/suppliers');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching suppliers:');
  }
};

export const getExpenseTypes = async () => {
  try {
    const response = await axios.get('/expenses/expense-types');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching expense types:');
  }
};

export const getPaymentStatuses = async () => {
  try {
    const response = await axios.get('/expenses/payment-statuses');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching payment statuses:');
  }
};

// ===== SUBLIMATION PRINT API FUNCTIONS =====

export const getAllSublimationPrints = async () => {
  try {
    const response = await axios.get('/sublimation-prints');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching sublimation prints:');
  }
};

export const getSublimationPrintById = async (id) => {
  try {
    const response = await axios.get(`/sublimation-prints/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching sublimation print:');
  }
};

export const getSublimationPrintsByCustomerId = async (customerId) => {
  try {
    const response = await axios.get(`/sublimation-prints/customer/${customerId}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching sublimation prints for customer:');
  }
};

export const createSublimationPrint = async (sublimationPrintData) => {
  try {
    const response = await axios.post('/sublimation-prints', sublimationPrintData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error creating sublimation print:');
  }
};

export const updateSublimationPrint = async (id, sublimationPrintData) => {
  try {
    const response = await axios.put(`/sublimation-prints/${id}`, sublimationPrintData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error updating sublimation print:');
  }
};

export const deleteSublimationPrint = async (id) => {
  try {
    await axios.delete(`/sublimation-prints/${id}`);
    return true;
  } catch (error) {
    return handleError(error, 'Error deleting sublimation print:');
  }
};

export const getSublimationTypes = async () => {
  try {
    const response = await axios.get('/sublimation-prints/types');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching sublimation types:');
  }
};

export const getCurrentSublimationPrice = async (sublimationType) => {
  try {
    const response = await axios.get(`/sublimation-prints/current-price/${sublimationType}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching current price:');
  }
};

// ===== SUBLIMATION PRICE MANAGEMENT API FUNCTIONS =====

export const getSublimationPrices = async () => {
  try {
    const response = await axios.get('/sublimation-prices/active');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching sublimation prices:');
  }
};

export const getAllSublimationPrices = async () => {
  try {
    const response = await axios.get('/sublimation-prices');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching all sublimation prices:');
  }
};

export const getSublimationPriceById = async (id) => {
  try {
    const response = await axios.get(`/sublimation-prices/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching sublimation price:');
  }
};

export const createSublimationPrice = async (priceData) => {
  try {
    const response = await axios.post('/sublimation-prices', priceData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error creating sublimation price:');
  }
};

export const updateSublimationPrice = async (id, priceData) => {
  try {
    const response = await axios.put(`/sublimation-prices/${id}`, priceData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error updating sublimation price:');
  }
};

export const deleteSublimationPrice = async (id) => {
  try {
    await axios.delete(`/sublimation-prices/${id}`);
    return true;
  } catch (error) {
    return handleError(error, 'Error deleting sublimation price:');
  }
};

export const activateSublimationPrice = async (id) => {
  try {
    const response = await axios.put(`/sublimation-prices/${id}/activate`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error activating sublimation price:');
  }
};

export const deactivateSublimationPrice = async (id) => {
  try {
    const response = await axios.put(`/sublimation-prices/${id}/deactivate`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error deactivating sublimation price:');
  }
};

// ===== RECURRING EXPENSES API FUNCTIONS =====

export const getAllRecurringExpenses = async () => {
  try {
    const response = await axios.get('/recurring-expenses');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching recurring expenses:');
  }
};

export const getActiveRecurringExpenses = async () => {
  try {
    const response = await axios.get('/recurring-expenses/active');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching active recurring expenses:');
  }
};

export const getRecurringExpenseById = async (id) => {
  try {
    const response = await axios.get(`/recurring-expenses/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching recurring expense with id ${id}:`);
  }
};

export const getRecurringExpensesByCategory = async (category) => {
  try {
    const response = await axios.get(`/recurring-expenses/category/${category}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching recurring expenses by category ${category}:`);
  }
};

export const getRecurringExpenseCategories = async () => {
  try {
    const response = await axios.get('/recurring-expenses/categories');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching recurring expense categories:');
  }
};

export const getExpenseFrequencies = async () => {
  try {
    const response = await axios.get('/recurring-expenses/frequencies');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching expense frequencies:');
  }
};

export const getExpensesDueSoon = async (days = 30) => {
  try {
    const response = await axios.get(`/recurring-expenses/due-soon?days=${days}`);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching expenses due soon:');
  }
};

export const getMonthlyBudget = async () => {
  try {
    const response = await axios.get('/recurring-expenses/monthly-budget');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching monthly budget:');
  }
};

export const getTotalExpensesForMonth = async (year, month) => {
  try {
    const response = await axios.get(`/recurring-expenses/total/${year}/${month}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching total expenses for ${year}/${month}:`);
  }
};

export const createRecurringExpense = async (expenseData) => {
  try {
    const response = await axios.post('/recurring-expenses', expenseData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error creating recurring expense:');
  }
};

export const updateRecurringExpense = async (id, expenseData) => {
  try {
    const response = await axios.put(`/recurring-expenses/${id}`, expenseData);
    return response.data;
  } catch (error) {
    return handleError(error, `Error updating recurring expense with id ${id}:`);
  }
};

export const deleteRecurringExpense = async (id) => {
  try {
    await axios.delete(`/recurring-expenses/${id}`);
    return true;
  } catch (error) {
    return handleError(error, `Error deleting recurring expense with id ${id}:`);
  }
};

export const toggleRecurringExpenseActive = async (id) => {
  try {
    const response = await axios.put(`/recurring-expenses/${id}/toggle-active`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error toggling recurring expense status with id ${id}:`);
  }
};

export const generateMonthlyEntries = async (year, month) => {
  try {
    const response = await axios.post(`/recurring-expenses/generate/${year}/${month}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error generating monthly entries for ${year}/${month}:`);
  }
};

export const autoGenerateCurrentMonth = async () => {
  try {
    const response = await axios.post('/recurring-expenses/auto-generate');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error auto-generating current month entries:');
  }
};

// ===== MONTHLY EXPENSE ENTRIES API FUNCTIONS =====

export const getAllMonthlyExpenseEntries = async () => {
  try {
    const response = await axios.get('/monthly-expense-entries');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching monthly expense entries:');
  }
};

export const getMonthlyExpenseEntryById = async (id) => {
  try {
    const response = await axios.get(`/monthly-expense-entries/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching monthly expense entry with id ${id}:`);
  }
};

export const getMonthlyExpenseEntriesForMonth = async (year, month) => {
  try {
    const response = await axios.get(`/monthly-expense-entries/month/${year}/${month}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching monthly expense entries for ${year}/${month}:`);
  }
};

export const getUnpaidExpenseEntries = async () => {
  try {
    const response = await axios.get('/monthly-expense-entries/unpaid');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching unpaid expense entries:');
  }
};

export const getOverdueExpenseEntries = async () => {
  try {
    const response = await axios.get('/monthly-expense-entries/overdue');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching overdue expense entries:');
  }
};

export const getTotalMonthlyExpenses = async (year, month) => {
  try {
    const response = await axios.get(`/monthly-expense-entries/total/${year}/${month}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching total monthly expenses for ${year}/${month}:`);
  }
};

export const getTotalPaidExpensesForMonth = async (year, month) => {
  try {
    const response = await axios.get(`/monthly-expense-entries/paid-total/${year}/${month}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching total paid expenses for ${year}/${month}:`);
  }
};

export const getTotalUnpaidExpensesForMonth = async (year, month) => {
  try {
    const response = await axios.get(`/monthly-expense-entries/unpaid-total/${year}/${month}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching total unpaid expenses for ${year}/${month}:`);
  }
};

export const getMonthlyExpenseEntriesForYearRange = async (startYear, endYear) => {
  try {
    const response = await axios.get(`/monthly-expense-entries/year-range/${startYear}/${endYear}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching monthly expense entries for year range ${startYear}-${endYear}:`);
  }
};

export const getMonthlySummary = async (year, month) => {
  try {
    const response = await axios.get(`/monthly-expense-entries/summary/${year}/${month}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching monthly summary for ${year}/${month}:`);
  }
};

export const createMonthlyExpenseEntry = async (entryData) => {
  try {
    const response = await axios.post('/monthly-expense-entries', entryData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error creating monthly expense entry:');
  }
};

export const updateMonthlyExpenseEntry = async (id, entryData) => {
  try {
    const response = await axios.put(`/monthly-expense-entries/${id}`, entryData);
    return response.data;
  } catch (error) {
    return handleError(error, `Error updating monthly expense entry with id ${id}:`);
  }
};

export const deleteMonthlyExpenseEntry = async (id) => {
  try {
    await axios.delete(`/monthly-expense-entries/${id}`);
    return true;
  } catch (error) {
    return handleError(error, `Error deleting monthly expense entry with id ${id}:`);
  }
};

export const markExpenseAsPaid = async (id, paymentDate = null) => {
  try {
    const params = paymentDate ? `?paymentDate=${paymentDate}` : '';
    const response = await axios.put(`/monthly-expense-entries/${id}/mark-paid${params}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error marking expense as paid with id ${id}:`);
  }
};

export const markExpenseAsUnpaid = async (id) => {
  try {
    const response = await axios.put(`/monthly-expense-entries/${id}/mark-unpaid`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error marking expense as unpaid with id ${id}:`);
  }
};

// ===== LOAN MANAGEMENT API FUNCTIONS =====

export const getAllLoans = async () => {
  try {
    const response = await axios.get('/loans');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching loans:');
  }
};

export const getLoanById = async (id) => {
  try {
    const response = await axios.get(`/loans/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching loan with id ${id}:`);
  }
};

export const getLoansByUserId = async (userId) => {
  try {
    const response = await axios.get(`/loans/user/${userId}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching loans for user ${userId}:`);
  }
};

export const getLoansByStatus = async (status) => {
  try {
    const response = await axios.get(`/loans/status/${status}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching loans with status ${status}:`);
  }
};

export const getLoanTypes = async () => {
  try {
    const response = await axios.get('/loans/types');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching loan types:');
  }
};

export const getLoanStatuses = async () => {
  try {
    const response = await axios.get('/loans/statuses');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching loan statuses:');
  }
};

export const createLoan = async (loanData) => {
  try {
    const response = await axios.post('/loans', loanData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error creating loan:');
  }
};

export const updateLoan = async (id, loanData) => {
  try {
    const response = await axios.put(`/loans/${id}`, loanData);
    return response.data;
  } catch (error) {
    return handleError(error, `Error updating loan with id ${id}:`);
  }
};

export const deleteLoan = async (id) => {
  try {
    await axios.delete(`/loans/${id}`);
    return true;
  } catch (error) {
    return handleError(error, `Error deleting loan with id ${id}:`);
  }
};

// ===== LOAN PAYMENT API FUNCTIONS =====

export const getAllPayments = async () => {
  try {
    const response = await axios.get('/loan-payments');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching payments:');
  }
};

export const getPaymentById = async (id) => {
  try {
    const response = await axios.get(`/loan-payments/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching payment with id ${id}:`);
  }
};

export const getPaymentsByLoanId = async (loanId) => {
  try {
    const response = await axios.get(`/loan-payments/loan/${loanId}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching payments for loan ${loanId}:`);
  }
};

export const getPaymentsByUserId = async (userId) => {
  try {
    const response = await axios.get(`/loan-payments/user/${userId}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching payments for user ${userId}:`);
  }
};

export const getPaymentMethods = async () => {
  try {
    const response = await axios.get('/loan-payments/payment-methods');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching payment methods:');
  }
};

export const getLoanPaymentStatuses = async () => {
  try {
    const response = await axios.get('/loan-payments/payment-statuses');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching payment statuses:');
  }
};

export const createPayment = async (paymentData) => {
  try {
    const response = await axios.post('/loan-payments', paymentData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error creating payment:');
  }
};

export const updatePayment = async (id, paymentData) => {
  try {
    const response = await axios.put(`/loan-payments/${id}`, paymentData);
    return response.data;
  } catch (error) {
    return handleError(error, `Error updating payment with id ${id}:`);
  }
};

export const deletePayment = async (id) => {
  try {
    await axios.delete(`/loan-payments/${id}`);
    return true;
  } catch (error) {
    return handleError(error, `Error deleting payment with id ${id}:`);
  }
};

export const markPaymentAsPaid = async (id, paymentDate, paymentMethod, transactionReference) => {
  try {
    const params = new URLSearchParams();
    if (paymentDate) params.append('paymentDate', paymentDate);
    if (paymentMethod) params.append('paymentMethod', paymentMethod);
    if (transactionReference) params.append('transactionReference', transactionReference);

    const response = await axios.put(`/loan-payments/${id}/mark-paid?${params.toString()}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error marking payment as paid with id ${id}:`);
  }
};

// ===== USER MANAGEMENT API FUNCTIONS =====

export const getAllUsers = async () => {
  try {
    const response = await axios.get('/users');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching users:');
  }
};

export const getUserById = async (id) => {
  try {
    const response = await axios.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching user with id ${id}:`);
  }
};

export const getUserByUsername = async (username) => {
  try {
    const response = await axios.get(`/users/username/${username}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching user with username ${username}:`);
  }
};

export const getUserRoles = async () => {
  try {
    const response = await axios.get('/users/roles');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching user roles:');
  }
};

export const createUser = async (userData) => {
  try {
    const response = await axios.post('/users', userData);
    return response.data;
  } catch (error) {
    return handleError(error, 'Error creating user:');
  }
};

export const updateUser = async (id, userData) => {
  try {
    const response = await axios.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    return handleError(error, `Error updating user with id ${id}:`);
  }
};

export const deleteUser = async (id) => {
  try {
    await axios.delete(`/users/${id}`);
    return true;
  } catch (error) {
    return handleError(error, `Error deleting user with id ${id}:`);
  }
};

export const checkUsernameAvailability = async (username) => {
  try {
    const response = await axios.get(`/users/check-username/${username}`);
    return { available: response.data };
  } catch (error) {
    return handleError(error, `Error checking username availability for ${username}:`);
  }
};

export const checkEmailAvailability = async (email) => {
  try {
    const response = await axios.get(`/users/check-email/${encodeURIComponent(email)}`);
    return { available: response.data };
  } catch (error) {
    return handleError(error, `Error checking email availability for ${email}:`);
  }
};

export const getUserProfile = async (userId) => {
  try {
    const response = await axios.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching user profile for ${userId}:`);
  }
};

export const updateUserProfile = async (userId, userData) => {
  try {
    const response = await axios.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    return handleError(error, `Error updating user profile for ${userId}:`);
  }
};

// Add these functions to your services/api.js file

// ===== AUDIT LOGS API FUNCTIONS =====

export const getAuditLogs = async (params = {}) => {
  try {
    const response = await axios.get('/audit-logs', { params });
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching audit logs:');
  }
};

export const getAuditLogById = async (id) => {
  try {
    const response = await axios.get(`/audit-logs/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching audit log with id ${id}:`);
  }
};

export const getAuditLogsByEntityType = async (entityType, params = {}) => {
  try {
    const response = await axios.get(`/audit-logs/entity-type/${entityType}`, { params });
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching audit logs for entity type ${entityType}:`);
  }
};

export const getAuditLogsByUserId = async (userId, params = {}) => {
  try {
    const response = await axios.get(`/audit-logs/user/${userId}`, { params });
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching audit logs for user ${userId}:`);
  }
};

export const getAuditLogsByEntityId = async (entityType, entityId, params = {}) => {
  try {
    const response = await axios.get(`/audit-logs/entity/${entityType}/${entityId}`, { params });
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching audit logs for ${entityType} with id ${entityId}:`);
  }
};

export const getAuditLogsByDateRange = async (startDate, endDate, params = {}) => {
  try {
    const response = await axios.get('/audit-logs/date-range', {
      params: {
        startDate,
        endDate,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    return handleError(error, `Error fetching audit logs for date range ${startDate} to ${endDate}:`);
  }
};

export const getAuditLogActions = async () => {
  try {
    const response = await axios.get('/audit-logs/actions');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching audit log actions:');
  }
};

export const getAuditLogEntityTypes = async () => {
  try {
    const response = await axios.get('/audit-logs/entity-types');
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching audit log entity types:');
  }
};

export const exportAuditLogs = async (params = {}) => {
  try {
    const response = await axios.get('/audit-logs/export', {
      params,
      responseType: 'blob' // Important for file downloads
    });
    return response.data;
  } catch (error) {
    return handleError(error, 'Error exporting audit logs:');
  }
};

export const getAuditLogStats = async (params = {}) => {
  try {
    const response = await axios.get('/audit-logs/stats', { params });
    return response.data;
  } catch (error) {
    return handleError(error, 'Error fetching audit log statistics:');
  }
};