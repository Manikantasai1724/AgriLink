import { useState, useEffect } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { FpoMember } from "@shared/schema";
import { 
  Users, 
  Layers, 
  PlusCircle, 
  ArrowRight, 
  TrendingUp, 
  Package, 
  CheckCircle2,
  Building2,
  Phone,
  MapPin
} from "lucide-react";

export default function FpoAggregationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [members, setMembers] = useState<FpoMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Aggregation Pooling State
  const [selectedCrop, setSelectedCrop] = useState<string>("Tomato");
  const [pooledFarmers, setPooledFarmers] = useState<{ [farmerId: string]: number }>({});
  const [expectedPrice, setExpectedPrice] = useState<number>(2750);
  const [qualityGrade, setQualityGrade] = useState<string>("Grade A");
  const [aggregating, setAggregating] = useState<boolean>(false);

  // Add Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>("");
  const [newMemberPhone, setNewMemberPhone] = useState<string>("");
  const [newMemberVillage, setNewMemberVillage] = useState<string>("");
  const [newMemberAcres, setNewMemberAcres] = useState<number>(3.5);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fpo/members?fpoId=${user?.id || "fpo-default"}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
        // Pre-fill pooling with default quantities for demo ease
        const initialPool: { [id: string]: number } = {};
        data.forEach((m: FpoMember, idx: number) => {
          initialPool[m.id] = (idx + 1) * 25; // 25, 50, 75 quintals
        });
        setPooledFarmers(initialPool);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalPooledQty = Object.values(pooledFarmers).reduce((sum, q) => sum + (Number(q) || 0), 0);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/fpo/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fpoId: user?.id || "fpo-default",
          name: newMemberName,
          phone: newMemberPhone,
          village: newMemberVillage,
          landSizeAcres: Number(newMemberAcres),
          primaryCrops: [selectedCrop],
        }),
      });

      if (res.ok) {
        const newMember = await res.json();
        setMembers((prev) => [...prev, newMember]);
        setPooledFarmers((prev) => ({ ...prev, [newMember.id]: 30 }));
        setShowAddMemberModal(false);
        setNewMemberName("");
        setNewMemberPhone("");
        setNewMemberVillage("");
        toast({
          title: "Member Enrolled",
          description: `${newMember.name} added to FPO registry.`,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAggregatedLot = async () => {
    if (totalPooledQty <= 0) return;
    setAggregating(true);
    try {
      const contributorArray = members
        .filter((m) => (pooledFarmers[m.id] || 0) > 0)
        .map((m) => ({
          farmerName: m.name,
          farmerPhone: m.phone,
          quantity: pooledFarmers[m.id] || 0,
        }));

      const payload = {
        fpoId: user?.id || "fpo-default",
        fpoName: user?.name || "Sahyadri Farmers Producer Company",
        crop: selectedCrop,
        expectedPricePerUnit: expectedPrice,
        qualityGrade,
        memberContributors: contributorArray,
      };

      const res = await fetch("/api/fpo/aggregate-lot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Aggregated Lot Created",
          description: data.message,
        });
        setLocation(`/offers-matches?lotId=${data.lot.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAggregating(false);
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
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">FPO Produce Aggregation</h1>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                Bulk Institutional Procurement
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-base">
              Combine smaller farm harvests into commercial bulk lots to negotiate higher wholesale prices with processors and retailers.
            </p>
          </div>

          <Button
            onClick={() => setShowAddMemberModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Add Member Farmer
          </Button>
        </div>

        {/* FPO High-Level Aggregation Analytics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 shadow-sm">
            <span className="text-xs text-muted-foreground font-medium block">Total Member Farmers</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-foreground">{members.length} Farmers</span>
              <Users className="w-5 h-5 text-primary" />
            </div>
          </Card>

          <Card className="p-4 shadow-sm">
            <span className="text-xs text-muted-foreground font-medium block">Cumulative Volume Sold</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-foreground">770 Quintals</span>
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
          </Card>

          <Card className="p-4 shadow-sm">
            <span className="text-xs text-muted-foreground font-medium block">Avg Price Realization</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹2,680/qtl</span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </Card>

          <Card className="p-4 shadow-sm">
            <span className="text-xs text-muted-foreground font-medium block">Institutional Contracts</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-foreground">5 Active</span>
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
          </Card>
        </div>

        {/* Aggregation Workflow Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Member Farmers Contributor Pooling */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Member Produce Pooling ({members.length} Members)
              </h2>
              <Badge variant="outline" className="text-xs">
                Select quantities to pool
              </Badge>
            </div>

            <div className="space-y-3">
              {members.map((member) => {
                const pooled = pooledFarmers[member.id] || 0;
                return (
                  <div
                    key={member.id}
                    className="bg-card border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                        {member.name}
                        <Badge variant="secondary" className="text-[10px]">{member.village}</Badge>
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>Land: {member.landSizeAcres} Acres</span>
                        <span>Crops: {member.primaryCrops.join(", ")}</span>
                        <span>Phone: {member.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-xs font-semibold text-muted-foreground">Contributed (Qtl):</span>
                      <Input
                        type="number"
                        min="0"
                        value={pooled}
                        onChange={(e) =>
                          setPooledFarmers((prev) => ({
                            ...prev,
                            [member.id]: Number(e.target.value),
                          }))
                        }
                        className="w-24 h-9 font-bold text-center"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Aggregated Bulk Lot Creator Box */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-primary/20 sticky top-20 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Bulk Aggregated Lot
                </CardTitle>
                <CardDescription>
                  Generate unified FPO lot for direct B2B matching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="bg-muted/50 rounded-xl p-4 text-center space-y-1">
                  <span className="text-xs text-muted-foreground font-semibold block uppercase">
                    Total Pooled Quantity
                  </span>
                  <span className="text-3xl font-black text-primary block">
                    {totalPooledQty} Quintals
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    from {Object.values(pooledFarmers).filter((v) => v > 0).length} contributing farmers
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aggCrop">Crop Commodity</Label>
                  <Input
                    id="aggCrop"
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aggPrice">FPO Asking Price (₹/Quintal)</Label>
                  <Input
                    id="aggPrice"
                    type="number"
                    value={expectedPrice}
                    onChange={(e) => setExpectedPrice(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aggGrade">Standardized Quality Grade</Label>
                  <select
                    id="aggGrade"
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  >
                    <option value="Grade A">Grade A (Premium Institutional)</option>
                    <option value="Grade B">Grade B (Commercial Retail)</option>
                    <option value="Grade C">Grade C (Processing Pulp)</option>
                  </select>
                </div>

                <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Estimated Gross Contract:</span>
                    <strong className="text-foreground">₹{(totalPooledQty * expectedPrice).toLocaleString()}</strong>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  onClick={handleCreateAggregatedLot}
                  disabled={aggregating || totalPooledQty <= 0}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold gap-2"
                >
                  {aggregating ? "Pooling..." : "Create Bulk Lot & Match Buyers"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-foreground">Enroll New Member Farmer</h3>
              <form onSubmit={handleAddMember} className="space-y-3 text-sm">
                <div className="space-y-1">
                  <Label htmlFor="mName">Farmer Full Name *</Label>
                  <Input
                    id="mName"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="e.g. Dattatray B. Gaikwad"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mPhone">Phone Number *</Label>
                  <Input
                    id="mPhone"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    placeholder="+91 98220 XXXXX"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mVillage">Village / Taluka *</Label>
                  <Input
                    id="mVillage"
                    value={newMemberVillage}
                    onChange={(e) => setNewMemberVillage(e.target.value)}
                    placeholder="e.g. Bhimavaram, West Godavari"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mAcres">Land Holding (Acres)</Label>
                  <Input
                    id="mAcres"
                    type="number"
                    step="0.1"
                    value={newMemberAcres}
                    onChange={(e) => setNewMemberAcres(Number(e.target.value))}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setShowAddMemberModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary text-white">
                    Enroll Farmer
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
