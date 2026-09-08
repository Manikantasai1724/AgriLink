import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { Route, Switch } from "wouter";
import { Footer } from "@/components/Footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import about from "@/pages/about";
import Contact from "@/pages/contact";
import Dashboard from "@/pages/dashboard";
import HowItWorks from "@/pages/HowItWorks";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import ProductDetails from "@/pages/product-details";
import ProductRegistration from "@/pages/product-registration";
import ProfilePage from "@/pages/profile";
import QRScannerPage from "@/pages/qr-scanner";
import RegisteredProductsPage from "@/pages/registered-products";
import RequestProductsPage from "@/pages/request-products";
import ScannedProductsPage from "@/pages/scanned-products";
import AdminPage from "@/pages/admin";
import MarketIntelligencePage from "@/pages/market-intelligence";
import BuyerDemandPage from "@/pages/buyer-demand";
import VerifiedBuyersPage from "@/pages/verified-buyers";
import CreateLotPage from "@/pages/create-lot";
import OffersMatchesPage from "@/pages/offers-matches";
import TransactionsPage from "@/pages/transactions";
import LogisticsStoragePage from "@/pages/logistics-storage";
import PaymentsPage from "@/pages/payments";
import DisputesPage from "@/pages/disputes";
import FpoAggregationPage from "@/pages/fpo-aggregation";
import { LanguageProvider } from "@/hooks/useLanguage";
import { queryClient } from "./lib/queryClient";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "linear-gradient(135deg, var(--verified), var(--primary))",
                color: "#fff",
                fontWeight: "bold",
                borderRadius: "0.5rem",
                padding: "12px 16px",
              },
              duration: 2000,
            }}
          />
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow flex flex-col relative">
              <Switch>
                <Route path="/" component={LandingPage} />
                <Route path="/contact" component={Contact} />
                <Route path="/about" component={about} />
                <Route path="/howitworks" component={HowItWorks} />
                <Route path="/how-it-works" component={HowItWorks} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/market-intelligence" component={MarketIntelligencePage} />
                <Route path="/buyer-demand" component={BuyerDemandPage} />
                <Route path="/verified-buyers" component={VerifiedBuyersPage} />
                <Route path="/create-lot" component={CreateLotPage} />
                <Route path="/offers-matches" component={OffersMatchesPage} />
                <Route path="/transactions" component={TransactionsPage} />
                <Route path="/logistics-storage" component={LogisticsStoragePage} />
                <Route path="/payments" component={PaymentsPage} />
                <Route path="/disputes" component={DisputesPage} />
                <Route path="/fpo-aggregation" component={FpoAggregationPage} />
                <Route path="/admin" component={AdminPage} />
                <Route path="/product-registration" component={ProductRegistration} />
                <Route path="/qr-scanner" component={QRScannerPage} />
                <Route path="/product/:id" component={ProductDetails} />
                <Route path="/profile" component={ProfilePage} />
                <Route path="/login" component={LoginPage} />
                <Route path="/registered-products" component={RegisteredProductsPage} />
                <Route path="/scanned-products" component={ScannedProductsPage} />
                <Route path="/request-products" component={RequestProductsPage} />
                <Route component={NotFound} />
              </Switch>
            </main>
            <Footer />
          </div>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
