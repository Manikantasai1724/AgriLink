import { useState, useEffect } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ProduceLot, AgriOffer, BuyerMatchResult } from "@shared/schema";
import { 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  ArrowRight, 
  Star, 
  Truck, 
  Package, 
  ShieldCheck, 
  TrendingUp, 
  Clock,
  Send,
  XCircle
} from "lucide-react";

export default function OffersMatchesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // Parse query params (lotId)
  const queryParams = new URLSearchParams(window.location.search);
  const paramLotId = queryParams.get("lotId");

  const [lots, setLots] = useState<ProduceLot[]>([]);
  const [selectedLotId, setSelectedLotId] = useState<string>(paramLotId || "");
  const [matches, setMatches] = useState<BuyerMatchResult[]>([]);
  const [offers, setOffers] = useState<AgriOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Counter offer modal state
  const [counterOfferId, setCounterOfferId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchLots();
  }, []);

  useEffect(() => {
    if (selectedLotId) {
      fetchMatchesAndOffers(selectedLotId);
    }
  }, [selectedLotId]);

  const fetchLots = async () => {
    try {
      const res = await fetch("/api/lots");
      if (res.ok) {
        const data: ProduceLot[] = await res.json();
        setLots(data);
        if (!selectedLotId && data.length > 0) {
          setSelectedLotId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load lots", err);
    }
  };

  const fetchMatchesAndOffers = async (lotId: string) => {
    setLoading(true);
    try {
      const [matchesRes, offersRes] = await Promise.all([
        fetch(`/api/matches/${lotId}`),
        fetch(`/api/offers?lotId=${lotId}`),
      ]);

      if (matchesRes.ok) {
        const matchData = await matchesRes.json();
        setMatches(matchData.matches || []);
      }

      if (offersRes.ok) {
        const offersData = await offersRes.json();
        setOffers(offersData);
      }
    } catch (err) {
      console.error("Failed to load matches and offers", err);
    } finally {
      setLoading(false);
    }
  };

  // Farmer triggers a simulated buyer digital offer from a matched buyer
  const handleRequestOffer = async (match: BuyerMatchResult) => {
    const lot = lots.find((l) => l.id === selectedLotId);
    if (!lot) return;

    setActionLoading(true);
    try {
      const payload = {
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        crop: lot.crop,
        sellerId: lot.sellerId,
        buyerId: match.buyerDemand.buyerId,
        buyerName: match.buyerDemand.buyerName,
        buyerType: match.buyerDemand.buyerType,
        buyerVerified: match.buyerDemand.verificationStatus === "Verified",
        offeredPrice: match.grossOfferedPrice,
        quantity: Math.min(lot.quantity, match.buyerDemand.requiredQuantity),
        unit: lot.unit,
        deliveryTerms: match.buyerDemand.pickupRequirement === "Buyer Pickup" ? "Buyer Pickup" : "Seller Delivery",
        paymentTerms: match.buyerDemand.paymentTerms,
        estimatedLogisticsCost: match.estimatedTransportCostPerQtl,
        netRealizationPerUnit: match.estimatedNetRealizationPerQtl,
        notes: `Immediate purchase order based on match criteria (${match.matchScore}% match).`,
      };

      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newOffer = await res.json();
        setOffers((prev) => [newOffer, ...prev]);
        toast({
          title: "Offer Received",
          description: `${match.buyerDemand.buyerName} submitted an offer at ₹${match.grossOfferedPrice}/qtl.`,
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Offer Request Failed",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Accept offer -> Creates confirmed transaction
  const handleAcceptOffer = async (offer: AgriOffer) => {
    setActionLoading(true);
    try {
      // 1. Update offer status to Accepted
      await fetch(`/api/offers/${offer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Accepted" }),
      });

      // 2. Create Transaction
      const txnPayload = {
        lotId: offer.lotId,
        lotNumber: offer.lotNumber,
        crop: offer.crop,
        quantity: offer.quantity,
        unit: offer.unit,
        agreedPricePerUnit: offer.offeredPrice,
        logisticsCost: offer.estimatedLogisticsCost * offer.quantity,
        storageCost: 0,
        sellerId: offer.sellerId || user?.id || "farmer",
        sellerName: user?.name || "Farmer",
        sellerRole: user?.role || "farmer",
        buyerId: offer.buyerId,
        buyerName: offer.buyerName,
        buyerType: offer.buyerType,
        status: "Transaction Confirmed",
      };

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(txnPayload),
      });

      if (res.ok) {
        const txn = await res.json();
        toast({
          title: "Transaction Confirmed!",
          description: `Contract ${txn.transactionCode} created. Proceeding to logistics coordination.`,
        });
        setLocation(`/transactions?id=${txn.id}`);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Transaction Confirmation Failed",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Reject offer
  const handleRejectOffer = async (offerId: string) => {
    try {
      await fetch(`/api/offers/${offerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Rejected" }),
      });
      setOffers((prev) => prev.map((o) => (o.id === offerId ? { ...o, status: "Rejected" } : o)));
      toast({ title: "Offer Rejected" });
    } catch (err) {
      console.error(err);
    }
  };

  // Submit counter offer
  const handleCounterSubmit = async (offerId: string) => {
    if (!counterPrice || counterPrice <= 0) return;
    try {
      const res = await fetch(`/api/offers/${offerId}/counter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counterPrice }),
      });
      if (res.ok) {
        setOffers((prev) =>
          prev.map((o) =>
            o.id === offerId ? { ...o, status: "Countered", counterPrice } : o
          )
        );
        setCounterOfferId(null);
        toast({
          title: "Counter-Offer Sent",
          description: `Revised price ₹${counterPrice}/qtl transmitted to buyer.`,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeLot = lots.find((l) => l.id === selectedLotId);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">AI Matching & Digital Offers</h1>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                Explainable B2B Match
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-base">
              Deterministic matching calculated across crop variety, quality grade, quantity compatibility, and net realization after transport.
            </p>
          </div>

          {/* Lot Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Select Active Lot:</span>
            <select
              value={selectedLotId}
              onChange={(e) => setSelectedLotId(e.target.value)}
              className="h-10 px-3 rounded-md border bg-background text-sm font-semibold max-w-xs"
            >
              {lots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.lotNumber} ({l.crop} - {l.quantity} {l.unit})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Lot Snapshot Card */}
        {activeLot && (
          <div className="bg-card border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">{activeLot.lotNumber}</span>
                  <Badge variant="secondary" className="text-xs">{activeLot.status}</Badge>
                </div>
                <h3 className="text-lg font-bold text-foreground mt-0.5">
                  {activeLot.quantity} {activeLot.unit} {activeLot.crop} ({activeLot.variety || "Standard"})
                </h3>
                <span className="text-xs text-muted-foreground">
                  Location: {activeLot.location} • Grade: {activeLot.qualityGrade} • Asking Price: ₹{activeLot.expectedPricePerUnit}/{activeLot.unit}
                </span>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-xs text-muted-foreground block">Total Estimated Value</span>
              <span className="text-xl font-extrabold text-foreground">
                ₹{(activeLot.quantity * activeLot.expectedPricePerUnit).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Section 1: Active Digital Offers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Active Digital Offers ({offers.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Review, negotiate counter-offers, or accept to confirm trade contract.
              </p>
            </div>
          </div>

          {offers.length === 0 ? (
            <div className="bg-card border border-dashed rounded-xl p-8 text-center text-muted-foreground">
              <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
              <p className="text-sm font-medium">No offers received yet for this lot.</p>
              <p className="text-xs mt-1">Review the matched buyers below and click "Request Digital Offer" to initiate trade.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map((offer) => {
                const isCountering = counterOfferId === offer.id;
                return (
                  <div
                    key={offer.id}
                    className="bg-card border rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-foreground">{offer.buyerName}</span>
                        <Badge variant="outline" className="text-xs">{offer.buyerType}</Badge>
                        {offer.status === "Pending" && (
                          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                            Action Required
                          </Badge>
                        )}
                        {offer.status === "Accepted" && (
                          <Badge className="bg-emerald-600 text-white text-xs">Accepted</Badge>
                        )}
                        {offer.status === "Countered" && (
                          <Badge variant="secondary" className="text-xs">
                            Countered at ₹{offer.counterPrice}/qtl
                          </Badge>
                        )}
                        {offer.status === "Rejected" && (
                          <Badge variant="outline" className="text-rose-600 text-xs">Rejected</Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                        <span>Quantity: <strong className="text-foreground">{offer.quantity} {offer.unit}</strong></span>
                        <span>Delivery: <strong className="text-foreground">{offer.deliveryTerms}</strong></span>
                        <span>Terms: {offer.paymentTerms}</span>
                        <span>Valid Until: {offer.validityDate}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Offered Price / Net</span>
                        <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                          ₹{offer.offeredPrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          Net: ₹{offer.netRealizationPerUnit.toLocaleString()}/{offer.unit}
                        </span>
                      </div>

                      {offer.status === "Pending" && (
                        <div className="flex items-center gap-2">
                          {!isCountering ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAcceptOffer(offer)}
                                disabled={actionLoading}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                              >
                                Accept & Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCounterOfferId(offer.id);
                                  setCounterPrice(offer.offeredPrice + 50);
                                }}
                              >
                                Counter
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRejectOffer(offer.id)}
                                className="text-rose-600 hover:text-rose-700"
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 bg-muted p-2 rounded-lg">
                              <span className="text-xs font-semibold">Your Counter (₹):</span>
                              <Input
                                type="number"
                                value={counterPrice}
                                onChange={(e) => setCounterPrice(Number(e.target.value))}
                                className="w-24 h-8 text-xs font-bold"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleCounterSubmit(offer.id)}
                                className="h-8 text-xs bg-primary text-white"
                              >
                                Submit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setCounterOfferId(null)}
                                className="h-8 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: AI Matched Buyers */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
                Matched Verified Buyers ({matches.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Ranked by estimated net farmer realization after factoring transport costs.
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              Deterministic Multi-Factor Scoring
            </Badge>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Calculating buyer matches...</div>
          ) : matches.length === 0 ? (
            <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
              No matching buyers found for this commodity at current specifications.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {matches.map((m, idx) => (
                <Card
                  key={m.buyerDemand.id}
                  className={`flex flex-col justify-between transition-all ${
                    m.isRecommended ? "border-2 border-emerald-500 shadow-md bg-emerald-500/[0.02]" : "shadow-sm"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{m.buyerDemand.buyerType}</span>
                        </div>
                        <CardTitle className="text-base font-bold text-foreground">
                          {m.buyerDemand.buyerName}
                        </CardTitle>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block">
                          {m.matchScore}%
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">Match</span>
                      </div>
                    </div>

                    {m.isRecommended && (
                      <Badge className="bg-emerald-600 text-white text-[10px] self-start mt-1 gap-1">
                        <TrendingUp className="w-3 h-3" /> Recommended (Highest Net Realization)
                      </Badge>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs pb-4">
                    {/* Price & Realization Comparison */}
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Gross Buyer Offer:</span>
                        <strong className="text-sm text-foreground">₹{m.grossOfferedPrice.toLocaleString()}/qtl</strong>
                      </div>
                      <div className="flex justify-between items-center text-amber-600">
                        <span>Est. Freight ({m.buyerDemand.distanceKm} km):</span>
                        <span>-₹{m.estimatedTransportCostPerQtl}/qtl</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t font-bold">
                        <span className="text-foreground">Est. Net Realization:</span>
                        <span className="text-base text-emerald-600 dark:text-emerald-400">
                          ₹{m.estimatedNetRealizationPerQtl.toLocaleString()}/qtl
                        </span>
                      </div>
                    </div>

                    {/* Concrete Explainable Match Reasons */}
                    <div className="space-y-1 pt-1">
                      <span className="font-semibold text-foreground block">Match Criteria Factors:</span>
                      <ul className="space-y-1 text-muted-foreground">
                        {m.reasons.map((reason: string, i: number) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="text-muted-foreground pt-1 border-t space-y-0.5">
                      <p>Terms: {m.buyerDemand.paymentTerms}</p>
                      <p>Delivery Target: {m.buyerDemand.expectedDeliveryDate}</p>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button
                      onClick={() => handleRequestOffer(m)}
                      disabled={actionLoading}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-medium text-xs gap-1.5"
                    >
                      Request Digital Offer
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
