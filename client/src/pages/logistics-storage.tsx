import { useState, useEffect } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogisticsOption, StorageFacility } from "@shared/schema";
import { 
  Truck, 
  Warehouse, 
  Calculator, 
  Phone, 
  MapPin, 
  Star, 
  CheckCircle2, 
  Thermometer, 
  ArrowRight
} from "lucide-react";

export default function LogisticsStoragePage() {
  const { toast } = useToast();
  const [logistics, setLogistics] = useState<LogisticsOption[]>([]);
  const [storages, setStorages] = useState<StorageFacility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Net Realization Calculator State
  const [calcQuantity, setCalcQuantity] = useState<number>(100);
  const [calcGrossPrice, setCalcGrossPrice] = useState<number>(2700);
  const [calcDistance, setCalcDistance] = useState<number>(35);
  const [calcStorageMonths, setCalcStorageMonths] = useState<number>(0);

  // Storage reservation modal
  const [reservingStorage, setReservingStorage] = useState<StorageFacility | null>(null);
  const [reserveQty, setReserveQty] = useState<number>(50);
  const [reserveMonths, setReserveMonths] = useState<number>(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logRes, storRes] = await Promise.all([
        fetch("/api/logistics"),
        fetch("/api/storage"),
      ]);
      if (logRes.ok) setLogistics(await logRes.json());
      if (storRes.ok) setStorages(await storRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculator Math
  const grossTotal = calcQuantity * calcGrossPrice;
  const transportCostTotal = Math.round(calcDistance * 28 + 1200); // approx vehicle fare
  const storageCostTotal = calcStorageMonths * calcQuantity * 35;
  const netRealizationTotal = grossTotal - transportCostTotal - storageCostTotal;
  const netPerQuintal = Math.round(netRealizationTotal / (calcQuantity || 1));

  const handleReserveSubmit = async () => {
    if (!reservingStorage) return;
    try {
      const res = await fetch("/api/storage/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageId: reservingStorage.id,
          quantityQuintals: reserveQty,
          durationMonths: reserveMonths,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast({
          title: "Storage Reserved",
          description: data.message,
        });
        setReservingStorage(null);
      }
    } catch (err) {
      console.error(err);
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
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Logistics & Storage</h1>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                Freight & Warehousing
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-base">
              Calculate net farmer realization after transport deductions, coordinate trusted agricultural carriers, and reserve nearby cold chain capacity.
            </p>
          </div>
        </div>

        {/* Section 1: Net Realization Interactive Calculator */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.03] shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Net Realization Calculator
            </CardTitle>
            <CardDescription>
              A higher buyer bid is not always the best deal. Compute actual in-hand realization after deducting freight and storage holding costs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qty">Produce Quantity (Quintals)</Label>
                <Input
                  id="qty"
                  type="number"
                  value={calcQuantity}
                  onChange={(e) => setCalcQuantity(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Offered Price (₹ / Quintal)</Label>
                <Input
                  id="price"
                  type="number"
                  value={calcGrossPrice}
                  onChange={(e) => setCalcGrossPrice(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dist">Delivery Distance (km)</Label>
                <Input
                  id="dist"
                  type="number"
                  value={calcDistance}
                  onChange={(e) => setCalcDistance(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="months">Holding Storage (Months)</Label>
                <Input
                  id="months"
                  type="number"
                  min="0"
                  max="12"
                  value={calcStorageMonths}
                  onChange={(e) => setCalcStorageMonths(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Results Display */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-background border">
              <div>
                <span className="text-xs text-muted-foreground block">Gross Sale Value</span>
                <span className="text-lg font-bold text-foreground">₹{grossTotal.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs text-amber-600 block">Est. Freight Deductions</span>
                <span className="text-lg font-bold text-amber-600">-₹{transportCostTotal.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs text-amber-600 block">Storage Holding Fees</span>
                <span className="text-lg font-bold text-amber-600">-₹{storageCostTotal.toLocaleString()}</span>
              </div>
              <div className="sm:border-l sm:pl-4">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold block">
                  Net Realization (In-Hand)
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ₹{netRealizationTotal.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground block">
                  (₹{netPerQuintal.toLocaleString()} / Quintal)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Transporters & Fleet */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Verified Agricultural Transporters
            </h2>
            <Badge variant="outline" className="text-xs">
              Farm-Gate Pickup Coordination
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {logistics.map((log) => (
              <Card key={log.id} className="flex flex-col justify-between shadow-sm hover:border-primary/40 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        {log.providerName}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">{log.vehicleType}</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{log.rating}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 text-xs pb-4">
                  <div className="bg-muted/40 p-3 rounded-lg space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle Capacity:</span>
                      <strong className="text-foreground">{log.capacityQuintals} Quintals</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Standard Freight Rate:</span>
                      <span className="text-foreground font-semibold">₹{log.costPerKm}/km + ₹{log.baseFare} Base</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Pickup Window:</span>
                      <span className="text-foreground">{log.estimatedPickupHours} Hours</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Service Coverage:</span>
                    <div className="flex flex-wrap gap-1">
                      {log.serviceAreas.map((area) => (
                        <Badge key={area} variant="secondary" className="text-[10px]">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0 border-t flex justify-between items-center text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {log.contactPhone}
                  </span>
                  <Badge className="bg-emerald-600 text-white text-[10px]">Available</Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Section 3: Storage & Cold Chain Facilities */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-primary" />
              Nearby Storage & Cold Warehouses
            </h2>
            <Badge variant="outline" className="text-xs">
              Post-Harvest Loss Mitigation
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {storages.map((facility) => (
              <Card key={facility.id} className="flex flex-col justify-between shadow-sm hover:border-primary/40 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="secondary" className="text-[10px] mb-1">{facility.type}</Badge>
                      <CardTitle className="text-base font-bold text-foreground">
                        {facility.name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{facility.rating}</span>
                    </div>
                  </div>
                  <CardDescription className="text-xs flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    {facility.location} ({facility.distanceKm} km)
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 text-xs pb-4">
                  <div className="bg-muted/40 p-3 rounded-lg space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available Space:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {facility.availableCapacityQuintals.toLocaleString()} / {facility.totalCapacityQuintals.toLocaleString()} Qtl
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Storage Fee:</span>
                      <strong className="text-foreground">₹{facility.costPerQuintalPerMonth}/qtl/month</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Climate Control:</span>
                      {facility.temperatureControl ? (
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px] gap-1">
                          <Thermometer className="w-3 h-3" /> Cold Controlled (2-6°C)
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Ventilated Dry Store</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-muted-foreground block">Suitable Crops:</span>
                    <div className="flex flex-wrap gap-1">
                      {facility.suitableCrops.map((c) => (
                        <Badge key={c} variant="outline" className="text-[10px]">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Button
                    size="sm"
                    onClick={() => setReservingStorage(facility)}
                    className="w-full bg-primary text-white text-xs gap-1"
                  >
                    Reserve Space
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Reservation Modal */}
        {reservingStorage && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-foreground">
                Reserve Capacity at {reservingStorage.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {reservingStorage.type} • Fee: ₹{reservingStorage.costPerQuintalPerMonth}/qtl/month
              </p>

              <div className="space-y-3 text-sm">
                <div className="space-y-1">
                  <Label htmlFor="resQty">Quantity to Store (Quintals)</Label>
                  <Input
                    id="resQty"
                    type="number"
                    value={reserveQty}
                    onChange={(e) => setReserveQty(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="resMonths">Duration (Months)</Label>
                  <Input
                    id="resMonths"
                    type="number"
                    min="1"
                    max="12"
                    value={reserveMonths}
                    onChange={(e) => setReserveMonths(Number(e.target.value))}
                  />
                </div>
                <div className="bg-muted p-3 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Estimated Monthly Holding Fee:</span>
                    <strong>₹{(reserveQty * reservingStorage.costPerQuintalPerMonth).toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-primary font-bold">
                    <span>Total For {reserveMonths} Month(s):</span>
                    <span>₹{(reserveQty * reservingStorage.costPerQuintalPerMonth * reserveMonths).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="ghost" onClick={() => setReservingStorage(null)}>
                  Cancel
                </Button>
                <Button onClick={handleReserveSubmit} className="bg-primary text-white">
                  Confirm Reservation
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
