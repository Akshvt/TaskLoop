import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import PrivateRoute from './components/PrivateRoute';
import AppShell from './components/layout/AppShell';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import EmployeesPage from './pages/EmployeesPage';
import AnnouncementsPage from './pages/AnnouncementsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Private routes — all render inside AppShell */}
            <Route
              path="/"
              element={
                <PrivateRoute founderOnly>
                  <AppShell><DashboardPage /></AppShell>
                </PrivateRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <PrivateRoute>
                  <AppShell><TasksPage /></AppShell>
                </PrivateRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <PrivateRoute founderOnly>
                  <AppShell><EmployeesPage /></AppShell>
                </PrivateRoute>
              }
            />
            <Route
              path="/announcements"
              element={
                <PrivateRoute>
                  <AppShell><AnnouncementsPage /></AppShell>
                </PrivateRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
