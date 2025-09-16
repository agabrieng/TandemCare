import { Switch, Route, Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Children from "@/pages/children";
import Parents from "@/pages/parents";
import Expenses from "@/pages/expenses";
import Receipts from "@/pages/receipts";
import Reports from "@/pages/reports";
import LegalData from "@/pages/legal-data";
import Settings from "@/pages/settings";
import Categories from "@/pages/categories";
import NotFound from "@/pages/not-found";

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ProgressIndicator 
          progress={75} 
          message="Carregando aplicação..." 
          showPercentage={true}
          className="max-w-md"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Switch>
          <Route path="/" component={Landing} />
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </div>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/children" component={Children} />
        <Route path="/parents" component={Parents} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/receipts" component={Receipts} />
        <Route path="/comprovantes">
          <Redirect to="/receipts" />
        </Route>
        <Route path="/reports" component={Reports} />
        <Route path="/legal-data" component={LegalData} />
        <Route path="/settings" component={Settings} />
        <Route path="/categories" component={Categories} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default App;
