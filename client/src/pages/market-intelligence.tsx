import { useState, useEffect, useRef } from "react";
import { NavigationHeader } from "@/components/NavigationHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarketPrice, CropHistoricalTrend } from "@shared/schema";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Sparkles, 
  Truck, 
  ArrowRight, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Search
} from "lucide-react";
import { Link } from "wouter";

const CROPS = ["Rice", "Maize", "Tomato", "Chilli", "Onion", "Cotton", "Potato", "Wheat"];

export default function MarketIntelligencePage() {
  const [selectedCrop, setSelectedCrop] = useState<string>("Rice");
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [trendData, setTrendData] = useState<CropHistoricalTrend | null>(null);
  const [bestMarket, setBestMarket] = useState<MarketPrice | null>(null);
  const [recommendationReason, setRecommendationReason] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  // Cache to ensure instant button response when switching between commodities
  const cacheRef = useRef<Record<string, { prices: MarketPrice[]; trends: CropHistoricalTrend; best: any }>>({});

  useEffect(() => {
    fetchMarketData(selectedCrop);
  }, [selectedCrop]);

  const fetchMarketData = async (crop: string) => {
    // If we have cached data for this crop, render it immediately without waiting
    if (cacheRef.current[crop]) {
      const cached = cacheRef.current[crop];
      setMarketPrices(cached.prices);
      setTrendData(cached.trends);
      setBestMarket(cached.best?.bestMarket || null);
      setRecommendationReason(cached.best?.recommendationReason || "");
    } else if (marketPrices.length === 0) {
      setLoading(true);
    }

    try {
      const [pricesRes, trendsRes, compRes] = await Promise.all([
        fetch(`/api/market-prices?crop=${encodeURIComponent(crop)}`),
        fetch(`/api/market-prices/trends?crop=${encodeURIComponent(crop)}`),
        fetch(`/api/market-prices/comparison?crop=${encodeURIComponent(crop)}`),
      ]);

      let prices: MarketPrice[] = [];
      let trends: CropHistoricalTrend | null = null;
      let comp: any = null;

      if (pricesRes.ok) {
        prices = await pricesRes.json();
        setMarketPrices(prices);
      }

      if (trendsRes.ok) {
        trends = await trendsRes.json();
        setTrendData(trends);
      }

      if (compRes.ok) {
        comp = await compRes.json();
        setBestMarket(comp.bestMarket);
        setRecommendationReason(comp.recommendationReason);
      }

      if (prices.length > 0 && trends) {
        cacheRef.current[crop] = { prices, trends, best: comp };
      }
    } catch (err) {
      console.error("Failed to load market data", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavigationHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Market Intelligence</h1>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
                Live Mandi & Net Realization
              </Badge>
              <Badge variant="secondary" className="text-xs text-muted-foreground">
                West Godavari & Coastal AP
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-base">
              Real-time APMC mandi prices, arrival trends, and AI selling window advisories for Bhimavaram and West Godavari district, factoring net freight deductions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/create-lot">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm">
                Create Produce Lot
              </Button>
            </Link>
            <Link href="/buyer-demand">
              <Button variant="outline">
                View Buyer Demand
              </Button>
            </Link>
          </div>
        </div>

        {/* Crop Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground mr-2">Select Commodity:</span>
          {CROPS.map((crop) => (
            <Button
              key={crop}
              variant={selectedCrop === crop ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCrop(crop)}
              className={selectedCrop === crop ? "shadow-sm font-semibold" : "text-muted-foreground"}
            >
              {crop}
            </Button>
          ))}
        </div>

        {/* AI Selling Window Recommendation Card */}
        {trendData?.sellingWindowAdvice && (
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex items-center gap-2 text-primary font-bold tracking-wide uppercase text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                  AI-Assisted Selling Window Recommendation
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Optimal Selling Window:{" "}
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {trendData.sellingWindowAdvice.recommendedWindow}
                  </span>
                </h2>
                <p className="text-foreground/90 text-sm leading-relaxed">
                  {trendData.sellingWindowAdvice.trendAssessment}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-background/80 backdrop-blur rounded-lg p-3 border text-xs space-y-1">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Key Market Drivers:
                    </span>
                    <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pl-1">
                      {trendData.sellingWindowAdvice.keyDrivers.map((d: string, i: number) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-background/80 backdrop-blur rounded-lg p-3 border text-xs space-y-1">
                    <span className="font-semibold text-amber-600 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Risk Factor & Advisory:
                    </span>
                    <p className="text-muted-foreground">{trendData.sellingWindowAdvice.riskFactor}</p>
                    <p className="text-[11px] text-muted-foreground/75 italic pt-1">
                      * Decision-support estimate based on current mandi arrival trends, not a guaranteed price prediction.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                <Badge className="bg-emerald-600 text-white font-semibold px-3 py-1">
                  Confidence: {trendData.sellingWindowAdvice.confidence}
                </Badge>
                <Link href={`/create-lot?crop=${selectedCrop}`}>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium">
                    Sell {selectedCrop} Now
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Best Market Recommendation Banner */}
        {bestMarket && (
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Recommended Mandi (Highest Net Realization)
                </span>
                <p className="text-base font-bold text-foreground">
                  {bestMarket.marketName} ({bestMarket.district}) — ₹{bestMarket.modalPrice}/qtl Gross |{" "}
                  <span className="text-emerald-700 dark:text-emerald-400">₹{bestMarket.netRealization}/qtl Net In Hand</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{recommendationReason}</p>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-xs text-muted-foreground block">Distance from farm</span>
              <span className="text-sm font-semibold">{bestMarket.distanceKm} km (₹{bestMarket.transportCostPerQtl}/qtl freight)</span>
            </div>
          </div>
        )}

        {/* Mandi Price Comparison Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Nearby Mandi Price Comparison ({selectedCrop})
                </CardTitle>
                <CardDescription>
                  Evaluates gross modal prices against freight costs to highlight actual net realization for farmers.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs self-start sm:self-auto">
                Updated Daily at 06:00 AM
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading market prices...</div>
            ) : marketPrices.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No mandi records available for this crop.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                      <th className="py-3 px-4">Market / Mandi</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4 text-right">Modal Price</th>
                      <th className="py-3 px-4 text-right">Range (Min - Max)</th>
                      <th className="py-3 px-4 text-right">Arrival Volume</th>
                      <th className="py-3 px-4 text-right">Est. Distance</th>
                      <th className="py-3 px-4 text-right">Freight / Qtl</th>
                      <th className="py-3 px-4 text-right font-bold text-foreground">Net Realization</th>
                      <th className="py-3 px-4 text-center">Trend (5D)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {marketPrices.map((m) => {
                      const isTop = bestMarket?.id === m.id;
                      return (
                        <tr
                          key={m.id}
                          className={`transition-colors hover:bg-muted/50 ${
                            isTop ? "bg-emerald-500/5 font-medium" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{m.marketName}</span>
                              {isTop && (
                                <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4">
                                  Best Choice
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {m.district}, {m.state}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-foreground">
                            ₹{m.modalPrice.toLocaleString()}/qtl
                          </td>
                          <td className="py-3 px-4 text-right text-muted-foreground text-xs">
                            ₹{m.minPrice} - ₹{m.maxPrice}
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {m.arrivalVolumeTons} Tons
                          </td>
                          <td className="py-3 px-4 text-right text-muted-foreground">
                            {m.distanceKm} km
                          </td>
                          <td className="py-3 px-4 text-right text-amber-600 font-medium text-xs">
                            -₹{m.transportCostPerQtl}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{m.netRealization.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground block">/qtl in hand</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {m.priceTrend5d === "up" && (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-500/20 gap-1 text-xs">
                                <TrendingUp className="w-3 h-3" /> +{m.priceChangePercent}%
                              </Badge>
                            )}
                            {m.priceTrend5d === "down" && (
                              <Badge variant="outline" className="text-rose-600 border-rose-500/20 gap-1 text-xs">
                                <TrendingDown className="w-3 h-3" /> {m.priceChangePercent}%
                              </Badge>
                            )}
                            {m.priceTrend5d === "stable" && (
                              <Badge variant="outline" className="text-muted-foreground gap-1 text-xs">
                                <Minus className="w-3 h-3" /> Stable
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Historical Price & Arrival Trends */}
        {trendData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  7-Day Price Movement & Arrival Volume
                </CardTitle>
                <CardDescription>Daily modal price trends for {selectedCrop}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trendData.history7d.map((pt: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                      <span className="text-muted-foreground font-medium flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {pt.date}
                      </span>
                      <div className="flex items-center gap-6">
                        <span className="text-xs text-muted-foreground">
                          Arrival: <strong className="text-foreground">{pt.arrivalTons}T</strong>
                        </span>
                        <span className="font-bold text-foreground">
                          ₹{pt.avgPrice.toLocaleString()}/qtl
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  30-Day Monthly Trend Snapshot
                </CardTitle>
                <CardDescription>Weekly milestone average prices across state assembly markets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trendData.history30d.map((pt: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                      <span className="text-muted-foreground font-medium flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {pt.date}
                      </span>
                      <div className="flex items-center gap-6">
                        <span className="text-xs text-muted-foreground">
                          Arrival: <strong className="text-foreground">{pt.arrivalTons}T</strong>
                        </span>
                        <span className="font-bold text-foreground">
                          ₹{pt.avgPrice.toLocaleString()}/qtl
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
