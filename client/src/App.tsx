import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { PermissionsProvider } from "@/hooks/use-permissions";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppHeader } from "@/components/app-header";
import { FloatingChecklist } from "@/components/floating-checklist";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/onboarding";
import Login from "@/pages/login";
import VendorLogin from "@/pages/vendor-login";
import VendorRegister from "@/pages/vendor-register";
import VerifyEmail from "@/pages/verify-email";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Dashboard from "@/pages/dashboard";
import Vendors from "@/pages/vendors";
import Guests from "@/pages/guests";
import Tasks from "@/pages/tasks";
import Timeline from "@/pages/timeline";
import Budget from "@/pages/budget";
import BudgetIntelligence from "@/pages/budget-intelligence";
import Contracts from "@/pages/contracts";
import VendorDashboard from "@/pages/vendor-dashboard";
import Messages from "@/pages/messages";
import Playlists from "@/pages/playlists";
import Documents from "@/pages/documents";
import WebsiteBuilder from "@/pages/website-builder";
import GuestWebsite from "@/pages/guest-website";
import PhotoGallery from "@/pages/photo-gallery";
import VendorAvailabilityCalendar from "@/pages/vendor-availability";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import VendorAnalytics from "@/pages/vendor-analytics";
import CoupleAnalytics from "@/pages/couple-analytics";
import Invitations from "@/pages/invitations";
import Checkout from "@/pages/checkout";
import OrderConfirmation from "@/pages/order-confirmation";
import RsvpPortal from "@/pages/rsvp-portal";
import Shopping from "@/pages/shopping";
import CulturalInfo from "@/pages/cultural-info";
import RitualControl from "@/pages/ritual-control";
import GuestLiveFeed from "@/pages/guest-live-feed";
import Collaborators from "@/pages/collaborators";
import VendorCalendar from "@/pages/vendor-calendar";
import VendorDeposit from "@/pages/vendor-deposit";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/rsvp/:token" component={RsvpPortal} />
      <Route path="/live/:weddingId" component={GuestLiveFeed} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/login" component={Login} />
      <Route path="/vendor-login" component={VendorLogin} />
      <Route path="/vendor-register" component={VendorRegister} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/wedding/:slug" component={GuestWebsite} />
      <Route path="/cultural-info" component={CulturalInfo} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation" component={OrderConfirmation} />
      <Route path="/pay-deposit/:bookingId" component={VendorDeposit} />
      
      {/* Dashboard - no specific permission, just authentication */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/vendor-dashboard" component={VendorDashboard} />
      <Route path="/couple-analytics" component={CoupleAnalytics} />
      <Route path="/vendor-analytics" component={VendorAnalytics} />
      
      {/* Protected routes with permission checks */}
      <Route path="/guests">
        <ProtectedRoute requiredPermission="guests">
          <Guests />
        </ProtectedRoute>
      </Route>
      <Route path="/invitations">
        <ProtectedRoute requiredPermission="invitations">
          <Invitations />
        </ProtectedRoute>
      </Route>
      <Route path="/vendors">
        <ProtectedRoute requiredPermission="vendors">
          <Vendors />
        </ProtectedRoute>
      </Route>
      <Route path="/vendor-availability">
        <ProtectedRoute requiredPermission="vendors">
          <VendorAvailabilityCalendar />
        </ProtectedRoute>
      </Route>
      <Route path="/tasks">
        <ProtectedRoute requiredPermission="tasks">
          <Tasks />
        </ProtectedRoute>
      </Route>
      <Route path="/timeline">
        <ProtectedRoute requiredPermission="timeline">
          <Timeline />
        </ProtectedRoute>
      </Route>
      <Route path="/budget">
        <ProtectedRoute requiredPermission="budget">
          <Budget />
        </ProtectedRoute>
      </Route>
      <Route path="/budget-intelligence">
        <ProtectedRoute requiredPermission="budget">
          <BudgetIntelligence />
        </ProtectedRoute>
      </Route>
      <Route path="/contracts">
        <ProtectedRoute requiredPermission="contracts">
          <Contracts />
        </ProtectedRoute>
      </Route>
      <Route path="/messages" component={Messages} />
      <Route path="/playlists">
        <ProtectedRoute requiredPermission="playlists">
          <Playlists />
        </ProtectedRoute>
      </Route>
      <Route path="/documents">
        <ProtectedRoute requiredPermission="documents">
          <Documents />
        </ProtectedRoute>
      </Route>
      <Route path="/website-builder">
        <ProtectedRoute requiredPermission="website">
          <WebsiteBuilder />
        </ProtectedRoute>
      </Route>
      <Route path="/photo-gallery">
        <ProtectedRoute requiredPermission="photos">
          <PhotoGallery />
        </ProtectedRoute>
      </Route>
      <Route path="/shopping">
        <ProtectedRoute requiredPermission="shopping">
          <Shopping />
        </ProtectedRoute>
      </Route>
      <Route path="/ritual-control">
        <ProtectedRoute requiredPermission="concierge">
          <RitualControl />
        </ProtectedRoute>
      </Route>
      <Route path="/collaborators">
        <ProtectedRoute requiredPermission="collaborators">
          <Collaborators />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute requiredPermission="settings">
          <Settings />
        </ProtectedRoute>
      </Route>
      
      {/* Vendor calendar integration */}
      <Route path="/vendor-calendar" component={VendorCalendar} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  
  // Redirect authenticated users from landing page to dashboard
  useEffect(() => {
    if (!isLoading && user && location === "/") {
      const dashboardPath = user.role === "vendor" ? "/vendor-dashboard" : "/dashboard";
      setLocation(dashboardPath);
    }
  }, [user, isLoading, location, setLocation]);
  
  // Don't show header on onboarding, auth pages, or guest website pages
  const authPages = [
    "/", 
    "/onboarding", 
    "/login", 
    "/vendor-login", 
    "/vendor-register", 
    "/verify-email", 
    "/forgot-password", 
    "/reset-password"
  ];
  
  // Hide header on auth pages, guest websites, and vendors page when not authenticated
  const hideHeader = authPages.includes(location) || 
                     location.startsWith("/wedding/") ||
                     (location === "/vendors" && !user);
  
  return (
    <div className="min-h-screen bg-background">
      {!hideHeader && <AppHeader />}
      <Router />
      <FloatingChecklist />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PermissionsProvider>
          <TooltipProvider>
            <Toaster />
            <AppLayout />
          </TooltipProvider>
        </PermissionsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
