import { useState } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  ShieldCheck, 
  ArrowRight,
  Upload,
  Info
} from "lucide-react";

const CROPS = ["Rice", "Maize", "Tomato", "Chilli", "Onion", "Cotton", "Potato", "Wheat"];
const GRADES = ["Grade A", "Grade B", "Grade C", "Standard"];

const REGIONAL_PRESETS = [
  { label: "Bhimavaram (Home)", location: "Bhimavaram, West Godavari, Andhra Pradesh", market: "Bhimavaram Market Yard" },
  { label: "Palakollu (18 km)", location: "Palakollu, West Godavari, Andhra Pradesh", market: "Palakollu APMC" },
  { label: "Tanuku (32 km)", location: "Tanuku, West Godavari, Andhra Pradesh", market: "Tanuku Market Committee" },
  { label: "Tadepalligudem (44 km)", location: "Tadepalligudem, West Godavari, Andhra Pradesh", market: "Tadepalligudem APMC Mandi" },
  { label: "Eluru (72 km)", location: "Eluru, Andhra Pradesh", market: "Eluru Agricultural Market" },
  { label: "Vijayawada (118 km)", location: "Vijayawada, Krishna, Andhra Pradesh", market: "Vijayawada APMC (Gollapudi)" },
  { label: "Guntur (142 km)", location: "Guntur, Andhra Pradesh", market: "Guntur Mirchi Yard (APMC)" },
];

