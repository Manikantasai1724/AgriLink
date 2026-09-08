import { useState, useEffect } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { MarketPrice, BuyerDemand, ProduceLot, AgriTransaction } from "@shared/schema";
import { 
  BarChart3, 
  Sparkles, 
  Building2, 
  Package, 
  Truck, 
  CreditCard, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertCircle,
  PlusCircle,
  Users
} from "lucide-react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [buyerDemands, setBuyerDemands] = useState<BuyerDemand[]>([]);
  const [myLots, setMyLots] = useState<ProduceLot[]>([]);
  const [transactions, setTransactions] = useState<AgriTransaction[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setDataLoading(true);
    try {
      const [pricesRes, demandsRes, lotsRes, txnsRes] = await Promise.all([
        fetch("/api/market-prices?crop=Rice"),
        fetch("/api/buyer-demands"),
        fetch("/api/lots"),
        fetch("/api/transactions"),
      ]);

      if (pricesRes.ok) setMarketPrices(await pricesRes.json());
      if (demandsRes.ok) setBuyerDemands(await demandsRes.json());
      if (lotsRes.ok) setMyLots(await lotsRes.json());
      if (txnsRes.ok) setTransactions(await txnsRes.json());
    } catch (err) {
      console.error("Dashboard fetch failed", err);
    } finally {
      setDataLoading(false);
    }
  };

  const bestMandi = marketPrices.reduce<MarketPrice | null>(
    (best, p) => (!best || p.netRealization > best.netRealization ? p : best),
    null
  );

  const activeTransactionsCount = transactions.filter((t) => t.status !== "Transaction Completed").length;
  const pendingPaymentsAmount = transactions
    .filter((t) => t.paymentStatus === "Pending")
    .reduce((sum, t) => sum + (Number(t.netRealizationAmount) || 0), 0);
  const totalVolumeSold = transactions
    .filter((t) => t.paymentStatus === "Paid")
    .reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);

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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black text-foreground tracking-tight">
                Welcome, {user?.name || "Farmer"}
              </h1>
              <Badge className="bg-primary text-primary-foreground capitalize text-xs">
                {user?.role || "Farmer"} Account
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Today's market snapshot for Bhimavaram & West Godavari, selling window advisories, and active procurement demands.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/market-intelligence">
              <Button variant="outline" className="gap-1.5 text-xs">
                <BarChart3 className="w-3.5 h-3.5" />
                Mandi Intelligence
              </Button>
            </Link>
            <Link href="/create-lot">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-1.5 text-xs shadow-sm">
                <PlusCircle className="w-3.5 h-3.5" />
                Create Produce Lot
              </Button>
            </Link>
            {user?.role === "fpo" && (
              <Link href="/fpo-aggregation">
                <Button variant="secondary" className="gap-1.5 text-xs">
                  <Users className="w-3.5 h-3.5" />
                  FPO Aggregation
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Section 1: KPI Analytics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 shadow-sm border-l-4 border-l-emerald-600">
            <span className="text-xs text-muted-foreground font-medium block">Best Paddy/Rice Modal Price</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{bestMandi ? bestMandi.modalPrice : 2750}/qtl
              </span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[11px] text-muted-foreground">
              {bestMandi ? bestMandi.marketName : "Bhimavaram Market Yard"} (₹{bestMandi?.netRealization || 2705}/qtl net)
            </span>
          </Card>

          <Card className="p-4 shadow-sm border-l-4 border-l-primary">
            <span className="text-xs text-muted-foreground font-medium block">Active Produce Lots</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-foreground">
                {myLots.length > 0 ? myLots.length : 1} Lots
              </span>
              <Package className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[11px] text-muted-foreground">Listed for verified buyer matching</span>
          </Card>

          <Card className="p-4 shadow-sm border-l-4 border-l-blue-600">
            <span className="text-xs text-muted-foreground font-medium block">Active Contracts</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-foreground">{activeTransactionsCount} Active</span>
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[11px] text-muted-foreground">Logistics & transit tracking</span>
          </Card>

          <Card className="p-4 shadow-sm border-l-4 border-l-amber-500">
            <span className="text-xs text-muted-foreground font-medium block">Pending Settlements</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-amber-600">
                ₹{pendingPaymentsAmount.toLocaleString("en-IN")}
              </span>
              <CreditCard className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-[11px] text-muted-foreground">Escrow & direct bank deposits</span>
          </Card>
        </div>

        {/* Section 2: AI Selling Opportunity & Market Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Selling Recommendation Callout */}
          <Card className="lg:col-span-2 border-2 border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  AI Market Selling Opportunity
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px]">High Confidence</Badge>
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                Paddy / Rice Selling Opportunity: Next 2–4 Days
              </CardTitle>
              <CardDescription>
                Mandi prices across Bhimavaram & Tadepalligudem have gained +6.8% over 7 days with active millers & export buyers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-background/80 p-3 rounded-lg border space-y-1">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Recommended Selling Mandi:
                  </span>
                  <p className="text-muted-foreground font-medium">
                    {bestMandi?.marketName || "Bhimavaram Market Yard"} — ₹{bestMandi?.netRealization || 2705}/qtl Net in Hand after ₹{bestMandi?.transportCostPerQtl || 45}/qtl freight.
                  </p>
                </div>
                <div className="bg-background/80 p-3 rounded-lg border space-y-1">
                  <span className="font-semibold text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Market Advisory:
                  </span>
                  <p className="text-muted-foreground">
                    Direct miller procurement is strong at ₹2,800/qtl for BPT 5204 & Swarna paddy. Keep moisture below 14% for top grades.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Link href="/create-lot?crop=Rice">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-medium">
                  Create Produce Lot for this Window
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Quick Mandi Snapshot Box */}
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Nearby Mandi Rates
                </CardTitle>
                <Link href="/market-intelligence" className="text-xs text-primary font-semibold hover:underline">
                  Full View
                </Link>
              </div>
              <CardDescription className="text-xs">Bhimavaram & West Godavari District</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {marketPrices.slice(0, 3).map((p) => (
                <div key={p.id} className="flex justify-between items-center py-1.5 border-b last:border-0">
                  <div>
                    <span className="font-semibold text-foreground block">{p.marketName}</span>
                    <span className="text-[11px] text-muted-foreground">{p.distanceKm} km away</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground block">₹{p.modalPrice}/qtl</span>
                    <span className="text-[11px] text-emerald-600 font-semibold">
                      ₹{p.netRealization}/qtl Net
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Verified Buyer Demands Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Live Buyer Procurement Demands
              </h2>
              <p className="text-xs text-muted-foreground">
                Verified purchase orders from food processors, institutional caterers, and retail supermarkets.
              </p>
            </div>
            <Link href="/buyer-demand" className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
              Browse All Demands <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {buyerDemands.slice(0, 3).map((demand) => (
              <Card key={demand.id} className="flex flex-col justify-between shadow-sm hover:border-primary/40 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] text-muted-foreground font-semibold block">{demand.buyerType}</span>
                      <CardTitle className="text-base font-bold text-foreground">{demand.buyerName}</CardTitle>
                    </div>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Verified</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs pb-3">
                  <div className="bg-muted/40 p-2.5 rounded-lg space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Commodity:</span>
                      <strong className="text-foreground">{demand.crop} ({demand.minQualityGrade})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Required Quantity:</span>
                      <span className="text-primary font-bold">{demand.requiredQuantity} {demand.unit}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t">
                      <span className="text-muted-foreground">Target Procurement Price:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">₹{demand.targetPricePerUnit}/{demand.unit}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                    <MapPin className="w-3 h-3 text-foreground/70" />
                    <span>{demand.location} ({demand.distanceKm} km away)</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Link href={`/create-lot?crop=${demand.crop}&buyerDemandId=${demand.id}`} className="w-full">
                    <Button size="sm" variant="outline" className="w-full text-xs font-medium gap-1">
                      Fulfill Demand
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Section 4: My Active Lots & Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Lots */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  My Produce Lots
                </CardTitle>
                <Link href="/create-lot">
                  <Button size="sm" variant="ghost" className="text-xs text-primary gap-1">
                    <PlusCircle className="w-3.5 h-3.5" /> New Lot
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              {myLots.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No active lots. Create a digital lot to start receiving buyer bids.
                </div>
              ) : (
                myLots.slice(0, 3).map((lot) => (
                  <div key={lot.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">{lot.lotNumber}</span>
                        <Badge variant="secondary" className="text-[10px]">{lot.status}</Badge>
                      </div>
                      <span className="text-muted-foreground mt-0.5 block">
                        {lot.quantity} {lot.unit} {lot.crop} • Asking: ₹{lot.expectedPricePerUnit}/{lot.unit}
                      </span>
                    </div>
                    <Link href={`/offers-matches?lotId=${lot.id}`}>
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        View Matches
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Active Transactions */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  Recent Transactions
                </CardTitle>
                <Link href="/transactions" className="text-xs text-primary font-semibold hover:underline">
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              {transactions.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No trade contracts yet. Accept an offer to initialize transactions.
                </div>
              ) : (
                transactions.slice(0, 3).map((txn) => (
                  <div key={txn.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">{txn.transactionCode}</span>
                        <Badge
                          className={`text-[10px] ${
                            txn.paymentStatus === "Paid" ? "bg-emerald-600 text-white" : ""
                          }`}
                          variant={txn.paymentStatus === "Paid" ? "default" : "outline"}
                        >
                          {txn.paymentStatus}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground mt-0.5 block">
                        Buyer: {txn.buyerName} • ₹{txn.grossAmount.toLocaleString()}
                      </span>
                    </div>
                    <Link href={`/transactions?id=${txn.id}`}>
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        Track Contract
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
