import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import InviteAccept from "./pages/InviteAccept";
import Events from "./pages/Events";
import EventCreate from "./pages/EventCreate";
import EventDetailPage from "./pages/EventDetailPage";
import EventLivePage from "./pages/EventLivePage";
import MySchedulePage from "./pages/MySchedulePage";
import Users from "./pages/admin/Users";
import AdminSettings from "./pages/admin/AdminSettings";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import SuperAdminCompanies from "./pages/superadmin/SuperAdminCompanies";
import SuperAdminPlans from "./pages/superadmin/SuperAdminPlans";
import SuperAdminSubscriptions from "./pages/superadmin/SuperAdminSubscriptions";
import SuperAdminAffiliates from "./pages/superadmin/SuperAdminAffiliates";
import SuperAdminTickets from "./pages/superadmin/SuperAdminTickets";
import SuperAdminLogs from "./pages/superadmin/SuperAdminLogs";
import AdminNotifications from "./pages/admin/AdminNotifications";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/invite/:token" element={<InviteAccept />} />
            <Route path="/" element={<Navigate to="/events" replace />} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/events/new" element={<ProtectedRoute><EventCreate /></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
            <Route path="/events/:id/live" element={<ProtectedRoute><EventLivePage /></ProtectedRoute>} />
            <Route path="/my-schedule" element={<ProtectedRoute><MySchedulePage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute><AdminNotifications /></ProtectedRoute>} />
            <Route path="/superadmin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/superadmin/companies" element={<ProtectedRoute><SuperAdminCompanies /></ProtectedRoute>} />
            <Route path="/superadmin/plans" element={<ProtectedRoute><SuperAdminPlans /></ProtectedRoute>} />
            <Route path="/superadmin/subscriptions" element={<ProtectedRoute><SuperAdminSubscriptions /></ProtectedRoute>} />
            <Route path="/superadmin/affiliates" element={<ProtectedRoute><SuperAdminAffiliates /></ProtectedRoute>} />
            <Route path="/superadmin/tickets" element={<ProtectedRoute><SuperAdminTickets /></ProtectedRoute>} />
            <Route path="/superadmin/logs" element={<ProtectedRoute><SuperAdminLogs /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
