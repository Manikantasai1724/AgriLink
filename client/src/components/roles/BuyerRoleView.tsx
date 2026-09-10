import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Building2, 
  ShoppingBag, 
  Package, 
  Truck, 
  CreditCard, 
  ArrowRight, 
  PlusCircle, 
  Layers, 
  CheckCircle2, 
  Check, 
  Scale, 
  Sparkles, 
  Clock, 
  MapPin, 
  ShieldCheck 
} from "lucide-react";
import { BuyerDemand, ProduceLot, AgriOffer, AgriTransaction } from "@shared/schema";
import toast from "react-hot-toast";

interface BuyerRoleViewProps {
  user: any;
  demands: BuyerDemand[];
  lots: ProduceLot[];
  offers: AgriOffer[];
  transactions: AgriTransaction[];
  onRefresh: () => void;
}

export function BuyerRoleView({
  user,
  demands,
  lots,
  offers,
  transactions,
  onRefresh,
}: BuyerRoleViewProps) {
  const [showPostDemandModal, setShowPostDemandModal] = useState(false);
  const [selectedLotForBid, setSelectedLotForBid] = useState<ProduceLot | null>(null);
  const [selectedTxnForPayment, setSelectedTxnForPayment] = useState<AgriTransaction | null>(null);

  // Form states for new Buyer Demand
  const [crop, setCrop] = useState("Paddy / Rice");
  const [variety, setVariety] = useState("BPT 5204");
  const [quantity, setQuantity] = useState("200");
  const [targetPrice, setTargetPrice] = useState("2800");
  const [qualityGrade, setQualityGrade] = useState("Grade A");
  const [location, setLocation] = useState("Bhimavaram Industrial Processing Hub");
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0]);

  // Form states for Submitting Bid
  const [bidPrice, setBidPrice] = useState<number>(2700);
  const [bidQuantity, setBidQuantity] = useState<number>(50);
  const [deliveryTerms, setDeliveryTerms] = useState<"Buyer Pickup" | "Seller Delivery">("Buyer Pickup");
  const [paymentTerms, setPaymentTerms] = useState("100% on Delivery Verification");

  // Form states for Payment
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentProofUrl, setPaymentProofUrl] = useState("https://agrilink.in/receipts/utr-sample.pdf");
  const [submitting, setSubmitting] = useState(false);

  // Filter demands posted by this buyer
  const myDemands = demands.filter(d => !d.buyerId || d.buyerId === user?.id || d.buyerName === user?.name);
  const availableLots = lots.filter(l => l.status === "Available" || l.status === "Offers Received");
  const myBids = offers.filter(o => o.buyerId === user?.id || o.buyerName === user?.name || user?.role === "buyer");
  const inboundShipments = transactions.filter(t => t.status !== "Transaction Completed");
  const pendingPayments = transactions.filter(t => t.paymentStatus === "Pending");
  const pendingAmountTotal = pendingPayments.reduce((sum, t) => sum + (Number(t.grossAmount) || 0), 0);

  const handlePostDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch("/api/buyer-demands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-role": "buyer",
        },
        body: JSON.stringify({
          buyerId: user?.id || "byr-default",
          buyerName: user?.name || "Verified Institutional Buyer",
          buyerType: user?.company ? "Food Processor" : "Institutional Buyer",
          crop,
          variety,
          requiredQuantity: Number(quantity),
          unit: "Quintal",
          minQualityGrade: qualityGrade,
          location,
          targetPricePerUnit: Number(targetPrice),
          expectedDeliveryDate: deliveryDate,
          paymentTerms: "100% on Delivery Verification via Escrow",
          active: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to post demand");
      }

      toast.success("Procurement Requirement posted to all verified Farmers and FPOs!");
      setShowPostDemandModal(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to post demand");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotForBid) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch("/api/agri-offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-role": "buyer",
        },
        body: JSON.stringify({
          lotId: selectedLotForBid.id,
          lotNumber: selectedLotForBid.lotNumber,
          crop: selectedLotForBid.crop,
          sellerId: selectedLotForBid.sellerId,
          buyerId: user?.id || "byr-default",
          buyerName: user?.name || "Verified Buyer",
          buyerType: "Food Processor / Mill",
          offeredPrice: Number(bidPrice),
          quantity: Number(bidQuantity),
          unit: selectedLotForBid.unit || "Quintal",
          deliveryTerms,
          paymentTerms,
          status: "Pending",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit bid");
      }

      toast.success(`Purchase bid of ₹${bidPrice}/qtl submitted for Lot #${selectedLotForBid.lotNumber}!`);
      setSelectedLotForBid(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Bid submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxnForPayment) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch(`/api/agri-transactions/${selectedTxnForPayment.id}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-role": "buyer",
        },
        body: JSON.stringify({
          paymentReference: utrNumber || `UTR-${Date.now()}`,
          paymentMethod: "Direct Bank Transfer / Escrow",
          paymentProofUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Payment verification failed");
      }

      toast.success("UTR Reference submitted! Farmer payout has been credited.");
      setSelectedTxnForPayment(null);
      setUtrNumber("");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Active Procurement Demands</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-foreground">
              {myDemands.length} Demands
            </span>
            <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[10px]">Posted</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Commodity requirements broadcast to farmers</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-primary shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Matched Farm Lots</span>
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-foreground">
              {availableLots.length} Lots Available
            </span>
            <Badge className="bg-primary/10 text-primary text-[10px]">Ready to Bid</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Registered by verified farmers & FPOs</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Active Shipments</span>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-foreground">
              {inboundShipments.length} In Transit
            </span>
            <Badge className="bg-amber-500/10 text-amber-700 text-[10px]">Logistics</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Track haulage & milestone status</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Settlement Payouts Due</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-emerald-600">
              ₹{pendingAmountTotal.toLocaleString("en-IN")}
            </span>
            <Badge className="bg-emerald-500/10 text-emerald-700 text-[10px]">Escrow</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Pending bank verification & UTR release</span>
        </Card>
      </div>

      {/* Action Banner */}
      <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-xs flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Buyer Procurement Operations</h3>
            <p className="text-xs text-muted-foreground">Post recurring commodity requirements or bid directly on farm lots.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-semibold shadow-xs"
            onClick={() => setShowPostDemandModal(true)}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            + Post Buyer Demand
          </Button>
          <Link href="/buyer-demand">
            <Button size="sm" variant="outline" className="text-xs gap-1">
              Browse All Demands <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Available Farm Lots to Bid On */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Available Farm Produce Lots ({availableLots.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Live farm lots registered by smallholders & FPOs ready for institutional purchase bids.
            </CardDescription>
          </div>
          <Link href="/offers-matches">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              Matching Engine <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {availableLots.slice(0, 5).map((lot) => (
              <div key={lot.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{lot.crop}</span>
                    <Badge variant="outline" className="text-[10px]">#{lot.lotNumber}</Badge>
                    <Badge className="bg-primary/10 text-primary text-[10px]">{lot.qualityGrade}</Badge>
                    {lot.fpoAggregated && (
                      <Badge className="bg-indigo-500/10 text-indigo-700 text-[10px]">FPO Aggregated</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Seller: <strong className="text-foreground">{lot.sellerName}</strong> ({lot.sellerRole}) • Location: {lot.location}
                  </p>
                  <div className="flex items-center gap-3 text-xs pt-1">
                    <span className="text-foreground font-semibold">Available: {lot.quantity} {lot.unit}</span>
                    <span className="text-emerald-600 font-bold text-sm">Expected: ₹{lot.expectedPricePerUnit}/qtl</span>
                    <span className="text-muted-foreground">Pickup: {lot.pickupRequirement}</span>
                  </div>
                </div>

                <Button 
                  size="sm" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1"
                  onClick={() => {
                    setSelectedLotForBid(lot);
                    setBidPrice(lot.expectedPricePerUnit);
                    setBidQuantity(lot.quantity);
                  }}
                >
                  <Scale className="w-3.5 h-3.5" />
                  Place Purchase Bid
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Placed Purchase Bids & Status */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            My Placed Bids & Negotiation Status ({myBids.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Commercial bids submitted to farmers and FPOs with live counter-offer tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {myBids.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">No purchase bids placed yet.</div>
          ) : (
            <div className="divide-y">
              {myBids.map((b) => (
                <div key={b.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{b.crop}</span>
                      <span className="text-xs text-muted-foreground">Lot #{b.lotNumber}</span>
                      <Badge className={`text-[10px] ${
                        b.status === "Accepted" ? "bg-emerald-600 text-white" :
                        b.status === "Countered" ? "bg-amber-500 text-white" :
                        "bg-blue-600 text-white"
                      }`}>
                        {b.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Offered Price: <strong className="text-foreground">₹{b.offeredPrice}/qtl</strong> • Quantity: {b.quantity} {b.unit}
                      {b.counterPrice && (
                        <span className="ml-2 text-amber-600 font-bold">Farmer Counter: ₹{b.counterPrice}/qtl</span>
                      )}
                    </p>
                  </div>
                  {b.status === "Accepted" && (
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-xs">
                      Contract Active
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inbound Consignments & Payment Settlement */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Inbound Consignments & Payout Release
            </CardTitle>
            <CardDescription className="text-xs">
              Verify delivered produce lots and submit bank UTR reference numbers to release payment.
            </CardDescription>
          </div>
          <Link href="/transactions">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {inboundShipments.slice(0, 3).map((txn) => (
              <div key={txn.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{txn.crop}</span>
                    <Badge variant="outline" className="text-[10px]">#{txn.transactionCode}</Badge>
                    <Badge className="bg-blue-600 text-white text-[10px]">{txn.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Seller: <strong className="text-foreground">{txn.sellerName}</strong> • Qty: {txn.quantity} {txn.unit} @ ₹{txn.agreedPricePerUnit}/qtl
                  </p>
                  <p className="text-xs font-bold text-emerald-600">
                    Gross Invoice: ₹{txn.grossAmount.toLocaleString("en-IN")} • Payment: {txn.paymentStatus}
                  </p>
                </div>

                {txn.paymentStatus === "Pending" ? (
                  <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                    onClick={() => {
                      setSelectedTxnForPayment(txn);
                      setUtrNumber(`UTR-${Date.now()}`);
                    }}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Submit UTR & Pay
                  </Button>
                ) : (
                  <Badge className="bg-emerald-600 text-white text-xs">Payment Complete</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Post Buyer Demand Modal */}
      <Dialog open={showPostDemandModal} onOpenChange={setShowPostDemandModal}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handlePostDemand}>
            <DialogHeader>
              <DialogTitle>Post Commodity Procurement Requirement</DialogTitle>
              <DialogDescription>
                Broadcast your procurement target to verified farmers and FPOs across the state.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Crop *</label>
                  <Input value={crop} onChange={(e) => setCrop(e.target.value)} required />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Variety</label>
                  <Input value={variety} onChange={(e) => setVariety(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Required Quantity (Qtl) *</label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Target Price (₹/Qtl) *</label>
                  <Input type="number" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Min Quality Grade</label>
                  <Input value={qualityGrade} onChange={(e) => setQualityGrade(e.target.value)} />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Delivery by Date</label>
                  <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Delivery Location</label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowPostDemandModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={submitting}>
                {submitting ? "Posting..." : "Post Procurement Demand"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Submit Bid Modal */}
      {selectedLotForBid && (
        <Dialog open={Boolean(selectedLotForBid)} onOpenChange={() => setSelectedLotForBid(null)}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmitBid}>
              <DialogHeader>
                <DialogTitle>Place Purchase Bid for #{selectedLotForBid.lotNumber}</DialogTitle>
                <DialogDescription>
                  Make a direct purchase offer to {selectedLotForBid.sellerName} for {selectedLotForBid.crop}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-3 text-xs">
                <div className="bg-muted/40 p-3 rounded-lg space-y-1">
                  <div>Seller Asking Price: <strong className="text-foreground">₹{selectedLotForBid.expectedPricePerUnit}/qtl</strong></div>
                  <div>Available Volume: <strong className="text-foreground">{selectedLotForBid.quantity} {selectedLotForBid.unit}</strong></div>
                  <div>Quality Grade: <strong className="text-foreground">{selectedLotForBid.qualityGrade}</strong></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block mb-1">Offered Price (₹/Qtl) *</label>
                    <Input 
                      type="number" 
                      value={bidPrice} 
                      onChange={(e) => setBidPrice(Number(e.target.value))} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Quantity (Quintals) *</label>
                    <Input 
                      type="number" 
                      value={bidQuantity} 
                      onChange={(e) => setBidQuantity(Number(e.target.value))} 
                      required 
                    />
                  </div>
                </div>
                <div className="text-xs font-bold text-foreground">
                  Total Bid Value: ₹{(bidPrice * bidQuantity).toLocaleString("en-IN")}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedLotForBid(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary text-primary-foreground" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Purchase Bid"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Submit Payment Proof Modal */}
      {selectedTxnForPayment && (
        <Dialog open={Boolean(selectedTxnForPayment)} onOpenChange={() => setSelectedTxnForPayment(null)}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmitPayment}>
              <DialogHeader>
                <DialogTitle>Submit Bank Transfer UTR Proof</DialogTitle>
                <DialogDescription>
                  Record bank transfer payment for Contract #{selectedTxnForPayment.transactionCode}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-3 text-xs">
                <div className="bg-muted/40 p-3 rounded-lg space-y-1">
                  <div>Total Invoice Due: <strong className="text-emerald-600 font-bold text-sm">₹{selectedTxnForPayment.grossAmount.toLocaleString("en-IN")}</strong></div>
                  <div>Seller Beneficiary: <strong className="text-foreground">{selectedTxnForPayment.sellerName}</strong></div>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Bank UTR / Transaction Reference *</label>
                  <Input 
                    value={utrNumber} 
                    onChange={(e) => setUtrNumber(e.target.value)} 
                    placeholder="e.g. UTR-2026-98124401"
                    required 
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Payment Proof Document URL</label>
                  <Input 
                    value={paymentProofUrl} 
                    onChange={(e) => setPaymentProofUrl(e.target.value)} 
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedTxnForPayment(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={submitting}>
                  {submitting ? "Verifying..." : "Confirm & Disburse Payment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
