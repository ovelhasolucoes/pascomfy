import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyThemeProvider } from "@/contexts/CompanyThemeContext";
import { PlatformBrandingProvider } from "@/contexts/PlatformBrandingContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import SuperAdminRoute from "@/components/SuperAdminRoute";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";

// Eager: critical routes
import Login from "./pages/Login";
import DashboardPage from "./pages/DashboardPage";

// Lazy: secondary routes
const Signup = lazy(() => import("./pages/Signup"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));
const BioPublicPage = lazy(() => import("./pages/BioPublicPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const Events = lazy(() => import("./pages/Events"));
const EventCreate = lazy(() => import("./pages/EventCreate"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));
const EventLivePage = lazy(() => import("./pages/EventLivePage"));
const MySchedulePage = lazy(() => import("./pages/MySchedulePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const CheckinPage = lazy(() => import("./pages/CheckinPage"));
const AdminScanPage = lazy(() => import("./pages/AdminScanPage"));
const AccountBlocked = lazy(() => import("./pages/AccountBlocked"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy: admin routes
const MySubscriptionPage = lazy(() => import("./pages/MySubscriptionPage"));
const Users = lazy(() => import("./pages/admin/Users"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminBiolink = lazy(() => import("./pages/admin/AdminBiolink"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));
const AdminSubstitutions = lazy(() => import("./pages/admin/AdminSubstitutions"));

// Lazy: social routes
const SocialPage = lazy(() => import("./pages/social/SocialPage"));

// Lazy: superadmin routes
const SuperAdminDashboard = lazy(() => import("./pages/superadmin/SuperAdminDashboard"));
const SuperAdminCompanies = lazy(() => import("./pages/superadmin/SuperAdminCompanies"));
const SuperAdminCompanyDetail = lazy(() => import("./pages/superadmin/SuperAdminCompanyDetail"));
const SuperAdminUsers = lazy(() => import("./pages/superadmin/SuperAdminUsers"));
const SuperAdminPlans = lazy(() => import("./pages/superadmin/SuperAdminPlans"));
const SuperAdminSubscriptions = lazy(() => import("./pages/superadmin/SuperAdminSubscriptions"));
const SuperAdminAffiliates = lazy(() => import("./pages/superadmin/SuperAdminAffiliates"));
const SuperAdminTickets = lazy(() => import("./pages/superadmin/SuperAdminTickets"));
const SuperAdminLogs = lazy(() => import("./pages/superadmin/SuperAdminLogs"));
const SuperAdminPayments = lazy(() => import("./pages/superadmin/SuperAdminPayments"));
const SuperAdminDomains = lazy(() => import("./pages/superadmin/SuperAdminDomains"));
const SuperAdminIntegrations = lazy(() => import("./pages/superadmin/SuperAdminIntegrations"));
const SuperAdminSettings = lazy(() => import("./pages/superadmin/SuperAdminSettings"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

function SuspenseRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineIndicator />
      <BrowserRouter>
        <PlatformBrandingProvider>
        <AuthProvider>
          <CompanyThemeProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<SuspenseRoute><ResetPassword /></SuspenseRoute>} />
            <Route path="/invite/:token" element={<SuspenseRoute><InviteAccept /></SuspenseRoute>} />
            <Route path="/bio/:slug" element={<SuspenseRoute><BioPublicPage /></SuspenseRoute>} />
            <Route path="/pricing" element={<SuspenseRoute><PricingPage /></SuspenseRoute>} />
            <Route path="/signup" element={<SuspenseRoute><Signup /></SuspenseRoute>} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><SuspenseRoute><ProfilePage /></SuspenseRoute></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><SuspenseRoute><Events /></SuspenseRoute></ProtectedRoute>} />
            <Route path="/events/new" element={<ProtectedRoute><SuspenseRoute><EventCreate /></SuspenseRoute></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute><SuspenseRoute><EventDetailPage /></SuspenseRoute></ProtectedRoute>} />
            <Route path="/events/:id/live" element={<ProtectedRoute><SuspenseRoute><EventLivePage /></SuspenseRoute></ProtectedRoute>} />
            <Route path="/my-schedule" element={<ProtectedRoute><SuspenseRoute><MySchedulePage /></SuspenseRoute></ProtectedRoute>} />
            <Route path="/checkout/:planId" element={<ProtectedRoute><SuspenseRoute><CheckoutPage /></SuspenseRoute></ProtectedRoute>} />
            <Route path="/checkin/:type/:token" element={<ProtectedRoute><SuspenseRoute><CheckinPage /></SuspenseRoute></ProtectedRoute>} />
            <Route path="/events/:id/scan" element={<ProtectedRoute><SuspenseRoute><AdminScanPage /></SuspenseRoute></ProtectedRoute>} />
            <Route path="/admin/my-subscription" element={<AdminRoute><SuspenseRoute><MySubscriptionPage /></SuspenseRoute></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><SuspenseRoute><Users /></SuspenseRoute></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><SuspenseRoute><AdminSettings /></SuspenseRoute></AdminRoute>} />
            <Route path="/admin/event-settings" element={<Navigate to="/admin/settings" replace />} />
            <Route path="/admin/biolink" element={<Navigate to="/admin/settings?tab=biolink" replace />} />
            <Route path="/admin/referrals" element={<Navigate to="/admin/settings?tab=referrals" replace />} />
            <Route path="/admin/substitutions" element={<Navigate to="/admin/settings?tab=substitutions" replace />} />
            <Route path="/admin/notifications" element={<AdminRoute><SuspenseRoute><AdminNotifications /></SuspenseRoute></AdminRoute>} />
            <Route path="/social" element={<ProtectedRoute><SuspenseRoute><SocialPage /></SuspenseRoute></ProtectedRoute>} />
            <Route path="/social/posts" element={<ProtectedRoute><SuspenseRoute><SocialPage /></SuspenseRoute></ProtectedRoute>} />
            <Route path="/social/calendar" element={<Navigate to="/social?tab=calendar" replace />} />
            <Route path="/social/accounts" element={<Navigate to="/social?tab=accounts" replace />} />
            <Route path="/superadmin" element={<SuperAdminRoute><SuspenseRoute><SuperAdminDashboard /></SuspenseRoute></SuperAdminRoute>} />
            <Route path="/superadmin/companies" element={<SuperAdminRoute><SuspenseRoute><SuperAdminCompanies /></SuspenseRoute></SuperAdminRoute>} />
            <Route path="/superadmin/plans" element={<SuperAdminRoute><SuspenseRoute><SuperAdminPlans /></SuspenseRoute></SuperAdminRoute>} />
            <Route path="/superadmin/subscriptions" element={<SuperAdminRoute><SuspenseRoute><SuperAdminSubscriptions /></SuspenseRoute></SuperAdminRoute>} />
            <Route path="/superadmin/affiliates" element={<SuperAdminRoute><SuspenseRoute><SuperAdminAffiliates /></SuspenseRoute></SuperAdminRoute>} />
            <Route path="/superadmin/tickets" element={<SuperAdminRoute><SuspenseRoute><SuperAdminTickets /></SuspenseRoute></SuperAdminRoute>} />
            <Route path="/superadmin/logs" element={<SuperAdminRoute><SuspenseRoute><SuperAdminLogs /></SuspenseRoute></SuperAdminRoute>} />
            <Route path="/superadmin/payments" element={<SuperAdminRoute><SuspenseRoute><SuperAdminPayments /></SuspenseRoute></SuperAdminRoute>} />
            <Route path="/superadmin/settings" element={<SuperAdminRoute><SuspenseRoute><SuperAdminSettings /></SuspenseRoute></SuperAdminRoute>} />
            <Route path="/account-blocked" element={<SuspenseRoute><AccountBlocked /></SuspenseRoute>} />
            <Route path="*" element={<SuspenseRoute><NotFound /></SuspenseRoute>} />
          </Routes>
          </CompanyThemeProvider>
        </AuthProvider>
        </PlatformBrandingProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
