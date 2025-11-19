import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Vendors from "@/pages/vendors";
import Guests from "@/pages/guests";
import Tasks from "@/pages/tasks";
import Timeline from "@/pages/timeline";
import Budget from "@/pages/budget";
import Contracts from "@/pages/contracts";
import VendorDashboard from "@/pages/vendor-dashboard";
import Messages from "@/pages/messages";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Onboarding} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/vendors" component={Vendors} />
      <Route path="/guests" component={Guests} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/budget" component={Budget} />
      <Route path="/contracts" component={Contracts} />
      <Route path="/vendor-dashboard" component={VendorDashboard} />
      <Route path="/messages" component={Messages} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
