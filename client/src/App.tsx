import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/Navigation";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import DemoDashboard from "@/pages/DemoDashboard";
import Transactions from "@/pages/Transactions";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import Admin from "@/pages/Admin";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import Security from "@/pages/Security";
import About from "@/pages/About";
import AboutDesigner from "@/pages/AboutDesigner";
import Blog from "@/pages/Blog";
import Contact from "@/pages/Contact";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Disclaimer from "@/pages/Disclaimer";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader showAuth={false} />
      <div className="flex flex-1">
        <Navigation />
        <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Component />
        </main>
      </div>
      <AppFooter />
    </div>
  );
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (!user || !(user as any).isAdmin)) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user || !(user as any).isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-body">
      <AppHeader showAuth={false} />
      <div className="flex flex-1">
        <Navigation />
        <main className="flex-1 md:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Component />
        </main>
      </div>
      <AppFooter />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/home" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/features" component={Features} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/security" component={Security} />
      <Route path="/about" component={About} />
      <Route path="/about-designer" component={AboutDesigner} />
      <Route path="/blog" component={Blog} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/disclaimer" component={Disclaimer} />
      
      <Route path="/">
        <Home />
      </Route>
      <Route path="/transactions">
        <ProtectedRoute component={Transactions} />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute component={Analytics} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/dashboard" component={DemoDashboard} />
      <Route path="/dashboard-full">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/admin">
        <AdminRoute component={Admin} />
      </Route>

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
