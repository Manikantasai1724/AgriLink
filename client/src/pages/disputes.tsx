import { useState, useEffect } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dispute } from "@shared/schema";
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  FileText, 
  PlusCircle, 
  Send
} from "lucide-react";

const CATEGORIES = ["Payment", "Quality", "Quantity", "Delivery", "Price", "Logistics", "Behavior"];

export default function DisputesPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const queryParams = new URLSearchParams(window.location.search);
  const paramTxnId = queryParams.get("transactionId") || "";
  const paramTxnCode = queryParams.get("code") || "";

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(Boolean(paramTxnId));

  // Form state
  const [transactionId, setTransactionId] = useState<string>(paramTxnId);
  const [transactionCode, setTransactionCode] = useState<string>(paramTxnCode);
  const [respondentName, setRespondentName] = useState<string>("Buyer");
  const [category, setCategory] = useState<string>("Payment");
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      fetchDisputes();
    }
  }, [user]);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const url = user?.role === "admin"
        ? "/api/disputes?isAdmin=true"
        : `/api/disputes?userId=${user?.id || ""}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "firebase-uid": user?.id || "",
          "x-user-role": user?.role || "",
        },
      });
      if (res.ok) {
        setDisputes(await res.json());
      }
    } catch (err) {
      console.error("Failed to load disputes", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);

    try {
      const payload = {
        transactionId,
        transactionCode: transactionCode || `TXN-${transactionId.slice(0, 6)}`,
        raisedByUserId: user?.id || "user",
        raisedByName: user?.name || "Farmer",
        raisedByRole: user?.role || "farmer",
        respondentId: "buyer-partner",
        respondentName,
        category,
        description,
      };

      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        setDisputes((prev) => [created, ...prev]);
        setShowCreateModal(false);
        setDescription("");
        toast({
          title: "Dispute Lodged",
          description: `Reference ${created.disputeCode} registered with AgriLink Grievance Committee.`,
        });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to lodge dispute", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Disputes & Grievances</h1>
              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-medium">
                Fair Trade Arbitrage
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-base">
              Transparent dispute resolution for payment defaults, quantity discrepancies, grade mismatches, or logistics breaches.
            </p>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-2 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Raise New Dispute
          </Button>
        </div>

        {/* Dispute List */}
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading grievance records...</div>
        ) : disputes.length === 0 ? (
          <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground">Zero Active Disputes</h3>
            <p className="text-sm mt-1">All agricultural contracts and payment settlements are in good standing.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((disp) => (
              <Card key={disp.id} className="shadow-sm border-l-4 border-l-rose-500">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-foreground">{disp.disputeCode}</span>
                        <Badge variant="outline" className="text-xs">{disp.category}</Badge>
                        <Badge
                          className={`text-xs ${
                            disp.status === "Open"
                              ? "bg-amber-500 text-white"
                              : disp.status === "Resolved"
                              ? "bg-emerald-600 text-white"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {disp.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        Contract Code: <strong className="text-foreground">{disp.transactionCode}</strong> • Lodged by: {disp.raisedByName} ({disp.raisedByRole})
                      </CardDescription>
                    </div>

                    <span className="text-xs text-muted-foreground">
                      {new Date(disp.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 text-sm">
                  <p className="text-foreground/90 bg-muted/30 p-3 rounded-lg text-xs leading-relaxed">
                    {disp.description}
                  </p>

                  {disp.adminNotes && (
                    <div className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-blue-700 dark:text-blue-400 block">
                        Admin Mediation Notes:
                      </span>
                      <p className="text-muted-foreground">{disp.adminNotes}</p>
                    </div>
                  )}

                  {disp.resolution && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 block">
                        Resolution & Settlement Decision:
                      </span>
                      <p className="text-foreground font-medium">{disp.resolution}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal: Raise Dispute */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg text-foreground">Raise Grievance / Dispute</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                All claims are formally audited by the AgriLink admin team and legal escrow facilitators.
              </p>

              <form onSubmit={handleCreateDispute} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="tCode">Transaction / Contract Code *</Label>
                    <Input
                      id="tCode"
                      value={transactionCode}
                      onChange={(e) => setTransactionCode(e.target.value)}
                      placeholder="e.g. TXN-AGL-8941"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cat">Dispute Category *</Label>
                    <select
                      id="cat"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border bg-background text-xs"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="resp">Respondent Party (Buyer or Seller Name)</Label>
                  <Input
                    id="resp"
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    placeholder="Business or Farmer Name"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="desc">Detailed Description of Breach / Issue *</Label>
                  <Textarea
                    id="desc"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide specific details: e.g., delayed bank transfer, quality rejection discrepancy at gate weighment, or unauthorized rate reduction..."
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !description.trim()}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-medium gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Formal Dispute
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