export default function CreateLotPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [crop, setCrop] = useState<string>("Rice");
  const [variety, setVariety] = useState<string>("BPT 5204 Samba Masuri");
  const [quantity, setQuantity] = useState<number>(100);
  const [unit, setUnit] = useState<string>("Quintal");
  const [harvestDate, setHarvestDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [expectedSellingDate, setExpectedSellingDate] = useState<string>(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );
  const [farmLocation, setFarmLocation] = useState<string>(user?.location || "Bhimavaram, West Godavari, Andhra Pradesh");
  const [preferredMarket, setPreferredMarket] = useState<string>("Bhimavaram Market Yard");
  const [expectedPrice, setExpectedPrice] = useState<number>(2750);
  const [qualityGrade, setQualityGrade] = useState<string>("Grade A");
  const [pickupRequirement, setPickupRequirement] = useState<string>("Buyer Pickup");
  const [storageRequirement, setStorageRequirement] = useState<string>("Ambient / Dry Shed");

  // Quality parameters
  const [moisturePercent, setMoisturePercent] = useState<number>(12);
  const [defectPercent, setDefectPercent] = useState<number>(2.5);
  const [sizeCategory, setSizeCategory] = useState<string>("Medium (50-65mm)");
  const [colorUniformity, setColorUniformity] = useState<string>("Consistent Deep Red");

  // AI Quality Analysis State
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const runAiQualityCheck = async () => {
    setAiAnalyzing(true);
    try {
      const res = await fetch("/api/quality/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop,
          moisturePercent,
          defectPercent,
          sizeCategory,
          colorUniformity,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiResult(data);
        if (data.suggestedGrade) {
          setQualityGrade(data.suggestedGrade);
        }
        toast({
          title: "AI Quality Assessment Complete",
          description: `Suggested: ${data.suggestedGrade} based on current parameters.`,
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Assessment Failed",
        description: "Could not complete automated quality analysis.",
        variant: "destructive",
      });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmitLot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        sellerId: user?.id || "anonymous-farmer",
        sellerName: user?.name || "Farmer",
        sellerRole: user?.role === "fpo" ? "fpo" : "farmer",
        crop,
        variety,
        quantity: Number(quantity),
        unit,
        harvestDate,
        expectedSellingDate,
        location: farmLocation,
        preferredMarket,
        expectedPricePerUnit: Number(expectedPrice),
        qualityGrade,
        qualityParameters: {
          moisturePercent: Number(moisturePercent),
          defectPercent: Number(defectPercent),
          sizeCategory,
          colorUniformity,
          aiAssistedGrade: aiResult?.suggestedGrade,
          aiNotes: aiResult?.observations?.join("; "),
        },
        pickupRequirement,
        storageRequirement,
      };

      const res = await fetch("/api/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const lot = await res.json();
        toast({
          title: "Produce Lot Created Successfully",
          description: `Lot ID ${lot.lotNumber} registered. Matching buyers now...`,
        });
        setLocation(`/offers-matches?lotId=${lot.id}`);
      } else {
        const err = await res.json();
        toast({
          title: "Submission Failed",
          description: err.message || "Failed to create produce lot.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Network error submitting lot.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="border-b pb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Create Digital Produce Lot</h1>
            <Badge className="bg-primary text-primary-foreground font-semibold">
              AgriLink Trade
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Register your harvest batch to instantly match with verified institutional buyers, processors, and traders.
          </p>
        </div>

        <form onSubmit={handleSubmitLot} className="space-y-8">
          {/* Section 1: Basic Commodity Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Commodity & Batch Details
              </CardTitle>
              <CardDescription>Enter quantity, harvest timing, and pricing expectations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crop">Crop Commodity *</Label>
                  <select
                    id="crop"
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  >
                    {CROPS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="variety">Variety / Hybrid *</Label>
                  <Input
                    id="variety"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder="e.g. Vaishnavi Hybrid / Pusa 1121"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit of Measurement</Label>
                  <select
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  >
                    <option value="Quintal">Quintal (100 kg)</option>
                    <option value="Ton">Metric Ton (1,000 kg)</option>
                    <option value="Kilogram">Kilogram (kg)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedPrice">Target Price (₹/{unit}) *</Label>
                  <Input
                    id="expectedPrice"
                    type="number"
                    min="100"
                    value={expectedPrice}
                    onChange={(e) => setExpectedPrice(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="harvestDate">Harvest Date</Label>
                  <Input
                    id="harvestDate"
                    type="date"
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellingDate">Expected Ready-to-Sell Date</Label>
                  <Input
                    id="sellingDate"
                    type="date"
                    value={expectedSellingDate}
                    onChange={(e) => setExpectedSellingDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="farmLocation">Farm / Pickup Location *</Label>
                    <span className="text-[11px] text-muted-foreground">Bhimavaram & West Godavari belt</span>
                  </div>
                  <Input
                    id="farmLocation"
                    value={farmLocation}
                    onChange={(e) => setFarmLocation(e.target.value)}
                    placeholder="Village, District, State"
                    required
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {REGIONAL_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setFarmLocation(p.location);
                          setPreferredMarket(p.market);
                        }}
                        className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                          farmLocation === p.location
                            ? "bg-primary text-primary-foreground font-semibold border-primary"
                            : "bg-muted/50 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickupReq">Logistics & Pickup Preference</Label>
                  <select
                    id="pickupReq"
                    value={pickupRequirement}
                    onChange={(e) => setPickupRequirement(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                  >
                    <option value="Buyer Pickup">Buyer Arranges Pickup at Farm Gate</option>
                    <option value="Seller Delivery">Seller Arranges Delivery to Hub</option>
                    <option value="Flexible">Flexible / Mutual Agreement</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Quality Parameters & AI Grading */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Quality & Grading Parameters
                  </CardTitle>
                  <CardDescription>
                    Provide visual inspection parameters or invoke AI-assisted grading
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={runAiQualityCheck}
                  disabled={aiAnalyzing}
                  className="text-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5 self-start sm:self-auto"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  {aiAnalyzing ? "Assessing Quality..." : "AI-Assisted Quality Check"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade">Selected Quality Grade</Label>
                  <select
                    id="grade"
                    value={qualityGrade}
                    onChange={(e) => setQualityGrade(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm font-semibold"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moisture">Moisture Content (%)</Label>
                  <Input
                    id="moisture"
                    type="number"
                    step="0.1"
                    value={moisturePercent}
                    onChange={(e) => setMoisturePercent(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defect">Defect / Blemish (%)</Label>
                  <Input
                    id="defect"
                    type="number"
                    step="0.1"
                    value={defectPercent}
                    onChange={(e) => setDefectPercent(Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size Classification</Label>
                  <Input
                    id="size"
                    value={sizeCategory}
                    onChange={(e) => setSizeCategory(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color Uniformity</Label>
                  <Input
                    id="color"
                    value={colorUniformity}
                    onChange={(e) => setColorUniformity(e.target.value)}
                  />
                </div>
              </div>

              {/* AI Assessment Result Callout */}
              {aiResult && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> AI-Assisted Assessment Result
                    </span>
                    <Badge className="bg-emerald-600 text-white font-semibold text-xs">
                      Suggested Grade: {aiResult.suggestedGrade}
                    </Badge>
                  </div>
                  <ul className="text-xs text-foreground/80 list-disc list-inside space-y-0.5">
                    {aiResult.observations?.map((obs: string, idx: number) => (
                      <li key={idx}>{obs}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-muted-foreground/80 italic pt-1 border-t">
                    * {aiResult.disclaimer}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/dashboard")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 gap-2 shadow-sm"
            >
              {submitting ? "Publishing Lot..." : "Publish Produce Lot & Match Buyers"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
