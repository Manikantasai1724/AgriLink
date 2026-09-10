import { useState, useEffect } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight,
  ShieldCheck,
  FileCheck
} from "lucide-react";
import { Link } from "wouter";

export default function PaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activePaymentModal, setActivePaymentModal] = useState<any | null>(null);
  const [utrInput, setUtrInput] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const url = user?.role === "admin"
        ? "/api/payments"
        : `/api/payments?userId=${user?.id || ""}&role=${user?.role || ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "firebase-uid": user?.id || "",
          "x-user-role": user?.role || "",
        },
      });
      if (res.ok) {
        setPayments(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordUtr = async () => {
    if (!activePaymentModal || !utrInput.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/payments/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: activePaymentModal.transactionId,
          paymentReference: utrInput,
          paymentMethod: "Direct Bank Transfer / Escrow",
          amount: activePaymentModal.grossAmount,
        }),
      });
      if (res.ok) {
        toast({
          title: "Payment Recorded",
          description: "Transaction status updated to Paid.",
        });
        setActivePaymentModal(null);
        setUtrInput("");
        fetchPayments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const totalDisbursed = payments
    .filter((p) => p.paymentStatus === "Paid")
    .reduce((sum, p) => sum + (Number(p.netRealizationAmount) || 0), 0);

  const totalPending = payments
    .filter((p) => p.paymentStatus === "Pending")
    .reduce((sum, p) => sum + (Number(p.netRealizationAmount) || 0), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Payment Tracking</h1>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                Verified Bank Settlement
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-base">
              Transparent payment lifecycle tracking, escrow releases, and bank transaction references (UTR).
            </p>
          </div>

          <Link href="/transactions">
            <Button variant="outline" className="gap-2">
              View All Transactions
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 shadow-sm border-l-4 border-l-emerald-500">
            <span className="text-xs text-muted-foreground font-medium block">Total Settled In-Hand</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              ₹{totalDisbursed.toLocaleString()}
            </span>
            <span className="text-[11px] text-muted-foreground">Direct bank deposits verified</span>
          </Card>

          <Card className="p-4 shadow-sm border-l-4 border-l-amber-500">
            <span className="text-xs text-muted-foreground font-medium block">Pending Settlements</span>
            <span className="text-2xl font-black text-amber-600 mt-1 block">
              ₹{totalPending.toLocaleString()}
            </span>
            <span className="text-[11px] text-muted-foreground">Awaiting gate weighment or UTR release</span>
          </Card>

          <Card className="p-4 shadow-sm border-l-4 border-l-blue-500">
            <span className="text-xs text-muted-foreground font-medium block">Escrow Security</span>
            <span className="text-2xl font-black text-foreground mt-1 block">100% Protected</span>
            <span className="text-[11px] text-muted-foreground">Funds secured prior to transit release</span>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Settlement Records ({payments.length})
            </CardTitle>
            <CardDescription>
              Audit trail of every completed trade, deduction breakdown, and payment confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading payment records...</div>
            ) : payments.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No payment records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                      <th className="py-3 px-4">Contract / Lot</th>
                      <th className="py-3 px-4">Commodity</th>
                      <th className="py-3 px-4">Buyer Party</th>
                      <th className="py-3 px-4">Gross Amount</th>
                      <th className="py-3 px-4 font-bold text-foreground">Net Realization</th>
                      <th className="py-3 px-4">UTR Reference</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {payments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-muted/30">
                        <td className="py-3 px-4 font-mono text-xs font-bold text-foreground">
                          {pay.transactionCode}
                          <span className="block text-[11px] text-muted-foreground font-normal">{pay.lotNumber}</span>
                        </td>
                        <td className="py-3 px-4 font-medium">{pay.crop}</td>
                        <td className="py-3 px-4 text-muted-foreground">{pay.buyerName}</td>
                        <td className="py-3 px-4 text-muted-foreground">₹{pay.grossAmount?.toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{pay.netRealizationAmount?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-muted-foreground">
                          {pay.paymentReference || "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={`text-xs ${
                              pay.paymentStatus === "Paid"
                                ? "bg-emerald-600 text-white"
                                : pay.paymentStatus === "Disputed"
                                ? "bg-rose-600 text-white"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}
                          >
                            {pay.paymentStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {pay.paymentStatus !== "Paid" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActivePaymentModal(pay)}
                              className="text-xs h-8"
                            >
                              Record UTR
                            </Button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Record UTR Modal */}
        {activePaymentModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-foreground">Record Bank Payment Settlement</h3>
              <p className="text-xs text-muted-foreground">
                Contract: {activePaymentModal.transactionCode} • Amount: ₹{activePaymentModal.grossAmount?.toLocaleString()}
              </p>

              <div className="space-y-2 text-sm">
                <Label htmlFor="utr">Bank UTR / Transaction Reference ID *</Label>
                <Input
                  id="utr"
                  placeholder="e.g. UTR-AXIS20260908123"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setActivePaymentModal(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleRecordUtr}
                  disabled={actionLoading || !utrInput.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Verify & Mark Paid
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
