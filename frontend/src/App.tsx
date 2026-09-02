import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { AdminAuditLogs } from "./pages/admin/AuditLogs";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminReports } from "./pages/admin/Reports";
import { AdminRequestDetails } from "./pages/admin/RequestDetails";
import { AdminRequestsQueue } from "./pages/admin/Requests";
import { Login } from "./pages/auth/Login";
import { ProfilePage } from "./pages/common/Profile";
import { EmployeeDashboard } from "./pages/employee/Dashboard";
import { MyBooking } from "./pages/employee/MyBooking";
import { MyRequests } from "./pages/employee/MyRequests";
import { NewTravelRequest } from "./pages/employee/NewRequest";
import { EmployeeRequestDetails } from "./pages/employee/RequestDetails";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleProtectedRoute } from "./routes/RoleProtectedRoute";

const RootRedirect: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={isAdmin ? "/admin/dashboard" : "/employee/dashboard"} replace />;
};

const LoginGuard: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? "/admin/dashboard" : "/employee/dashboard"} replace />;
  }
  return <Login />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginGuard />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<RootRedirect />} />

              {/* Layout for Employee and Admin */}
              <Route element={<AppLayout />}>
                {/* Employee Routes */}
                <Route
                  element={<RoleProtectedRoute allowedRoles={["EMPLOYEE", "ADMIN"]} />}
                >
                  <Route
                    path="/employee/dashboard"
                    element={<EmployeeDashboard />}
                  />
                  <Route
                    path="/employee/requests"
                    element={<MyRequests />}
                  />
                  <Route
                    path="/employee/requests/new"
                    element={<NewTravelRequest />}
                  />
                  <Route
                    path="/employee/requests/:id"
                    element={<EmployeeRequestDetails />}
                  />
                  <Route
                    path="/employee/bookings/:id"
                    element={<MyBooking />}
                  />
                </Route>

                {/* Admin Routes */}
                <Route
                  element={<RoleProtectedRoute allowedRoles={["ADMIN"]} />}
                >
                  <Route
                    path="/admin/dashboard"
                    element={<AdminDashboard />}
                  />
                  <Route
                    path="/admin/requests"
                    element={<AdminRequestsQueue />}
                  />
                  <Route
                    path="/admin/requests/:id"
                    element={<AdminRequestDetails />}
                  />
                  <Route
                    path="/admin/reports"
                    element={<AdminReports />}
                  />
                  <Route
                    path="/admin/audit-logs"
                    element={<AdminAuditLogs />}
                  />
                </Route>

                {/* Profile Route */}
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
