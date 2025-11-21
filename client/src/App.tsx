import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { AppHeader } from "@/components/app-header";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/login" component={Login} />
      <Route path="/vendor-login" component={VendorLogin} />
      <Route path="/vendor-register" component={VendorRegister} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/vendors" component={Vendors} />
      <Route path="/guests" component={Guests} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/budget" component={Budget} />
      <Route path="/budget-intelligence" component={BudgetIntelligence} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/vendor-dashboard" component={VendorDashboard} />
      <Route path="/messages" component={Messages} />
      <Route path="/playlists" component={Playlists} />
      <Route path="/documents" component={Documents} />
      <Route path="/website-builder" component={WebsiteBuilder} />
      <Route path="/photo-gallery" component={PhotoGallery} />
      <Route path="/vendor-availability" component={VendorAvailabilityCalendar} />
      <Route path="/vendor-analytics" component={VendorAnalytics} />
      <Route path="/couple-analytics" component={CoupleAnalytics} />
      <Route path="/invitations" component={Invitations} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation" component={OrderConfirmation} />
      <Route path="/settings" component={Settings} />
      <Route path="/wedding/:slug" component={GuestWebsite} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const [location] = useLocation();
  
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
  const hideHeader = authPages.includes(location) || location.startsWith("/wedding/");
  
  return (
    <div className="min-h-screen bg-background">
      {!hideHeader && <AppHeader />}
      <Router />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppLayout />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
