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
import ScenarioPlanner from "@/pages/scenario-planner";
import FinancialDashboard from "@/pages/financial-dashboard";
import Contracts from "@/pages/contracts";
import VendorDashboard from "@/pages/vendor-dashboard";
import Messages from "@/pages/messages";
import Playlists from "@/pages/playlists";
import Documents from "@/pages/documents";
import WebsiteBuilder from "@/pages/website-builder";
import GuestWebsite from "@/pages/guest-website";
import VendorAvailabilityCalendar from "@/pages/vendor-availability";
import Settings from "@/pages/settings";
import Landing from "@/pages/landing";
import VendorAnalytics from "@/pages/vendor-analytics";
import CoupleAnalytics from "@/pages/couple-analytics";
import Checkout from "@/pages/checkout";
import OrderConfirmation from "@/pages/order-confirmation";
import RsvpPortal from "@/pages/rsvp-portal";
import Shopping from "@/pages/shopping";
import CulturalInfo from "@/pages/cultural-info";
import GuestLiveFeed from "@/pages/guest-live-feed";
import Collaborators from "@/pages/collaborators";
import VendorCalendar from "@/pages/vendor-calendar";
import VendorBookings from "@/pages/vendor-bookings";
import VendorContracts from "@/pages/vendor-contracts";
import VendorPackages from "@/pages/vendor-packages";
import VendorDeposit from "@/pages/vendor-deposit";
import VendorTemplates from "@/pages/vendor-templates";
import VendorReminders from "@/pages/vendor-reminders";
import ClaimProfile from "@/pages/claim-profile";
import ClaimYourBusiness from "@/pages/claim-your-business";
import AdminVendorClaims from "@/pages/admin-vendor-claims";
import AdminCeremonyTemplates from "@/pages/admin-ceremony-templates";
import AdminBudgetBucketCategories from "@/pages/admin-budget-bucket-categories";
import AiPlanner from "@/pages/ai-planner";
import SpeechGenerator from "@/pages/speech-generator";
import LiveTimeline from "@/pages/live-timeline";
import VendorTeam from "@/pages/vendor-team";
import VendorInviteAccept from "@/pages/vendor-invite-accept";
import VendorProfile from "@/pages/vendor-profile";
import VendorPortfolio from "@/pages/vendor-portfolio";
import VendorLeads from "@/pages/vendor-leads";
import Expenses from "@/pages/expenses";
import GuestCollector from "@/pages/guest-collector";
import CommunicationHub from "@/pages/communication-hub";
import EngagementGames from "@/pages/engagement-games";
import GamePortal from "@/pages/game-portal";
import RitualRoles from "@/pages/ritual-roles";
import MilniPage from "@/pages/milni";
import DecorPage from "@/pages/decor";
import DayOfTimelinePage from "@/pages/day-of-timeline";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import AcceptableUse from "@/pages/acceptable-use";
import HoneymoonPlannerPage from "@/pages/honeymoon-planner";
import FavoursPage from "@/pages/favours";
import VendorAccessPasses from "@/pages/vendor-access-passes";
import VendorTimeline from "@/pages/vendor-timeline";
import BudgetEstimatorPage from "@/pages/budget-estimator";
import BudgetDistribution from "@/pages/budget-distribution";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import { VendorRoute } from "@/components/VendorRoute";
import { CoupleRoute } from "@/components/CoupleRoute";
import { CouplePlannerChatbot } from "@/components/CouplePlannerChatbot";

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
      <Route path="/claim-profile/:token" component={ClaimProfile} />
      <Route path="/claim-your-business" component={ClaimYourBusiness} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/wedding/:slug" component={GuestWebsite} />
      <Route path="/cultural-info" component={CulturalInfo} />
      <Route path="/terms-of-service" component={TermsOfService} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/acceptable-use" component={AcceptableUse} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation" component={OrderConfirmation} />
      <Route path="/pay-deposit/:bookingId" component={VendorDeposit} />
      <Route path="/collect/:token" component={GuestCollector} />
      <Route path="/games/:token" component={GamePortal} />
      <Route path="/vendor-timeline/:token" component={VendorTimeline} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      
      {/* Dashboard - no specific permission, just authentication */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/vendor-dashboard">
        <VendorRoute>
          <VendorDashboard />
        </VendorRoute>
      </Route>
      <Route path="/vendor-templates">
        <VendorRoute>
          <VendorTemplates />
        </VendorRoute>
      </Route>
      <Route path="/vendor-reminders">
        <VendorRoute>
          <VendorReminders />
        </VendorRoute>
      </Route>
      <Route path="/couple-analytics" component={CoupleAnalytics} />
      <Route path="/vendor-analytics">
        <VendorRoute>
          <VendorAnalytics />
        </VendorRoute>
      </Route>
      
      {/* Protected routes with permission checks */}
      <Route path="/guests">
        <ProtectedRoute requiredPermission="guests">
          <Guests />
        </ProtectedRoute>
      </Route>
      <Route path="/communication-hub">
        <ProtectedRoute requiredPermission="guests">
          <CommunicationHub />
        </ProtectedRoute>
      </Route>
      <Route path="/engagement-games">
        <ProtectedRoute requiredPermission="guests">
          <EngagementGames />
        </ProtectedRoute>
      </Route>
      <Route path="/ritual-roles">
        <ProtectedRoute requiredPermission="guests">
          <RitualRoles />
        </ProtectedRoute>
      </Route>
      <Route path="/milni">
        <ProtectedRoute requiredPermission="guests">
          <MilniPage />
        </ProtectedRoute>
      </Route>
      <Route path="/decor">
        <ProtectedRoute requiredPermission="shopping">
          <DecorPage />
        </ProtectedRoute>
      </Route>
      <Route path="/vendor-collaboration">
        <ProtectedRoute requiredPermission="vendors">
          <VendorAccessPasses />
        </ProtectedRoute>
      </Route>
      {/* Vendor marketplace is publicly accessible */}
      <Route path="/vendors" component={Vendors} />
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
      <Route path="/live-timeline">
        <ProtectedRoute requiredPermission="timeline">
          <LiveTimeline />
        </ProtectedRoute>
      </Route>
      <Route path="/day-of-timeline">
        <ProtectedRoute requiredPermission="timeline">
          <DayOfTimelinePage />
        </ProtectedRoute>
      </Route>
      <Route path="/honeymoon">
        <ProtectedRoute requiredPermission="planning">
          <HoneymoonPlannerPage />
        </ProtectedRoute>
      </Route>
      <Route path="/favours">
        <ProtectedRoute requiredPermission="planning">
          <FavoursPage />
        </ProtectedRoute>
      </Route>
      <Route path="/budget">
        <ProtectedRoute requiredPermission="budget">
          <Budget />
        </ProtectedRoute>
      </Route>
      <Route path="/budget-estimator">
        <ProtectedRoute requiredPermission="budget">
          <BudgetEstimatorPage />
        </ProtectedRoute>
      </Route>
      <Route path="/budget-distribution">
        <ProtectedRoute requiredPermission="budget">
          <BudgetDistribution />
        </ProtectedRoute>
      </Route>
      <Route path="/budget-intelligence">
        <ProtectedRoute requiredPermission="budget">
          <BudgetIntelligence />
        </ProtectedRoute>
      </Route>
      <Route path="/scenario-planner">
        <ProtectedRoute requiredPermission="budget">
          <ScenarioPlanner />
        </ProtectedRoute>
      </Route>
      <Route path="/financial-dashboard">
        <ProtectedRoute requiredPermission="budget">
          <FinancialDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/expenses">
        <ProtectedRoute requiredPermission="budget">
          <Expenses />
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
      <Route path="/shopping">
        <ProtectedRoute requiredPermission="shopping">
          <Shopping />
        </ProtectedRoute>
      </Route>
      <Route path="/collaborators">
        <ProtectedRoute requiredPermission="collaborators">
          <Collaborators />
        </ProtectedRoute>
      </Route>
      <Route path="/ai-planner">
        <CoupleRoute>
          <AiPlanner />
        </CoupleRoute>
      </Route>
      <Route path="/speech-generator">
        <CoupleRoute>
          <SpeechGenerator />
        </CoupleRoute>
      </Route>
      <Route path="/admin/vendor-claims">
        <CoupleRoute>
          <AdminVendorClaims />
        </CoupleRoute>
      </Route>
      <Route path="/admin/ceremony-templates" component={AdminCeremonyTemplates} />
      <Route path="/admin/budget-bucket-categories" component={AdminBudgetBucketCategories} />
      <Route path="/settings" component={Settings} />
      
      {/* Vendor pages */}
      <Route path="/vendor-calendar">
        <VendorRoute>
          <VendorCalendar />
        </VendorRoute>
      </Route>
      <Route path="/vendor-bookings">
        <VendorRoute>
          <VendorBookings />
        </VendorRoute>
      </Route>
      <Route path="/vendor-contracts">
        <VendorRoute>
          <VendorContracts />
        </VendorRoute>
      </Route>
      <Route path="/vendor-packages">
        <VendorRoute>
          <VendorPackages />
        </VendorRoute>
      </Route>
      <Route path="/vendor-team">
        <VendorRoute>
          <VendorTeam />
        </VendorRoute>
      </Route>
      <Route path="/vendor-leads">
        <VendorRoute>
          <VendorLeads />
        </VendorRoute>
      </Route>
      <Route path="/vendor-profile">
        <VendorRoute>
          <VendorProfile />
        </VendorRoute>
      </Route>
      <Route path="/vendor-portfolio">
        <VendorRoute>
          <VendorPortfolio />
        </VendorRoute>
      </Route>
      <Route path="/vendor-invite" component={VendorInviteAccept} />
      
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
  
  // Hide header on auth pages, guest websites, and vendor pages (vendors have their own header)
  // Note: /vendor-collaboration and /vendor-timeline are couple pages, not vendor pages
  const vendorPortalPages = ["/vendor-dashboard", "/vendor-leads", "/vendor-messages", "/vendor-calendar", "/vendor-analytics", "/vendor-profile", "/vendor-portfolio", "/vendor-login", "/vendor-register", "/vendor-invite"];
  const isVendorPage = vendorPortalPages.some(page => location.startsWith(page));
  // Hide header on /vendors page for non-logged-in users (they see logo-only header from vendors.tsx)
  const isPublicVendorsPage = location === "/vendors" && !user;
  // Hide header on collector pages (guest contributors shouldn't see app navigation)
  const isCollectorPage = location.startsWith("/collect/");
  const hideHeader = authPages.includes(location) || 
                     location.startsWith("/wedding/") ||
                     isVendorPage ||
                     isPublicVendorsPage ||
                     isCollectorPage;
  
  // Show bottom nav on mobile for authenticated users (not on auth pages or vendor pages)
  const showBottomNav = user && !hideHeader && !isVendorPage;
  
  // Show AI planner chatbot for couple users on protected pages
  const showAiChatbot = user && 
                        user.role === "couple" && 
                        !authPages.includes(location) && 
                        !location.startsWith("/wedding/") &&
                        !location.startsWith("/rsvp/") &&
                        !location.startsWith("/live/") &&
                        location !== "/ai-planner";
  
  return (
    <div className={`min-h-screen bg-background ${showBottomNav ? 'pb-20 lg:pb-0' : ''}`}>
      {!hideHeader && <AppHeader />}
      <Router />
      {showAiChatbot && <CouplePlannerChatbot />}
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
