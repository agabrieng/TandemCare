import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
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
  
  // Custom sidebar width for finance application
  const style = {
    "--sidebar-width": "16rem",     // 256px for better navigation
    "--sidebar-width-icon": "4rem", // default icon width
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Router isAuthenticated={isAuthenticated} />
      </div>
    );
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-border">
          <div className="flex items-center justify-between w-full gap-2 px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" data-testid="button-sidebar-toggle" />
              <div className="h-4 w-px bg-sidebar-border hidden md:block" />
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="hidden sm:inline">Tandem</span>
                <span className="sm:hidden">Tandem</span>
              </div>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          <Router isAuthenticated={isAuthenticated} />
        </div>
      </SidebarInset>
    </SidebarProvider>
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
