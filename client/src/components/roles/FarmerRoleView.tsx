import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  TrendingUp, 
  Package, 
  CreditCard, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  BarChart3, 
  Layers, 
  Check, 
  X, 
  Scale 
} from "lucide-react";
import { MarketPrice, ProduceLot, AgriOffer, AgriTransaction } from "@shared/schema";
import toast from "react-hot-toast";

interface FarmerRoleViewProps {
  user: any;
  marketPrices: MarketPrice[];
  lots: ProduceLot[];
  offers: AgriOffer[];
  transactions: AgriTransaction[];
  onRefresh: () => void;
}

export function FarmerRoleView({
  user,
  marketPrices,
  lots,
  offers,
  transactions,
  onRefresh,
}: FarmerRoleViewProps) {
  const [selectedOffer, setSelectedOffer] = useState<AgriOffer | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);

  const bestMandi = marketPrices.reduce<MarketPrice | null>(
    (best, p) => (!best || p.netRealization > best.netRealization ? p : best),
    null
  );

  const pendingOffers = offers.filter((o) => o.status === "Pending");
  const pendingSettlements = transactions
    .filter((t) => t.paymentStatus === "Pending")
    .reduce((sum, t) => sum + (Number(t.netRealizationAmount) || 0), 0);

  const handleOfferAction = async (offerId: string, status: "Accepted" | "Rejected" | "Countered", counter?: number) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch(`/api/agri-offers/${offerId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-role": "farmer",
        },
        body: JSON.stringify({ status, counterPrice: counter }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update offer");
      }

      if (status === "Accepted") {
        toast.success("Offer Accepted! Trade contract has been automatically generated.");
      } else if (status === "Countered") {
        toast.success(`Counter-offer of ₹${counter}/qtl submitted to buyer.`);
      } else {
        toast.success("Offer rejected.");
      }

      setSelectedOffer(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/market-intelligence" className="block focus:outline-none">
          <Card className="p-4 border-l-4 border-l-emerald-600 hover:shadow-md hover:border-emerald-500 transition-all hover:-translate-y-0.5 cursor-pointer group h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium block">Best Net APMC Price</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{bestMandi ? bestMandi.netRealization : 2725}/qtl
              </span>
              <TrendingUp className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[11px] text-muted-foreground">
              {bestMandi ? bestMandi.marketName : "Bhimavaram Market Yard"} (after ₹{bestMandi?.transportCostPerQtl || 25} freight)
            </span>
          </Card>
        </Link>

        <Link href="/create-lot" className="block focus:outline-none">
          <Card className="p-4 border-l-4 border-l-primary hover:shadow-md hover:border-primary transition-all hover:-translate-y-0.5 cursor-pointer group h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium block">My Produce Lots</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-foreground">
                {lots.length} Lots
              </span>
              <Package className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[11px] text-muted-foreground">
              {lots.filter(l => l.status === "Available").length} available for buyer bidding
            </span>
          </Card>
        </Link>

        <Link href="/offers-matches" className="block focus:outline-none">
          <Card className="p-4 border-l-4 border-l-amber-500 hover:shadow-md hover:border-amber-400 transition-all hover:-translate-y-0.5 cursor-pointer group h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium block">Incoming Buyer Bids</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {pendingOffers.length} Pending
              </span>
              <Layers className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[11px] text-muted-foreground">Direct purchase offers awaiting review</span>
          </Card>
        </Link>

        <Link href="/payments" className="block focus:outline-none">
          <Card className="p-4 border-l-4 border-l-blue-600 hover:shadow-md hover:border-blue-500 transition-all hover:-translate-y-0.5 cursor-pointer group h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium block">Settlement Receivables</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-foreground">
                ₹{pendingSettlements.toLocaleString("en-IN")}
              </span>
              <CreditCard className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[11px] text-muted-foreground">Direct bank transfer & escrow receipts</span>
          </Card>
        </Link>
      </div>

      {/* AI Harvest & Selling Advisory Callout */}
      <Card className="border-2 border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
              <Sparkles className="w-4 h-4 animate-pulse" />
              AI Harvest & Selling Opportunity
            </div>
            <Badge className="bg-emerald-600 text-white text-[10px]">Optimal Timing: Next 2–4 Days</Badge>
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Paddy / Rice Mandi Price Momentum: +6.8% in West Godavari
          </CardTitle>
          <CardDescription>
            Institutional buyers & export millers are actively procuring Grade A paddy at ₹2,800/qtl with low moisture requirements (&lt;14%).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-background/80 p-3 rounded-lg border space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Recommended Selling Hub:
              </span>
              <p className="text-muted-foreground font-medium">
                {bestMandi?.marketName || "Bhimavaram Market Yard"} — ₹{bestMandi?.netRealization || 2725}/qtl Net in Hand after transport deduction.
              </p>
            </div>
            <div className="bg-background/80 p-3 rounded-lg border space-y-1">
              <span className="font-semibold text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Harvest Advisory:
              </span>
              <p className="text-muted-foreground">
                Dry paddy batches to below 14% moisture before bagging. Grade A lots receive +₹150/qtl premium from direct processors.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex gap-2 flex-wrap">
          <Link href="/create-lot">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-medium">
              <PlusCircle className="w-3.5 h-3.5" />
              Register New Produce Lot
            </Button>
          </Link>
          <Link href="/market-intelligence">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5" />
              View APMC Price Charts
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Incoming Buyer Bids & Negotiation Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              Active Buyer Purchase Bids ({pendingOffers.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Review, accept, or counter commercial purchase bids submitted for your lots.
            </CardDescription>
          </div>
          <Link href="/offers-matches">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              View All Bids <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {pendingOffers.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">No pending bids right now</p>
              <p className="text-xs text-muted-foreground mt-1">
                When verified food processors and buyers place offers on your produce lots, they will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {pendingOffers.map((offer) => (
                <div key={offer.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{offer.crop}</span>
                      <Badge variant="outline" className="text-[10px]">Lot #{offer.lotNumber}</Badge>
                      <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 text-[10px]">
                        Pending Review
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Offered by: <span className="font-semibold text-foreground">{offer.buyerName}</span> ({offer.buyerType}) • Terms: {offer.deliveryTerms}
                    </p>
                    <div className="flex items-center gap-3 text-xs pt-1">
                      <span className="text-emerald-600 font-bold text-sm">₹{offer.offeredPrice}/qtl</span>
                      <span className="text-muted-foreground">Quantity: {offer.quantity} Quintals</span>
                      <span className="text-muted-foreground">Total: ₹{(offer.offeredPrice * offer.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs"
                      disabled={actionLoading}
                      onClick={() => handleOfferAction(offer.id, "Accepted")}
                    >
                      <Check className="w-3.5 h-3.5" /> Accept Bid
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs"
                      disabled={actionLoading}
                      onClick={() => {
                        setSelectedOffer(offer);
                        setCounterPrice(offer.offeredPrice + 100);
                      }}
                    >
                      <Scale className="w-3.5 h-3.5" /> Counter
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive text-xs"
                      disabled={actionLoading}
                      onClick={() => handleOfferAction(offer.id, "Rejected")}
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Farmer's Produce Lots */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              My Registered Produce Lots ({lots.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Digital produce lots open for buyer discovery and automated matching.
            </CardDescription>
          </div>
          <Link href="/create-lot">
            <Button size="sm" className="gap-1.5 text-xs">
              <PlusCircle className="w-3.5 h-3.5" /> + New Lot
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {lots.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-sm font-medium text-foreground">No produce lots registered yet</p>
              <Link href="/create-lot">
                <Button size="sm" className="mt-3 gap-1.5 text-xs">
                  <PlusCircle className="w-3.5 h-3.5" /> Register Your First Lot
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Lot Number</th>
                    <th className="px-4 py-3">Crop / Variety</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Expected Price</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lots.slice(0, 6).map((lot) => (
                    <tr key={lot.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono font-medium text-foreground">{lot.lotNumber}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground">{lot.crop}</span>
                        {lot.variety && <span className="text-muted-foreground ml-1">({lot.variety})</span>}
                      </td>
                      <td className="px-4 py-3">{lot.quantity} {lot.unit}</td>
                      <td className="px-4 py-3 font-bold text-foreground">₹{lot.expectedPricePerUnit}/qtl</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]">{lot.qualityGrade}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-[10px] ${
                          lot.status === "Available" ? "bg-emerald-600 text-white" :
                          lot.status === "Offer Accepted" ? "bg-blue-600 text-white" :
                          "bg-amber-500 text-white"
                        }`}>
                          {lot.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/offers-matches?lotId=${lot.id}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                            Matches <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Counter Offer Modal */}
      {selectedOffer && (
        <Dialog open={Boolean(selectedOffer)} onOpenChange={() => setSelectedOffer(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Counter-Offer</DialogTitle>
              <DialogDescription>
                Propose a new price per quintal to {selectedOffer.buyerName} for Lot #{selectedOffer.lotNumber}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="bg-muted/50 p-3 rounded-md text-xs space-y-1">
                <div>Original Buyer Bid: <strong className="text-foreground">₹{selectedOffer.offeredPrice}/qtl</strong></div>
                <div>Quantity: <strong className="text-foreground">{selectedOffer.quantity} Quintals</strong></div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Your Proposed Price (₹ / Quintal):</label>
                <Input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(Number(e.target.value))}
                  className="font-bold text-lg"
                  min={100}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedOffer(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleOfferAction(selectedOffer.id, "Countered", counterPrice)}
                disabled={actionLoading}
              >
                Send Counter-Offer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
