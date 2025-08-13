import React, { useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppProvider, useAppContext } from "./context/AppContext";
import { ToastProvider } from "./context/ToastContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Login from "./pages/Login.jsx";
import Unauthorized from "./pages/Unauthorized";
import ApplyLeaveForm from "./components/ApplyLeaveForm";
import LeaveTable from "./components/LeaveTable";
import PrivateRoute from "./components/PrivateRoute";
import "./App.css";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppProvider>
      <ToastProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected app layout */}
            <Route
              element={
                <PrivateRoute>
                  <AppLayout
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                  />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<RoleHome />} />

              {/* Admin-only routes */}
              <Route
                path="/admin"
                element={
                  <PrivateRoute requiredRole="Admin">
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <PrivateRoute requiredRole="Admin">
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/leaves"
                element={
                  <PrivateRoute requiredRole="Admin">
                    <LeaveTable
                      title="All Leave Requests"
                      onChanged={() => {}}
                    />
                  </PrivateRoute>
                }
              />

              {/* Employee-only routes */}
              <Route path="/apply-leave" element={<ApplyLeaveForm />} />
              <Route path="/my-leaves" element={<LeaveTable />} />
            </Route>

            {/* Unauthorized route */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </ToastProvider>
    </AppProvider>
  );
}

function AppLayout({ sidebarOpen, setSidebarOpen }) {
  return (
    <>
      <Navbar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
      <div className="flex">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <main className="container py-6 w-full">
          <Outlet />
        </main>
      </div>
    </>
  );
}

const ProfilePlaceholder = () => {
  const { state } = useAppContext();
  return (
    <div className="card">
      <h2 className="mb-2 text-lg font-semibold text-gray-900">Profile</h2>
      <div className="text-sm text-gray-700">
        Name: {state.user?.name || "—"}
      </div>
      <div className="text-sm text-gray-700">
        Email: {state.user?.email || "—"}
      </div>
      <div className="text-sm text-gray-700">
        Role: {state.role || state.user?.role || "—"}
      </div>
    </div>
  );
};

const RoleHome = () => {
  const { state } = useAppContext();
  const role = state.role || state.user?.role;
  if (role === "Admin") return <AdminDashboard />;
  return <EmployeeDashboard />;
};

export default App;
