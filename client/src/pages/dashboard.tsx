import { useState, useEffect } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { MarketPrice, BuyerDemand, ProduceLot, AgriOffer, AgriTransaction } from "@shared/schema";
import { FarmerRoleView } from "@/components/roles/FarmerRoleView";
import { FpoRoleView } from "@/components/roles/FpoRoleView";
import { BuyerRoleView } from "@/components/roles/BuyerRoleView";
import { LogisticsRoleView } from "@/components/roles/LogisticsRoleView";
import { AdminRoleView } from "@/components/roles/AdminRoleView";
import { 
  Sprout, 
  Users, 
  Building2, 
  Truck, 
  ShieldCheck, 
  RefreshCw,
  Sparkles,
  Check
} from "lucide-react";
import toast from "react-hot-toast";

type PlatformRole = "farmer" | "fpo" | "buyer" | "logistics" | "admin";

const ROLE_DEFINITIONS: {
  id: PlatformRole;
  label: string;
  badge: string;
  icon: any;
  color: string;
  activeClass: string;
  description: string;
}[] = [
  {
    id: "farmer",
    label: "Farmer",
    badge: "🌱 Producer",
    icon: Sprout,
    color: "text-emerald-600",
    activeClass: "bg-emerald-600 text-white shadow-sm border-emerald-600",
    description: "Live APMC prices, AI selling windows, produce lots, incoming buyer bids & bank settlements",
  },
  {
    id: "fpo",
    label: "FPO Hub",
    badge: "👥 Collective",
    icon: Users,
    color: "text-indigo-600",
    activeClass: "bg-indigo-600 text-white shadow-sm border-indigo-600",
    description: "Member farmer roster, bulk harvest pooling engine, commercial lots & realization payouts",
  },
  {
    id: "buyer",
    label: "Buyer / Processor",
    badge: "🏢 Procurement",
    icon: Building2,
    color: "text-blue-600",
    activeClass: "bg-blue-600 text-white shadow-sm border-blue-600",
    description: "Post procurement requirements, bid on matched farm lots, track shipments & submit UTR payments",
  },
  {
    id: "logistics",
    label: "Logistics Provider",
    badge: "🚚 Transport",
    icon: Truck,
    color: "text-cyan-600",
    activeClass: "bg-cyan-600 text-white shadow-sm border-cyan-600",
    description: "Fleet rate cards, dispatch & transit milestones, and cold storage capacity management",
  },
  {
    id: "admin",
    label: "Platform Admin",
    badge: "🛡️ Oversight",
    icon: ShieldCheck,
    color: "text-rose-600",
    activeClass: "bg-rose-600 text-white shadow-sm border-rose-600",
    description: "Trade dispute arbitration, buyer GSTIN/FSSAI verification, APMC price streams & system metrics",
  },
];

export default function Dashboard() {
  const { user, loading } = useAuth();

  const userRole = (user?.role || "farmer").toLowerCase();
  const activeRole: PlatformRole = 
    userRole === "fpo" ? "fpo" :
    (userRole === "buyer" || userRole === "distributor" || userRole === "retailer") ? "buyer" :
    userRole === "logistics" ? "logistics" :
    userRole === "admin" ? "admin" :
    "farmer";

  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [buyerDemands, setBuyerDemands] = useState<BuyerDemand[]>([]);
  const [lots, setLots] = useState<ProduceLot[]>([]);
  const [offers, setOffers] = useState<AgriOffer[]>([]);
  const [transactions, setTransactions] = useState<AgriTransaction[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, activeRole]);

  const fetchDashboardData = async () => {
    setDataLoading(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const authHeaders: any = {
        Authorization: `Bearer ${token}`,
        "firebase-uid": user?.id || "",
        "x-user-role": activeRole,
      };

      // Strict role-scoped data endpoints:
      const lotsUrl = activeRole === "buyer"
        ? "/api/produce-lots?status=Available"
        : activeRole === "admin"
        ? "/api/produce-lots"
        : `/api/produce-lots?sellerId=${user?.id || ""}`;

      const offersUrl = (activeRole === "farmer" || activeRole === "fpo")
        ? `/api/agri-offers?sellerId=${user?.id || ""}`
        : activeRole === "buyer"
        ? `/api/agri-offers?buyerId=${user?.id || ""}`
        : "/api/agri-offers";

      const txnsUrl = activeRole === "admin"
        ? "/api/agri-transactions"
        : `/api/agri-transactions?userId=${user?.id || ""}&role=${activeRole}`;

      const demandsUrl = activeRole === "buyer"
        ? `/api/buyer-demands?buyerId=${user?.id || ""}`
        : "/api/buyer-demands";

      const [pricesRes, demandsRes, lotsRes, offersRes, txnsRes] = await Promise.all([
        fetch("/api/market-prices", { headers: authHeaders }),
        fetch(demandsUrl, { headers: authHeaders }),
        fetch(lotsUrl, { headers: authHeaders }),
        fetch(offersUrl, { headers: authHeaders }),
        fetch(txnsUrl, { headers: authHeaders }),
      ]);

      if (pricesRes.ok) setMarketPrices(await pricesRes.json());
      if (demandsRes.ok) setBuyerDemands(await demandsRes.json());
      if (lotsRes.ok) setLots(await lotsRes.json());
      if (offersRes.ok) setOffers(await offersRes.json());
      if (txnsRes.ok) setTransactions(await txnsRes.json());
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    } finally {
      setDataLoading(false);
    }
  };

  const currentRoleMeta = ROLE_DEFINITIONS.find(r => r.id === activeRole) || ROLE_DEFINITIONS[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavigationHeader />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center text-muted-foreground">
          Loading AgriLink Dashboard...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <NavigationHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-3xl font-black text-foreground tracking-tight">
                Welcome, {user?.name || "AgriLink Member"}
              </h1>
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
                {currentRoleMeta.badge}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize font-medium">
                Role: {currentRoleMeta.label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {currentRoleMeta.description}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={fetchDashboardData}
              disabled={dataLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Role-Specific Dashboard View (Strictly locked to user's assigned role) */}
        {activeRole === "farmer" && (
          <FarmerRoleView
            user={user}
            marketPrices={marketPrices}
            lots={lots}
            offers={offers}
            transactions={transactions}
            onRefresh={fetchDashboardData}
          />
        )}

        {activeRole === "fpo" && (
          <FpoRoleView
            user={user}
            lots={lots}
            buyerDemands={buyerDemands}
            transactions={transactions}
            onRefresh={fetchDashboardData}
          />
        )}

        {activeRole === "buyer" && (
          <BuyerRoleView
            user={user}
            demands={buyerDemands}
            lots={lots}
            offers={offers}
            transactions={transactions}
            onRefresh={fetchDashboardData}
          />
        )}

        {activeRole === "logistics" && (
          <LogisticsRoleView
            user={user}
            transactions={transactions}
            onRefresh={fetchDashboardData}
          />
        )}

        {activeRole === "admin" && (
          <AdminRoleView
            user={user}
            marketPrices={marketPrices}
            transactions={transactions}
            onRefresh={fetchDashboardData}
          />
        )}
      </main>
    </div>
  );
}
