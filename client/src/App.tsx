import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/auth-store";

import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AddPerson from "@/pages/add";
import PersonDetails from "@/pages/details";
import EditPerson from "@/pages/edit";
import AuthPage from "@/pages/auth";

// Protected Route Wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isInitialized } = useAuthStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isInitialized && !user) {
      setLocation("/auth");
    }
  }, [user, isInitialized, setLocation]);

  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return <Component />;
}

function Router() {
  const { checkAuth, isInitialized } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isInitialized) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <Route path="/">
        <ProtectedRoute component={Home} />
      </Route>
      
      <Route path="/add">
        <ProtectedRoute component={AddPerson} />
      </Route>
      
      <Route path="/person/:id">
        {(params) => <ProtectedRoute component={() => <PersonDetails />} />}
      </Route>
      
      <Route path="/edit/:id">
        {(params) => <ProtectedRoute component={() => <EditPerson />} />}
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
