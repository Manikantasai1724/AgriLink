import { useState, useEffect } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BuyerDemand } from "@shared/schema";
import { 
  Building2, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Star, 
  Truck, 
  CreditCard, 
  ArrowRight,
  Filter,
  PlusCircle
} from "lucide-react";
import { Link } from "wouter";

const CROPS = ["All", "Rice", "Maize", "Chilli", "Tomato", "Onion", "Potato", "Cotton"];
const BUYER_TYPES = ["All", "Processor", "Retailer", "Institutional Buyer", "Trader"];

export default function BuyerDemandPage() {
  const [demands, setDemands] = useState<BuyerDemand[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<string>("All");
  const [selectedBuyerType, setSelectedBuyerType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDemands();
  }, [selectedCrop]);

  const fetchDemands = async () => {
    setLoading(true);
    try {
      const url = selectedCrop === "All" ? "/api/buyer-demands" : `/api/buyer-demands?crop=${selectedCrop}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDemands(data);
      }
    } catch (err) {
      console.error("Failed to load demands", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDemands = demands.filter((d) => {
    const matchesBuyerType = selectedBuyerType === "All" || d.buyerType === selectedBuyerType;
    const matchesSearch = 
      d.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBuyerType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Buyer Demand</h1>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                Verified B2B Procurement
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-base">
              Direct purchase orders published by food processors, retail chains, and institutional aggregators.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/create-lot">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-sm">
                <PlusCircle className="w-4 h-4" />
                Create Produce Lot
              </Button>
            </Link>
            <Link href="/verified-buyers">
              <Button variant="outline">
                Verified Buyers Directory
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-card border rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by buyer name, crop, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Buyer Type:
              </span>
              {BUYER_TYPES.map((type) => (
                <Button
                  key={type}
                  variant={selectedBuyerType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedBuyerType(type)}
                  className="text-xs h-8"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap border-t pt-3">
            <span className="text-xs font-semibold text-muted-foreground">Commodity:</span>
            {CROPS.map((crop) => (
              <Button
                key={crop}
                variant={selectedCrop === crop ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedCrop(crop)}
                className={`text-xs h-7 ${selectedCrop === crop ? "font-bold text-foreground" : "text-muted-foreground"}`}
              >
                {crop}
              </Button>
            ))}
          </div>
        </div>

        {/* Demand Cards Grid */}
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading active procurement demands...</div>
        ) : filteredDemands.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground bg-card border rounded-xl p-8">
            <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground">No matching buyer requirements found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try clearing your filters or search for another commodity.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDemands.map((demand) => (
              <Card key={demand.id} className="flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{demand.buyerType}</span>
                      </div>
                      <CardTitle className="text-lg font-bold text-foreground leading-snug">
                        {demand.buyerName}
                      </CardTitle>
                    </div>

                    {demand.verificationStatus === "Verified" ? (
                      <Badge className="bg-emerald-600 text-white font-medium text-[11px] gap-1 px-2 py-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[11px]">Unverified</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold mt-1">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{demand.reliabilityScore} / 5.0</span>
                    <span className="text-muted-foreground font-normal ml-1">Reliability Score</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 text-sm pb-4">
                  {/* Crop & Quantity Highlight */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground font-medium">Crop Required:</span>
                      <strong className="text-foreground text-base">{demand.crop}</strong>
                    </div>
                    {demand.variety && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Variety:</span>
                        <span className="text-foreground">{demand.variety}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs pt-1 border-t">
                      <span className="text-muted-foreground">Required Volume:</span>
                      <strong className="text-primary font-bold">{demand.requiredQuantity} {demand.unit}</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Minimum Grade:</span>
                      <Badge variant="outline" className="text-xs py-0 h-4">{demand.minQualityGrade}</Badge>
                    </div>
                  </div>

                  {/* Target Price */}
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs text-muted-foreground">Target Procurement Price:</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{demand.targetPricePerUnit.toLocaleString()}/{demand.unit}
                    </span>
                  </div>

                  {/* Logistics & Location */}
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-foreground/70" />
                      <span>{demand.location} ({demand.distanceKm} km away)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-foreground/70" />
                      <span>{demand.pickupRequirement}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-foreground/70" />
                      <span>Delivery By: <strong className="text-foreground">{demand.expectedDeliveryDate}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-foreground/70" />
                      <span>Terms: {demand.paymentTerms}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Link href={`/create-lot?crop=${demand.crop}&buyerDemandId=${demand.id}`} className="w-full">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2">
                      Create Matching Lot
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
