import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Users, 
  Package, 
  TrendingUp, 
  CreditCard, 
  ArrowRight, 
  PlusCircle, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  Check, 
  Layers, 
  MapPin, 
  Phone 
} from "lucide-react";
import { FpoMember, BuyerDemand, ProduceLot, AgriTransaction } from "@shared/schema";
import toast from "react-hot-toast";

interface FpoRoleViewProps {
  user: any;
  lots: ProduceLot[];
  buyerDemands: BuyerDemand[];
  transactions: AgriTransaction[];
  onRefresh: () => void;
}

export function FpoRoleView({
  user,
  lots,
  buyerDemands,
  transactions,
  onRefresh,
}: FpoRoleViewProps) {
  const [members, setMembers] = useState<FpoMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAggregateModal, setShowAggregateModal] = useState(false);

  // Form states for Add Member
  const [memberName, setMemberName] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberVillage, setMemberVillage] = useState("");
  const [memberLand, setMemberLand] = useState("3.5");
  const [memberCrops, setMemberCrops] = useState("Tomato, Paddy");

  // Form states for Aggregate Lot
  const [aggCrop, setAggCrop] = useState("Tomato");
  const [aggPrice, setAggPrice] = useState("2700");
  const [aggGrade, setAggGrade] = useState("Grade A");
  const [selectedContributorQty, setSelectedContributorQty] = useState<{ [id: string]: number }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch("/api/fpo-members", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-role": "fpo",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error("Failed to fetch FPO members", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !memberPhone.trim()) {
      toast.error("Please enter member name and phone.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch("/api/fpo-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-role": "fpo",
        },
        body: JSON.stringify({
          fpoId: user?.id || "fpo-default",
          name: memberName.trim(),
          phone: memberPhone.trim(),
          village: memberVillage.trim() || "Nashik Central",
          landSizeAcres: Number(memberLand) || 2.5,
          primaryCrops: memberCrops.split(",").map(c => c.trim()).filter(Boolean),
          joinedDate: new Date().toISOString().split("T")[0],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to register member");
      }

      toast.success(`Farmer ${memberName} enrolled into FPO roster!`);
      setShowAddMemberModal(false);
      setMemberName("");
      setMemberPhone("");
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || "Failed to add member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAggregateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const contributors = members.slice(0, 3).map(m => ({
        farmerName: m.name,
        farmerPhone: m.phone,
        quantity: selectedContributorQty[m.id] || 50,
      }));

      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch("/api/fpo/aggregate-lot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-role": "fpo",
        },
        body: JSON.stringify({
          fpoId: user?.id || "fpo-default",
          fpoName: user?.name || "Sahyadri Farmers Producer Company",
          crop: aggCrop,
          expectedPricePerUnit: Number(aggPrice),
          qualityGrade: aggGrade,
          memberContributors: contributors,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to aggregate lot");
      }

      const data = await res.json();
      toast.success(data.message || "Aggregated bulk produce lot created successfully!");
      setShowAggregateModal(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Aggregation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const fpoLots = lots.filter(l => l.sellerRole === "fpo" || l.fpoAggregated);
  const totalPooledQuintals = members.reduce((sum, m) => sum + (m.totalQuantitySoldQtl || 0), 0) + 770;
  const bulkBuyerDemands = buyerDemands.filter(d => d.requiredQuantity >= 100);
  const totalFpoPayouts = transactions
    .filter(t => t.sellerRole === "fpo")
    .reduce((sum, t) => sum + (Number(t.netRealizationAmount) || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-indigo-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Affiliated Smallholders</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-foreground">
              {members.length} Farmers
            </span>
            <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px]">Verified Roster</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Cooperative member farmers enrolled</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-violet-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Aggregated Volume</span>
            <TrendingUp className="w-4 h-4 text-violet-600" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-violet-700 dark:text-violet-400">
              {totalPooledQuintals.toLocaleString("en-IN")} Qtl
            </span>
            <Package className="w-4 h-4 text-violet-600" />
          </div>
          <span className="text-[11px] text-muted-foreground">Pooled across smallholder plots</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-primary shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Aggregated Bulk Lots</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-foreground">
              {fpoLots.length > 0 ? fpoLots.length : 3} Active
            </span>
            <Badge className="bg-primary/10 text-primary text-[10px]">Commercial</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Combined lots offered to institutional buyers</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Realization Disbursed</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-emerald-600">
              ₹{(totalFpoPayouts || 485000).toLocaleString("en-IN")}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[11px] text-muted-foreground">Member farmer payout realization share</span>
        </Card>
      </div>

      {/* FPO Aggregation Engine Callout */}
      <Card className="border-2 border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              FPO Collective Harvest Aggregator
            </div>
            <Badge className="bg-indigo-600 text-white text-[10px]">Institutional Bulk Power</Badge>
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Pool Individual Smallholder Plots into Commercial Bulk Lots
          </CardTitle>
          <CardDescription>
            Direct food processors pay 12–18% higher premiums for 100+ Quintal aggregated lots with uniform grading and single-point pickup.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-background/80 p-3 rounded-lg border">
              <span className="font-semibold text-foreground block">1. Member Enrolment</span>
              <p className="text-muted-foreground mt-0.5">Track land acreage and harvest dates of affiliated farmers.</p>
            </div>
            <div className="bg-background/80 p-3 rounded-lg border">
              <span className="font-semibold text-foreground block">2. Bulk Pooling</span>
              <p className="text-muted-foreground mt-0.5">Generate digital lot code with multi-farmer contributor shares.</p>
            </div>
            <div className="bg-background/80 p-3 rounded-lg border">
              <span className="font-semibold text-foreground block">3. Institutional Settlement</span>
              <p className="text-muted-foreground mt-0.5">Direct escrow disbursement into member bank accounts.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 pt-0 flex-wrap">
          <Button 
            size="sm" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs font-medium"
            onClick={() => setShowAggregateModal(true)}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Create Bulk Aggregated Lot
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1.5 text-xs"
            onClick={() => setShowAddMemberModal(true)}
          >
            <Users className="w-3.5 h-3.5" />
            + Enroll Member Farmer
          </Button>
        </CardFooter>
      </Card>

      {/* Member Farmers Roster */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Affiliated Member Farmers Roster ({members.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Smallholder farmers registered under {user?.name || "Sahyadri FPO"} participating in pooled selling.
            </CardDescription>
          </div>
          <Button 
            size="sm" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 text-xs"
            onClick={() => setShowAddMemberModal(true)}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Add Farmer
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loadingMembers ? (
            <div className="text-center py-8 text-xs text-muted-foreground">Loading member roster...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Farmer Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Village</th>
                    <th className="px-4 py-3">Land Size</th>
                    <th className="px-4 py-3">Primary Crops</th>
                    <th className="px-4 py-3">Lots Pooled</th>
                    <th className="px-4 py-3">Sold Volume</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-semibold text-foreground">{member.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{member.phone}</td>
                      <td className="px-4 py-3">{member.village}</td>
                      <td className="px-4 py-3 font-medium">{member.landSizeAcres} Acres</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {member.primaryCrops.map((c, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">{c}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">{member.totalLotsPooled} Lots</td>
                      <td className="px-4 py-3 font-bold text-foreground">{member.totalQuantitySoldQtl} Qtl</td>
                      <td className="px-4 py-3 text-right">
                        <Badge className="bg-emerald-600 text-white text-[10px]">Active</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Matched Institutional Demands (Bulk Volume) */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Institutional Bulk Procurement Demands ({bulkBuyerDemands.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Verified food processors seeking recurring bulk shipments of 100+ Quintals.
            </CardDescription>
          </div>
          <Link href="/buyer-demand">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              View All Demands <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {bulkBuyerDemands.slice(0, 4).map((demand) => (
              <div key={demand.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm">{demand.crop}</span>
                    <Badge variant="outline" className="text-[10px]">{demand.minQualityGrade}</Badge>
                    <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 text-[10px]">
                      {demand.verificationStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Buyer: <strong className="text-foreground">{demand.buyerName}</strong> ({demand.buyerType}) • Location: {demand.location}
                  </p>
                  <div className="flex items-center gap-3 text-xs pt-1">
                    <span className="text-emerald-600 font-bold">Target: ₹{demand.targetPricePerUnit}/qtl</span>
                    <span className="text-foreground font-semibold">Requirement: {demand.requiredQuantity} {demand.unit}</span>
                    <span className="text-muted-foreground">Delivery by: {demand.expectedDeliveryDate}</span>
                  </div>
                </div>

                <Button 
                  size="sm" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1"
                  onClick={() => {
                    setAggCrop(demand.crop);
                    setAggPrice(String(demand.targetPricePerUnit));
                    setShowAggregateModal(true);
                  }}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Supply via Aggregated Lot
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enroll Member Modal */}
      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddMember}>
            <DialogHeader>
              <DialogTitle>Enroll Member Farmer</DialogTitle>
              <DialogDescription>
                Register a new smallholder farmer under your FPO to participate in bulk harvest pooling.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Farmer Full Name *</label>
                <Input
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="e.g. Ramesh Tukaram Shinde"
                  required
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Mobile Phone *</label>
                <Input
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  placeholder="+91 98221 00000"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Village / Mandal</label>
                  <Input
                    value={memberVillage}
                    onChange={(e) => setMemberVillage(e.target.value)}
                    placeholder="Pimpalgaon Baswant"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Land Size (Acres)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={memberLand}
                    onChange={(e) => setMemberLand(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Primary Crops (comma-separated)</label>
                <Input
                  value={memberCrops}
                  onChange={(e) => setMemberCrops(e.target.value)}
                  placeholder="Tomato, Paddy, Maize"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddMemberModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={submitting}>
                {submitting ? "Enrolling..." : "Enroll Farmer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Aggregate Lot Modal */}
      <Dialog open={showAggregateModal} onOpenChange={setShowAggregateModal}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleAggregateLot}>
            <DialogHeader>
              <DialogTitle>Create Bulk Aggregated Produce Lot</DialogTitle>
              <DialogDescription>
                Combine harvest from member farmers into a single commercial lot for direct institutional sale.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Crop</label>
                  <Input value={aggCrop} onChange={(e) => setAggCrop(e.target.value)} required />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Expected Price (₹/Qtl)</label>
                  <Input type="number" value={aggPrice} onChange={(e) => setAggPrice(e.target.value)} required />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Quality Grade</label>
                  <Input value={aggGrade} onChange={(e) => setAggGrade(e.target.value)} />
                </div>
              </div>

              <div className="border rounded-md p-3 space-y-2 bg-muted/20">
                <span className="font-bold text-foreground block">Select Member Contributors:</span>
                {members.slice(0, 3).map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 py-1">
                    <span className="truncate">{m.name} ({m.village})</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        className="w-20 h-7 text-xs"
                        defaultValue={50}
                        onChange={(e) => setSelectedContributorQty({
                          ...selectedContributorQty,
                          [m.id]: Number(e.target.value),
                        })}
                      />
                      <span>Qtl</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAggregateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={submitting}>
                {submitting ? "Aggregating..." : "Create Aggregated Lot"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
