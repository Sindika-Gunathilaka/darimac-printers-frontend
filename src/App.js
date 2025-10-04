import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Auth Context
import { AuthProvider } from './contexts/AuthContext';

// Layout Component
import Layout from './components/layout/Layout';

// Pages
import Dashboard from './pages/dashboard/Dashboard';
import CustomerList from './pages/customers/CustomerList';
import CustomerForm from './pages/customers/CustomerForm';
// import PrintJobList from './pages/printJobs/PrintJobList';
import DigitalPrintForm from './pages/print-jobs/DigitalPrintForm';
import OffsetPrintForm from './pages/print-jobs/OffsetPrintForm';
import DuploPrintForm from './pages/print-jobs/DuploPrintForm';
import OtherPrints from './pages/print-jobs/OtherPrints';
import SublimationPrintForm from './pages/print-jobs/SublimationPrintForm';
import ExpenseList from './pages/Expenses/ExpenseList';
import ExpenseDetail from './pages/Expenses/ExpenseDetail';
import ExpenseForm from './pages/Expenses/ExpenseForm';
import SublimationPriceManagement from './pages/print-jobs/SublimationPriceManagement';
import RecurringExpenseManagement from './pages/financial/RecurringExpenseManagement';
import MonthlyExpenses from './pages/financial/MonthlyExpenses';

// Loan Management Pages
import LoanDashboard from './Loan/LoanDashboard';
import LoanManagement from './Loan/LoanManagement';
import LoanPayments from './Loan/LoanPayments';

// Auth Pages
import Login from './pages/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';

import AuditLogsPage from './pages/audit/AuditLogsPage';

// import OtherPrintForm from './pages/printJobs/OtherPrintForm';
// import PaymentForm from './pages/payments/PaymentForm';
// import NotFound from './pages/NotFound';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Customer Routes */}
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/new" element={<CustomerForm />} />
            <Route path="/customers/edit/:id" element={<CustomerForm />} />
            
            {/* Print Job Routes */}
            {/* <Route path="/print-jobs" element={<PrintJobList />} /> */}
            
            {/* Digital Print Routes */}
            <Route path="/digital-prints/new" element={<DigitalPrintForm />} />
            <Route path="/digital-prints/edit/:id" element={<DigitalPrintForm />} />
            
            {/* Offset Print Routes */}
            <Route path="/offset-prints/new" element={<OffsetPrintForm />} />
            <Route path="/offset-prints/edit/:id" element={<OffsetPrintForm />} />
            
            {/* Duplo Print Routes */}
            <Route path="/duplo-prints/new" element={<DuploPrintForm />} />
            <Route path="/duplo-prints/edit/:id" element={<DuploPrintForm />} />

            {/* Other Prints Routes - NEW */}
            <Route path="/other-prints/new" element={<OtherPrints />} />

            {/* Sublimation Print Routes */}
            <Route path="/sublimation-prints/new" element={<SublimationPrintForm />} />
            <Route path="/sublimation-prints/edit/:id" element={<SublimationPrintForm />} />

            {/* Sublimation Price Management */}
            <Route path="/sublimation-prices" element={<SublimationPriceManagement />} />
            
            {/* Expense Routes */}
            <Route path="/expenses" element={<ExpenseList />} />
            <Route path="/expenses/:id" element={<ExpenseDetail />} />
            <Route path="/expenses/new" element={<ExpenseForm />} />
            <Route path="/expenses/edit/:id" element={<ExpenseForm />} />

            {/* Financial Management Routes */}
            <Route path="/recurring-expenses" element={<RecurringExpenseManagement />} />
            <Route path="/monthly-expenses" element={<MonthlyExpenses />} />
            
            {/* Loan Management Routes */}
            <Route path="/loan-dashboard" element={<LoanDashboard />} />
            <Route path="/loans" element={<LoanManagement />} />
            <Route path="/loan-payments" element={<LoanPayments />} />

            {/* Audit Logs Route - ADD THIS */}
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            
            {/* Other Print Routes */}
            {/* <Route path="/other-prints/new" element={<OtherPrintForm />} />
            <Route path="/other-prints/edit/:id" element={<OtherPrintForm />} /> */}
            
            {/* Payment Routes */}
            {/* <Route path="/payments/new/:printJobId" element={<PaymentForm />} /> */}
            
            {/* 404 Not Found */}
            {/* <Route path="*" element={<NotFound />} /> */}
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;