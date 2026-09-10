import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Truck, 
  Building2, 
  Package, 
  CreditCard, 
  ArrowRight, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Navigation, 
  ThermometerSnowflake, 
  ShieldCheck 
} from "lucide-react";
import { LogisticsOption, StorageFacility, AgriTransaction } from "@shared/schema";
import toast from "react-hot-toast";

interface LogisticsRoleViewProps {
  user: any;
  transactions: AgriTransaction[];
  onRefresh: () => void;
}

export function LogisticsRoleView({
  user,
  transactions,
  onRefresh,
}: LogisticsRoleViewProps) {
  const [logistics, setLogistics] = useState<LogisticsOption[]>([]);
  const [storageList, setStorageList] = useState<StorageFacility[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showAddStorageModal, setShowAddStorageModal] = useState(false);

  // Form states for vehicle
  const [providerName, setProviderName] = useState(user?.company || "Kisan Logistics Express");
  const [vehicleType, setVehicleType] = useState("10-Ton Eicher Heavy Truck");
  const [capacity, setCapacity] = useState("100");
  const [costPerKm, setCostPerKm] = useState("32");
  const [baseFare, setBaseFare] = useState("1500");
  const [phone, setPhone] = useState("+91 98230 11234");
  const [serviceAreas, setServiceAreas] = useState("West Godavari, Krishna, East Godavari");

  // Form states for storage facility
  const [facilityName, setFacilityName] = useState("Godavari Cold Storage Hub");
  const [facilityType, setFacilityType] = useState<"Cold Storage" | "Warehouse">("Cold Storage");
  const [facilityLocation, setFacilityLocation] = useState("Bhimavaram Agro Industrial Zone");
  const [totalCapacity, setTotalCapacity] = useState("5000");
  const [availCapacity, setAvailCapacity] = useState("2400");
  const [ratePerMonth, setRatePerMonth] = useState("75");

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchLogisticsData();
  }, []);

  const fetchLogisticsData = async () => {
    setLoadingData(true);
    try {
      const [logRes, storRes] = await Promise.all([
        fetch("/api/logistics-options"),
        fetch("/api/storage-facilities"),
      ]);
      if (logRes.ok) setLogistics(await logRes.json());
      if (storRes.ok) setStorageList(await storRes.json());
    } catch (err) {
      console.error("Logistics fetch error", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAdvanceStatus = async (txnId: string, nextStatus: string) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch(`/api/agri-transactions/${txnId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-role": "logistics",
        },
        body: JSON.stringify({
          status: nextStatus,
          logisticsDetails: {
            transporterName: user?.name || "Kisan Express Logistics",
            transporterPhone: user?.phone || "+91 98230 11234",
            vehicleNumber: "AP-37-AG-8812",
            estimatedDelivery: nextStatus === "Delivered" ? "Delivered" : "In Transit (ETA 8 hrs)",
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update consignment status");
      }

      toast.success(`Consignment updated to '${nextStatus}'!`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch("/api/logistics-options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-role": "logistics",
        },
        body: JSON.stringify({
          providerName,
          vehicleType,
          capacityQuintals: Number(capacity),
          costPerKm: Number(costPerKm),
          baseFare: Number(baseFare),
          contactPhone: phone,
          serviceAreas: serviceAreas.split(",").map(a => a.trim()),
          available: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to add vehicle");
      toast.success("Fleet vehicle registered!");
      setShowAddVehicleModal(false);
      fetchLogisticsData();
    } catch (err: any) {
      toast.error(err.message || "Failed to register vehicle");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddStorage = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch("/api/storage-facilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-role": "logistics",
        },
        body: JSON.stringify({
          name: facilityName,
          type: facilityType,
          location: facilityLocation,
          district: "West Godavari",
          distanceKm: 8,
          totalCapacityQuintals: Number(totalCapacity),
          availableCapacityQuintals: Number(availCapacity),
          costPerQuintalPerMonth: Number(ratePerMonth),
          temperatureControl: facilityType === "Cold Storage",
          suitableCrops: ["Paddy", "Chilli", "Tomato", "Horticulture"],
          contactPhone: phone,
        }),
      });

      if (!res.ok) throw new Error("Failed to add storage");
      toast.success("Storage facility capacity registered!");
      setShowAddStorageModal(false);
      fetchLogisticsData();
    } catch (err: any) {
      toast.error(err.message || "Failed to register facility");
    } finally {
      setActionLoading(false);
    }
  };

  const activeShipments = transactions.filter(t => t.status === "Logistics Arranged" || t.status === "In Transit" || t.status === "Offer Accepted");
  const totalFleetCapacity = logistics.reduce((sum, l) => sum + (l.capacityQuintals || 0), 0) + 240;
  const totalAvailableStorage = storageList.reduce((sum, s) => sum + (s.availableCapacityQuintals || 0), 0) + 4800;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-cyan-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Active Consignments</span>
            <Truck className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-foreground">
              {activeShipments.length} Active
            </span>
            <Badge className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-[10px]">Transit Ops</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Farm-to-buyer haulage jobs</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-primary shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Fleet Capacity</span>
            <Navigation className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-foreground">
              {totalFleetCapacity} Qtl
            </span>
            <Badge className="bg-primary/10 text-primary text-[10px]">Available</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">{logistics.length} verified haulage vehicles</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Cold Storage Available</span>
            <ThermometerSnowflake className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-blue-600">
              {totalAvailableStorage.toLocaleString("en-IN")} Qtl
            </span>
            <Badge className="bg-blue-500/10 text-blue-700 text-[10px]">Capacity</Badge>
          </div>
          <span className="text-[11px] text-muted-foreground">Temperature controlled warehouses</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium block">Freight Settlements</span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-black text-emerald-600">
              ₹{(activeShipments.reduce((sum, s) => sum + (s.logisticsCost || 0), 0) + 38500).toLocaleString("en-IN")}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[11px] text-muted-foreground">Transporter freight payout disbursement</span>
        </Card>
      </div>

      {/* Active Consignments Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-600" />
              Active Consignments & Dispatch Progression ({activeShipments.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Update transit milestones from farm pickup to buyer gate delivery.
            </CardDescription>
          </div>
          <Link href="/transactions">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              All Shipments <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {activeShipments.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">No active consignments pending dispatch.</div>
          ) : (
            <div className="divide-y">
              {activeShipments.map((txn) => (
                <div key={txn.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">{txn.crop}</span>
                      <Badge variant="outline" className="text-[10px]">#{txn.transactionCode}</Badge>
                      <Badge className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 text-[10px]">
                        {txn.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pickup: <strong className="text-foreground">{txn.sellerName}</strong> • Delivery: <strong className="text-foreground">{txn.buyerName}</strong>
                    </p>
                    <div className="flex items-center gap-3 text-xs pt-1">
                      <span className="font-semibold text-foreground">Payload: {txn.quantity} {txn.unit}</span>
                      <span className="text-emerald-600 font-bold">Freight Value: ₹{(txn.logisticsCost || 4500).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {txn.status === "Offer Accepted" && (
                      <Button 
                        size="sm" 
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1"
                        disabled={actionLoading}
                        onClick={() => handleAdvanceStatus(txn.id, "Logistics Arranged")}
                      >
                        <Navigation className="w-3.5 h-3.5" /> Assign Transport
                      </Button>
                    )}
                    {txn.status === "Logistics Arranged" && (
                      <Button 
                        size="sm" 
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1"
                        disabled={actionLoading}
                        onClick={() => handleAdvanceStatus(txn.id, "In Transit")}
                      >
                        <Truck className="w-3.5 h-3.5" /> Start Transit
                      </Button>
                    )}
                    {txn.status === "In Transit" && (
                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                        disabled={actionLoading}
                        onClick={() => handleAdvanceStatus(txn.id, "Delivered")}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Delivery
                      </Button>
                    )}
                    {txn.status === "Delivered" && (
                      <Badge className="bg-emerald-600 text-white text-xs">Delivered to Buyer</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fleet & Cold Storage Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Operators */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" />
                Transport Fleet Rate Cards
              </CardTitle>
              <CardDescription className="text-xs">Per-km rates and capacity per vehicle.</CardDescription>
            </div>
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setShowAddVehicleModal(true)}>
              <PlusCircle className="w-3.5 h-3.5" /> Add Vehicle
            </Button>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {logistics.slice(0, 4).map((l) => (
              <div key={l.id} className="p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground block">{l.providerName} - {l.vehicleType}</span>
                  <span className="text-muted-foreground">Capacity: {l.capacityQuintals} Qtl • Base: ₹{l.baseFare}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 block">₹{l.costPerKm} / km</span>
                  <Badge className="bg-emerald-500/10 text-emerald-700 text-[10px]">Available</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Cold Storage & Warehouses */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Warehouse & Cold Storage Facilities
              </CardTitle>
              <CardDescription className="text-xs">Capacity reservations and monthly rates.</CardDescription>
            </div>
            <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setShowAddStorageModal(true)}>
              <PlusCircle className="w-3.5 h-3.5" /> Add Facility
            </Button>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {storageList.slice(0, 4).map((s) => (
              <div key={s.id} className="p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground block">{s.name}</span>
                  <span className="text-muted-foreground">{s.location} • {s.type}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground block">{s.availableCapacityQuintals} Qtl Left</span>
                  <span className="text-muted-foreground text-[10px]">₹{s.costPerQuintalPerMonth}/qtl/mo</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Add Vehicle Modal */}
      <Dialog open={showAddVehicleModal} onOpenChange={setShowAddVehicleModal}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddVehicle}>
            <DialogHeader>
              <DialogTitle>Register Fleet Transport Vehicle</DialogTitle>
              <DialogDescription>Add a vehicle to your verified transport network.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Operator / Company Name *</label>
                <Input value={providerName} onChange={(e) => setProviderName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Vehicle Type</label>
                  <Input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Capacity (Quintals) *</label>
                  <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Cost Per Km (₹) *</label>
                  <Input type="number" value={costPerKm} onChange={(e) => setCostPerKm(e.target.value)} required />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Base Fare (₹) *</label>
                  <Input type="number" value={baseFare} onChange={(e) => setBaseFare(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Service Areas (Districts)</label>
                <Input value={serviceAreas} onChange={(e) => setServiceAreas(e.target.value)} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddVehicleModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground" disabled={actionLoading}>
                Register Vehicle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Storage Facility Modal */}
      <Dialog open={showAddStorageModal} onOpenChange={setShowAddStorageModal}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddStorage}>
            <DialogHeader>
              <DialogTitle>Register Storage Facility</DialogTitle>
              <DialogDescription>List available warehouse or cold storage capacity.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Facility Name *</label>
                <Input value={facilityName} onChange={(e) => setFacilityName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Facility Location</label>
                  <Input value={facilityLocation} onChange={(e) => setFacilityLocation(e.target.value)} />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Total Capacity (Qtl)</label>
                  <Input type="number" value={totalCapacity} onChange={(e) => setTotalCapacity(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Available Capacity (Qtl)</label>
                  <Input type="number" value={availCapacity} onChange={(e) => setAvailCapacity(e.target.value)} />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Rate (₹/Qtl/Month)</label>
                  <Input type="number" value={ratePerMonth} onChange={(e) => setRatePerMonth(e.target.value)} />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowAddStorageModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={actionLoading}>
                Register Storage Capacity
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
