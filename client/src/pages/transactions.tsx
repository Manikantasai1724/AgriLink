import { useState, useEffect } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { AgriTransaction } from "@shared/schema";
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  CreditCard, 
  AlertTriangle, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  Package
} from "lucide-react";
import { Link } from "wouter";

const TRANSACTION_STAGES = [
  "Lot Created",
  "Offer Accepted",
  "Transaction Confirmed",
  "Logistics Arranged",
  "In Transit",
  "Delivered",
  "Payment Pending",
  "Payment Received",
  "Transaction Completed",
];

export default function TransactionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<AgriTransaction[]>([]);
  const [selectedTxnId, setSelectedTxnId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Payment proof modal
  const [paymentRefInput, setPaymentRefInput] = useState<string>("");
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const url = user?.role === "admin"
        ? "/api/transactions"
        : `/api/transactions?userId=${user?.id || ""}&role=${user?.role || ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "firebase-uid": user?.id || "",
          "x-user-role": user?.role || "",
        },
      });
      if (res.ok) {
        const data: AgriTransaction[] = await res.json();
        setTransactions(data);
        if (data.length > 0 && !selectedTxnId) {
          setSelectedTxnId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedTxn = transactions.find((t) => t.id === selectedTxnId) || transactions[0];

  // Advance lifecycle status
  const handleAdvanceStatus = async (nextStatus: string) => {
    if (!selectedTxn) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/transactions/${selectedTxn.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        toast({
          title: "Stage Updated",
          description: `Transaction ${updated.transactionCode} is now: ${nextStatus}`,
        });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Update Failed", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit payment proof
  const handleRecordPaymentProof = async () => {
    if (!selectedTxn || !paymentRefInput.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/payments/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: selectedTxn.id,
          paymentReference: paymentRefInput,
          paymentMethod: "Direct Bank Transfer / Escrow",
          amount: selectedTxn.grossAmount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTransactions((prev) => prev.map((t) => (t.id === data.transaction.id ? data.transaction : t)));
        setShowPaymentModal(false);
        setPaymentRefInput("");
        toast({
          title: "Payment Confirmed",
          description: "Payment status verified and updated to Paid.",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const currentStageIndex = selectedTxn
    ? TRANSACTION_STAGES.indexOf(selectedTxn.status)
    : -1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Transaction Management</h1>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                End-to-End Trade Lifecycle
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-base">
              Track contract milestones, pickup and delivery logistics, and verified digital payment settlements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/disputes">
              <Button variant="outline" className="gap-2 text-rose-600 hover:text-rose-700">
                <AlertTriangle className="w-4 h-4" />
                Disputes & Grievances
              </Button>
            </Link>
            <Link href="/offers-matches">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                View Offers & Matches
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="text-lg font-bold text-foreground">No active transactions found</h3>
            <p className="text-sm mt-1">Accept an offer on the Offers & Matches page to initialize a trade contract.</p>
            <Link href="/offers-matches" className="inline-block mt-4">
              <Button className="bg-primary text-white">Go to Offers</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Transaction List */}
            <div className="lg:col-span-1 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                All Contracts ({transactions.length})
              </h2>
              <div className="space-y-2">
                {transactions.map((txn) => {
                  const isSelected = txn.id === selectedTxn?.id;
                  return (
                    <div
                      key={txn.id}
                      onClick={() => setSelectedTxnId(txn.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "bg-card hover:bg-muted/50 border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {txn.transactionCode}
                        </span>
                        <Badge
                          variant={txn.paymentStatus === "Paid" ? "default" : "outline"}
                          className={`text-[10px] ${
                            txn.paymentStatus === "Paid" ? "bg-emerald-600 text-white" : ""
                          }`}
                        >
                          {txn.paymentStatus}
                        </Badge>
                      </div>

                      <h4 className="font-bold text-foreground text-sm mt-1">
                        {txn.quantity} {txn.unit} {txn.crop}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                        <span>Buyer: {txn.buyerName}</span>
                        <strong className="text-foreground">₹{txn.grossAmount.toLocaleString()}</strong>
                      </div>
                      <div className="text-[11px] text-primary font-medium mt-1">
                        Stage: {txn.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Transaction Detail & Lifecycle Stepper */}
            {selectedTxn && (
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="pb-4 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-extrabold text-foreground">
                            {selectedTxn.transactionCode}
                          </span>
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            {selectedTxn.status}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs mt-1">
                          Produce Lot: <strong className="text-foreground">{selectedTxn.lotNumber}</strong> • Date: {new Date(selectedTxn.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Gross Contract Amount</span>
                        <span className="text-2xl font-black text-foreground">
                          ₹{selectedTxn.grossAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 pt-6">
                    {/* Lifecycle Progress Stepper */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                        Trade Lifecycle Progression
                      </h4>
                      <div className="space-y-3">
                        {TRANSACTION_STAGES.map((stage, idx) => {
                          const isDone = idx <= currentStageIndex;
                          const isCurrent = idx === currentStageIndex;
                          const timestamp = selectedTxn.stageTimestamps?.[stage];

                          return (
                            <div key={stage} className="flex items-start gap-3">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                                  isDone
                                    ? "bg-emerald-600 text-white"
                                    : "bg-muted text-muted-foreground border"
                                }`}
                              >
                                {isDone ? "✓" : idx + 1}
                              </div>

                              <div className="flex-1 flex items-center justify-between text-sm">
                                <div>
                                  <span className={`font-semibold ${isCurrent ? "text-primary font-bold" : "text-foreground"}`}>
                                    {stage}
                                  </span>
                                  {isCurrent && (
                                    <Badge variant="outline" className="ml-2 text-[10px] bg-primary/10 text-primary border-primary/20">
                                      Active Stage
                                    </Badge>
                                  )}
                                </div>
                                {timestamp && (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(timestamp).toLocaleString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Financial Breakdown & Net Realization */}
                    <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-sm border">
                      <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                        Settlement & Net Realization
                      </h4>
                      <div className="flex justify-between text-muted-foreground text-xs">
                        <span>Agreed Selling Price:</span>
                        <span className="text-foreground font-semibold">
                          ₹{selectedTxn.agreedPricePerUnit}/qtl × {selectedTxn.quantity} {selectedTxn.unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground text-xs">
                        <span>Gross Sale Value:</span>
                        <span className="text-foreground font-semibold">₹{selectedTxn.grossAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-amber-600 text-xs">
                        <span>Transport & Logistics Freight:</span>
                        <span>-₹{selectedTxn.logisticsCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-amber-600 text-xs">
                        <span>Storage & Holding Fees:</span>
                        <span>-₹{selectedTxn.storageCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t text-base font-bold">
                        <span className="text-foreground">Net In-Hand Farmer Realization:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ₹{selectedTxn.netRealizationAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Logistics Provider Info */}
                    {selectedTxn.logisticsDetails && (
                      <div className="border rounded-xl p-4 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-primary font-bold">
                          <Truck className="w-4 h-4" />
                          <span>Assigned Transport Coordinator</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                          <div>Transporter: <strong className="text-foreground">{selectedTxn.logisticsDetails.transporterName}</strong></div>
                          <div>Vehicle: <strong className="text-foreground">{selectedTxn.logisticsDetails.vehicleNumber}</strong></div>
                          <div>Phone: <strong className="text-foreground">{selectedTxn.logisticsDetails.transporterPhone}</strong></div>
                          <div>ETA: <strong className="text-foreground">{selectedTxn.logisticsDetails.estimatedDelivery}</strong></div>
                        </div>
                      </div>
                    )}

                    {/* Stage Advancement Actions */}
                    <div className="border-t pt-4 space-y-3">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                        Lifecycle Actions
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedTxn.status === "Transaction Confirmed" && (
                          <Button
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleAdvanceStatus("Logistics Arranged")}
                            className="bg-primary text-white"
                          >
                            Arrange Logistics & Schedule Pickup
                          </Button>
                        )}
                        {selectedTxn.status === "Logistics Arranged" && (
                          <Button
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleAdvanceStatus("In Transit")}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Mark Truck In Transit
                          </Button>
                        )}
                        {selectedTxn.status === "In Transit" && (
                          <Button
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleAdvanceStatus("Delivered")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Confirm Hub Delivery
                          </Button>
                        )}
                        {selectedTxn.status === "Delivered" && (
                          <Button
                            size="sm"
                            disabled={actionLoading}
                            onClick={() => handleAdvanceStatus("Payment Pending")}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            Request Buyer Payment Release
                          </Button>
                        )}

                        {selectedTxn.paymentStatus !== "Paid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowPaymentModal(true)}
                            className="gap-1.5"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Record Payment Settlement / UTR
                          </Button>
                        )}

                        <Link href={`/disputes?transactionId=${selectedTxn.id}&code=${selectedTxn.transactionCode}`}>
                          <Button size="sm" variant="ghost" className="text-rose-600 gap-1.5 text-xs">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Raise Dispute
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Payment Proof Modal */}
                    {showPaymentModal && (
                      <div className="bg-background/95 border-2 border-primary/30 p-4 rounded-xl space-y-3 mt-4">
                        <h4 className="text-sm font-bold text-foreground">Record Bank Payment Reference (UTR)</h4>
                        <div className="space-y-2">
                          <Label htmlFor="utr">UTR / Bank Transaction Reference</Label>
                          <Input
                            id="utr"
                            placeholder="e.g. UTR-HDFC99823100"
                            value={paymentRefInput}
                            onChange={(e) => setPaymentRefInput(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleRecordPaymentProof}
                            disabled={actionLoading || !paymentRefInput.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          >
                            Confirm Payment Release
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowPaymentModal(false)}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
