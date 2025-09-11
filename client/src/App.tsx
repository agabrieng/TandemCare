import React, { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ModernSidebar } from "@/components/modern-sidebar";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Children from "@/pages/children";
import Expenses from "@/pages/expenses";
import Receipts from "@/pages/receipts";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";

function Router({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/children" component={Children} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/receipts" component={Receipts} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Add loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show landing page when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Router isAuthenticated={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <ModernSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto">
          <Router isAuthenticated={isAuthenticated} />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthenticatedApp />
      <PWAInstallPrompt />
      <OfflineIndicator />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
