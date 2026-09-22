import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Rooms } from './pages/Rooms';
import { Students } from './pages/Students';
import { StudentForm } from './pages/StudentForm';
import { StudentDetails } from './pages/StudentDetails';
import { Allocations } from './pages/Allocations';
import { Payments } from './pages/Payments';
import { PaymentDue } from './pages/PaymentDue';
import { PaymentReceipt } from './pages/PaymentReceipt';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Notifications } from './pages/Notifications';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />

                {/* Protected App Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/students" element={<Students />} />
                    <Route path="/students/new" element={<StudentForm />} />
                    <Route path="/students/:id" element={<StudentDetails />} />
                    <Route path="/rooms" element={<Rooms />} />
                    <Route path="/allocations" element={<Allocations />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/payments/due" element={<PaymentDue />} />
                    <Route path="/payments/receipt/:receiptNumber" element={<PaymentReceipt />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
