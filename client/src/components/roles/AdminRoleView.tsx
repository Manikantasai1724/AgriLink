import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  ShieldCheck, 
  Scale, 
  Building2, 
  TrendingUp, 
  Package, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Check, 
  X, 
  ArrowRight, 
  Eye 
} from "lucide-react";
import { Dispute, BuyerDemand, MarketPrice, AgriTransaction } from "@shared/schema";
import toast from "react-hot-toast";

interface AdminRoleViewProps {
  user: any;
  marketPrices: MarketPrice[];
  transactions: AgriTransaction[];
  onRefresh: () => void;
}

export function AdminRoleView({
  user,
  marketPrices,
  transactions,
  onRefresh,
}: AdminRoleViewProps) {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loadingDisputes, setLoadingDisputes] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Buyer verification state
  const sampleUnverifiedBuyers = [
    { id: "byr-901", name: "Godavari Agro Millers Ltd", gst: "37AABCG1234F1Z8", fssai: "10123000000412", status: "Pending Verification", location: "Bhimavaram" },
    { id: "byr-902", name: "Deccan Food Ingredients", gst: "36AAACD9876E1Z2", fssai: "10124000000854", status: "Pending Verification", location: "Vijayawada" },
  ];
  const [buyerList, setBuyerList] = useState(sampleUnverifiedBuyers);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoadingDisputes(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch("/api/disputes?isAdmin=true", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-role": "admin",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDisputes(data);
      }
    } catch (err) {
      console.error("Disputes fetch error", err);
    } finally {
      setLoadingDisputes(false);
    }
  };

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setActionLoading(true);

    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch(`/api/disputes/${selectedDispute.id}/resolve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-role": "admin",
        },
        body: JSON.stringify({
          status: "Resolved",
          resolution: resolutionText || "Arbitrated by Administrator: Escrow release authorized with agreed quality deduction.",
          adminNotes: adminNotes || "Reviewed inspection parameters.",
        }),
      });

      if (!res.ok) throw new Error("Failed to resolve dispute");
      toast.success("Dispute arbitrated and settled by Administrator!");
      setSelectedDispute(null);
      setResolutionText("");
      setAdminNotes("");
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve dispute");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyBuyer = async (buyerId: string) => {
    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch("/api/buyers/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-role": "admin",
        },
        body: JSON.stringify({ buyerId, status: "Verified" }),
      });

      if (res.ok) {
        toast.success("Buyer credentials (GSTIN / FSSAI) verified and approved!");
        setBuyerList(buyerList.map(b => b.id === buyerId ? { ...b, status: "Verified" } : b));
      }
    } catch (err) {
      toast.error("Failed to verify buyer");
    }
  };

  const openDisputesCount = disputes.filter(d => d.status !== "Resolved" && d.status !== "Closed").length;
  const totalPlatformGMV = transactions.reduce((sum, t) => sum + (Number(t.grossAmount) || 0), 0) + 1250000;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-rose-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Open Grievances</span>
            <Scale className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-rose-600">
              {openDisputesCount} Open
            </span>
            <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px]">Arbitration</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Trade disputes pending admin ruling</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Platform Trade GMV</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-foreground">
              ₹{totalPlatformGMV.toLocaleString("en-IN")}
            </span>
            <Badge className="bg-emerald-500/10 text-emerald-700 text-[10px]">Escrow GMV</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Cumulative contract turnover</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Verified Buyers Directory</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-foreground">
              {buyerList.filter(b => b.status === "Verified").length + 6} Approved
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-[11px] text-muted-foreground">FSSAI & GSTIN verified processors</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-primary shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Live Mandi Streams</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-foreground">
              {marketPrices.length} APMCs
            </span>
            <Badge className="bg-primary/10 text-primary text-[10px]">Active</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Freight-adjusted live realization</span>
        </Card>
      </div>

      {/* Disputes & Grievances Console */}
      <Card className="shadow-sm border-l-4 border-l-rose-500">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Scale className="w-5 h-5 text-rose-600" />
              Trade Dispute Arbitration Console ({disputes.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Review filed trade claims, evaluate evidence, and execute binding administrative settlement rulings.
            </CardDescription>
          </div>
          <Link href="/disputes">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              Dispute Log <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {disputes.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">No active dispute cases on file.</div>
          ) : (
            <div className="divide-y">
              {disputes.map((d) => (
                <div key={d.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">Dispute #{d.disputeCode}</span>
                      <Badge variant="outline" className="text-[10px]">Category: {d.category}</Badge>
                      <Badge className={`text-[10px] ${
                        d.status === "Resolved" ? "bg-emerald-600 text-white" :
                        d.status === "Under Review" ? "bg-amber-500 text-white" :
                        "bg-rose-600 text-white"
                      }`}>
                        {d.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Raised by: <strong className="text-foreground">{d.raisedByName}</strong> ({d.raisedByRole}) against <strong>{d.respondentName}</strong>
                    </p>
                    <p className="text-xs text-foreground bg-muted/30 p-2 rounded border font-mono">
                      "{d.description}"
                    </p>
                    {d.resolution && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold pt-1">
                        Settlement: {d.resolution}
                      </p>
                    )}
                  </div>

                  {d.status !== "Resolved" ? (
                    <Button 
                      size="sm" 
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1 whitespace-nowrap"
                      onClick={() => {
                        setSelectedDispute(d);
                        setResolutionText(`Escrow adjustment authorized: ₹5,000 credit refunded to ${d.respondentName}, remaining released to ${d.raisedByName}.`);
                      }}
                    >
                      <Scale className="w-3.5 h-3.5" />
                      Arbitrate & Settle
                    </Button>
                  ) : (
                    <Badge className="bg-emerald-600 text-white text-xs">Case Resolved</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buyer Verification Review */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Buyer Credential Verification (GSTIN / FSSAI)
            </CardTitle>
            <CardDescription className="text-xs">
              Verify legal credentials and institutional procurement licenses of food processors.
            </CardDescription>
          </div>
          <Link href="/verified-buyers">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              Buyer Directory <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {buyerList.map((buyer) => (
              <div key={buyer.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{buyer.name}</span>
                    <Badge className={buyer.status === "Verified" ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"}>
                      {buyer.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    GSTIN: <span className="font-mono text-foreground font-semibold">{buyer.gst}</span> • FSSAI Lic: <span className="font-mono text-foreground font-semibold">{buyer.fssai}</span>
                  </p>
                  <p className="text-muted-foreground">Location: {buyer.location}</p>
                </div>

                {buyer.status !== "Verified" ? (
                  <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                    onClick={() => handleVerifyBuyer(buyer.id)}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Verify & Approve
                  </Button>
                ) : (
                  <Badge className="bg-emerald-500/10 text-emerald-700 text-xs">Verified Partner</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* APMC Mandi Real-time Oversight */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Real-Time APMC Mandi Price Streams
            </CardTitle>
            <CardDescription className="text-xs">
              Live market yards and freight deduction metrics across West Godavari & Krishna.
            </CardDescription>
          </div>
          <Link href="/market-intelligence">
            <Button size="sm" variant="outline" className="text-xs gap-1">
              Intelligence Full View <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Market Yard</th>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Crop</th>
                  <th className="px-4 py-3">Modal Price</th>
                  <th className="px-4 py-3">Freight Deduct</th>
                  <th className="px-4 py-3">Net Realization</th>
                  <th className="px-4 py-3 text-right">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {marketPrices.slice(0, 5).map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-semibold text-foreground">{p.marketName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.district}</td>
                    <td className="px-4 py-3">{p.crop}</td>
                    <td className="px-4 py-3 font-bold">₹{p.modalPrice}/qtl</td>
                    <td className="px-4 py-3 text-rose-600 font-medium">-₹{p.transportCostPerQtl}/qtl</td>
                    <td className="px-4 py-3 font-black text-emerald-600">₹{p.netRealization}/qtl</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-[10px]">
                        +{p.priceChangePercent}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Arbitrate Dispute Modal */}
      {selectedDispute && (
        <Dialog open={Boolean(selectedDispute)} onOpenChange={() => setSelectedDispute(null)}>
          <DialogContent className="sm:max-w-lg">
            <form onSubmit={handleResolveDispute}>
              <DialogHeader>
                <DialogTitle>Arbitrate Dispute #{selectedDispute.disputeCode}</DialogTitle>
                <DialogDescription>
                  Issue a binding platform administrative resolution for {selectedDispute.raisedByName} and {selectedDispute.respondentName}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-3 text-xs">
                <div className="bg-muted/40 p-3 rounded-md space-y-1">
                  <div>Claim Description: <strong className="text-foreground">{selectedDispute.description}</strong></div>
                  <div>Contract ID: <strong className="text-foreground">{selectedDispute.transactionCode}</strong></div>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Administrative Resolution & Settlement Order *</label>
                  <textarea
                    rows={3}
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    className="w-full rounded-md border p-2 text-xs bg-background text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Audit / Investigation Notes</label>
                  <Input
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Weighbridge slips and digital quality assessment checked."
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedDispute(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white" disabled={actionLoading}>
                  {actionLoading ? "Executing Ruling..." : "Execute Settlement Ruling"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
