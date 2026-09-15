import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Páginas do FlowPromos
import Home from "./pages/Home";
import WhatsAppPage from "./pages/WhatsAppPage";
import GroupsPage from "./pages/GroupsPage";
import OffersPage from "./pages/OffersPage";
import PlansPage from "./pages/PlansPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import SegmentsPage from "./pages/SegmentsPage";
import CouponsPage from "./pages/CouponsPage";
import DispatchesPage from "./pages/DispatchesPage";
import BillingPage from "./pages/BillingPage";
import TutorialPage from "./pages/TutorialPage";
import MonitoringPage from "./pages/MonitoringPage";
import MessagesTemplatesPage from "./pages/MessagesTemplatesPage";
import SalesPage from "./pages/SalesPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/vendas" component={SalesPage} />
      <Route path="/whatsapp" component={WhatsAppPage} />
      <Route path="/grupos" component={GroupsPage} />
      <Route path="/ofertas" component={OffersPage} />
      <Route path="/segmentos" component={SegmentsPage} />
      <Route path="/cupons" component={CouponsPage} />
      <Route path="/disparos" component={DispatchesPage} />
      <Route path="/mensagens" component={MessagesTemplatesPage} />
      <Route path="/monitoramento" component={MonitoringPage} />
      <Route path="/tutorial" component={TutorialPage} />
      <Route path="/integracoes" component={IntegrationsPage} />
      <Route path="/faturamento" component={BillingPage} />
      <Route path="/planos" component={PlansPage} />
      <Route path="/checkout/success" component={CheckoutSuccessPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/404" component={NotFound} />
      {/* Fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
