import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Public pages
import Index from "./pages/Index";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

// Client pages
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientHome from "./pages/client/Home";
import ClientMovies from "./pages/client/Movies";
import ClientDownloads from "./pages/client/Downloads";
import ClientProfile from "./pages/client/Profile";
import Subscribe from "./pages/client/Subscribe";
import PaymentSuccess from "./pages/client/PaymentSuccess";
import PaymentCancel from "./pages/client/PaymentCancel";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStats from "./pages/admin/Dashboard";
import ManageMovies from "./pages/admin/ManageMovies";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageAgents from "./pages/admin/ManageAgents";
import ManagePlans from "./pages/admin/ManagePlans";

// Agent pages
import AgentDashboard from "./pages/agent/AgentDashboard";

import NotFound from "./pages/NotFound";
import MaintenanceMode from "./pages/MaintenanceMode";

const queryClient = new QueryClient();

const App = () => {
  // Check for maintenance mode
  const maintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

  // If maintenance mode is enabled, show maintenance page for all routes
  if (maintenanceMode) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="*" element={<MaintenanceMode />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  }

  // Normal app routing
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Payment Routes (Public) */}
              <Route path="/client/payment/success" element={<PaymentSuccess />} />
              <Route path="/client/payment/cancel" element={<PaymentCancel />} />
              
              {/* Client Routes */}
              <Route path="/client" element={
                <ProtectedRoute allowedRoles={['client']}>
                  <ClientDashboard />
                </ProtectedRoute>
              }>
                <Route path="home" element={<ClientHome />} />
                <Route path="movies" element={<ClientMovies />} />
                <Route path="downloads" element={<ClientDownloads />} />
                <Route path="profile" element={<ClientProfile />} />
                <Route path="subscribe" element={<Subscribe />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<AdminStats />} />
                <Route path="movies" element={<ManageMovies />} />
                <Route path="users" element={<ManageUsers />} />
                <Route path="agents" element={<ManageAgents />} />
                <Route path="plans" element={<ManagePlans />} />
              </Route>

              {/* Agent Routes */}
              <Route path="/agent" element={
                <ProtectedRoute allowedRoles={['agent']}>
                  <AgentDashboard />
                </ProtectedRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;