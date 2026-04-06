import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyThemeProvider } from "@/contexts/CompanyThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
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
import SuperAdminPayments from "./pages/superadmin/SuperAdminPayments";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminBiolink from "./pages/admin/AdminBiolink";
import SocialPosts from "./pages/social/SocialPosts";
import SocialCalendar from "./pages/social/SocialCalendar";
import SocialAccounts from "./pages/social/SocialAccounts";
import BioPublicPage from "./pages/BioPublicPage";
import AccountBlocked from "./pages/AccountBlocked";
import PricingPage from "./pages/PricingPage";
import CheckoutPage from "./pages/CheckoutPage";
import MySubscriptionPage from "./pages/MySubscriptionPage";
import Signup from "./pages/Signup";
import AdminReferrals from "./pages/admin/AdminReferrals";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import AdminSubstitutions from "./pages/admin/AdminSubstitutions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CompanyThemeProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/invite/:token" element={<InviteAccept />} />
            <Route path="/bio/:slug" element={<BioPublicPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
            <Route path="/events/new" element={<ProtectedRoute><EventCreate /></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
            <Route path="/events/:id/live" element={<ProtectedRoute><EventLivePage /></ProtectedRoute>} />
            <Route path="/my-schedule" element={<ProtectedRoute><MySchedulePage /></ProtectedRoute>} />
            <Route path="/checkout/:planId" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/admin/my-subscription" element={<AdminRoute><MySubscriptionPage /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><Users /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/admin/event-settings" element={<Navigate to="/admin/settings" replace />} />
            <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
            <Route path="/admin/biolink" element={<AdminRoute><AdminBiolink /></AdminRoute>} />
            <Route path="/admin/referrals" element={<AdminRoute><AdminReferrals /></AdminRoute>} />
            <Route path="/social/posts" element={<ProtectedRoute><SocialPosts /></ProtectedRoute>} />
            <Route path="/social/calendar" element={<ProtectedRoute><SocialCalendar /></ProtectedRoute>} />
            <Route path="/social/accounts" element={<AdminRoute><SocialAccounts /></AdminRoute>} />
            <Route path="/superadmin" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/superadmin/companies" element={<ProtectedRoute><SuperAdminCompanies /></ProtectedRoute>} />
            <Route path="/superadmin/plans" element={<ProtectedRoute><SuperAdminPlans /></ProtectedRoute>} />
            <Route path="/superadmin/subscriptions" element={<ProtectedRoute><SuperAdminSubscriptions /></ProtectedRoute>} />
            <Route path="/superadmin/affiliates" element={<ProtectedRoute><SuperAdminAffiliates /></ProtectedRoute>} />
            <Route path="/superadmin/tickets" element={<ProtectedRoute><SuperAdminTickets /></ProtectedRoute>} />
            <Route path="/superadmin/logs" element={<ProtectedRoute><SuperAdminLogs /></ProtectedRoute>} />
            <Route path="/superadmin/payments" element={<ProtectedRoute><SuperAdminPayments /></ProtectedRoute>} />
            <Route path="/account-blocked" element={<AccountBlocked />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </CompanyThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
